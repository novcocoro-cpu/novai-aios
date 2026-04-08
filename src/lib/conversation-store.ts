// 会話の保存・取得を一元管理するモジュール
// Supabase接続時はDB保存、未接続時はメモリ保存（開発用）

import { supabaseSchema, isSupabaseConfigured } from "./supabase-server";

export interface StoredConversation {
  id: string;
  room: string;
  title: string;
  messages: { role: string; content: string; timestamp?: string }[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

// メモリストア（Supabase未接続時の開発用フォールバック）
const memoryStore: Map<string, StoredConversation> = new Map();
let memoryCounter = 0;

const ROOM_SCHEMA = {
  strategy: "room1",
  sales: "room2",
  tech: "room3",
} as const;

type RoomName = keyof typeof ROOM_SCHEMA;

export async function saveConversation(
  room: RoomName,
  conversationId: string | null,
  messages: { role: string; content: string; timestamp?: string }[],
  title: string
): Promise<string | null> {
  if (isSupabaseConfigured) {
    return saveToSupabase(room, conversationId, messages, title);
  }
  return saveToMemory(room, conversationId, messages, title);
}

export async function loadConversations(room?: RoomName): Promise<StoredConversation[]> {
  if (isSupabaseConfigured) {
    return loadFromSupabase(room);
  }
  return loadFromMemory(room);
}

// ── Supabase ──

async function saveToSupabase(
  room: RoomName,
  conversationId: string | null,
  messages: { role: string; content: string; timestamp?: string }[],
  title: string
): Promise<string | null> {
  const schema = ROOM_SCHEMA[room];
  const client = supabaseSchema(schema);

  if (conversationId) {
    const { error } = await client.from("conversations").update({
      messages,
      updated_at: new Date().toISOString(),
    }).eq("id", conversationId);

    if (error) {
      console.error(`[Supabase] ${schema}.conversations UPDATE failed:`, error.message);
      return conversationId;
    }
    return conversationId;
  } else {
    const { data, error } = await client.from("conversations").insert({
      title,
      messages,
      tags: [],
    }).select("id").single();

    if (error) {
      console.error(`[Supabase] ${schema}.conversations INSERT failed:`, error.message);
      // フォールバック：メモリに保存
      return saveToMemory(room, null, messages, title);
    }
    return data?.id ?? null;
  }
}

async function loadFromSupabase(room?: RoomName): Promise<StoredConversation[]> {
  const all: StoredConversation[] = [];

  type SchemaName = "room1" | "room2" | "room3";
  const schemas: { schema: SchemaName; room: RoomName }[] = room
    ? [{ schema: ROOM_SCHEMA[room], room }]
    : [
        { schema: "room1", room: "strategy" },
        { schema: "room2", room: "sales" },
        { schema: "room3", room: "tech" },
      ];

  for (const { schema, room: roomName } of schemas) {
    const { data, error } = await supabaseSchema(schema)
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error(`[Supabase] ${schema}.conversations SELECT failed:`, error.message);
      // フォールバック：メモリから取得
      const mem = loadFromMemory(roomName);
      all.push(...mem);
      continue;
    }

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      all.push(...data.map((c: any) => ({ ...c, room: roomName })));
    }
  }

  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return all.slice(0, 50);
}

// ── メモリ（開発フォールバック） ──

function saveToMemory(
  room: RoomName,
  conversationId: string | null,
  messages: { role: string; content: string; timestamp?: string }[],
  title: string
): string {
  if (conversationId && memoryStore.has(conversationId)) {
    const existing = memoryStore.get(conversationId)!;
    existing.messages = messages;
    existing.updated_at = new Date().toISOString();
    return conversationId;
  }

  const id = `mem_${++memoryCounter}_${Date.now()}`;
  memoryStore.set(id, {
    id,
    room,
    title,
    messages,
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return id;
}

function loadFromMemory(room?: RoomName): StoredConversation[] {
  const all = Array.from(memoryStore.values());
  const filtered = room ? all.filter((c) => c.room === room) : all;
  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
