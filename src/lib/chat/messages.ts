import { createServerClient } from "../supabase/server";
import type { ChatMessage, MessageRole } from "../supabase/types";

export interface SaveMessageOpts {
  modelUsed?: string | null;
  tokenCount?: number;
  attachments?: Array<{ file_id: string; filename: string }>;
  extraMetadata?: Record<string, unknown>;
}

export async function saveMessage(
  sessionId: string,
  role: MessageRole,
  content: string,
  opts: SaveMessageOpts = {},
): Promise<ChatMessage> {
  const supabase = createServerClient("mekki_shared");
  const metadata: Record<string, unknown> = { ...(opts.extraMetadata ?? {}) };
  if (opts.tokenCount != null) metadata.token_count = opts.tokenCount;

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
      model_used: opts.modelUsed ?? null,
      attachments: opts.attachments ?? [],
      metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChatMessage;
}
