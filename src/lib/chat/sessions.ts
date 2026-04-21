import { createServerClient } from "../supabase/server";
import { getSetting } from "../settings";
import type { ChatSession, Room } from "../supabase/types";

export async function createSession(
  userId: string,
  roomNumber: Room,
  title?: string,
): Promise<ChatSession> {
  const supabase = createServerClient("mekki_shared");
  const activeModel = await getSetting<string>("active_model");

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      room_number: roomNumber,
      title: title ?? `新しい会話 ${new Date().toLocaleString("ja-JP")}`,
      status: "active",
      model_used: activeModel,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChatSession;
}

export async function completeSession(sessionId: string): Promise<void> {
  const supabase = createServerClient("mekki_shared");
  const { error } = await supabase
    .from("chat_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  const supabase = createServerClient("mekki_shared");
  const { data } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  return (data as ChatSession | null) ?? null;
}

export async function listActiveSessions(
  userId: string,
  roomNumber: Room,
): Promise<ChatSession[]> {
  const supabase = createServerClient("mekki_shared");
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("room_number", roomNumber)
    .eq("status", "active")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ChatSession[];
}
