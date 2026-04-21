import { createServerClient } from "../supabase/server";
import { getSetting } from "../settings";
import type { MessageRole } from "../supabase/types";

const DEFAULT_SLIDING_WINDOW = 20;

export interface AIContext {
  summary: string | null;
  recentMessages: Array<{ role: MessageRole; content: string }>;
}

export async function getContextForAI(sessionId: string): Promise<AIContext> {
  const supabase = createServerClient("mekki_shared");
  const slidingWindow =
    (await getSetting<number>("sliding_window_size")) ?? DEFAULT_SLIDING_WINDOW;

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("summary")
    .eq("id", sessionId)
    .maybeSingle();

  const { data: recent } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(slidingWindow);

  const recentMessages = (recent ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      role: m.role as MessageRole,
      content: m.content as string,
    }));

  return {
    summary: (session?.summary as string | null) ?? null,
    recentMessages,
  };
}
