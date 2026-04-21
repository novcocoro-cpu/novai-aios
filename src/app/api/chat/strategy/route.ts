import { NextRequest } from "next/server";
import { runChatTurn } from "@/lib/chat/pipeline";
import { DEFAULT_PROMPTS } from "@/lib/default-prompts";
import { jsonResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { content, conversationId } = await req.json();
    if (typeof content !== "string" || !content.trim()) {
      return jsonResponse({ error: "content が空です" }, 400);
    }

    const result = await runChatTurn({
      room: 1,
      promptKey: "prompt_strategy",
      modelKey: "model_strategy",
      defaultSystemPrompt: DEFAULT_PROMPTS.prompt_strategy,
      defaultModel: DEFAULT_PROMPTS.model_strategy,
      defaultTitle: "戦略相談",
      content: content.trim(),
      conversationId: conversationId ?? null,
    });

    return jsonResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[strategy] error:", message);
    return jsonResponse({ error: message }, 500);
  }
}
