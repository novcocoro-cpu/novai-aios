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
      room: 3,
      promptKey: "prompt_tech",
      modelKey: "model_tech",
      defaultSystemPrompt: DEFAULT_PROMPTS.prompt_tech,
      defaultModel: DEFAULT_PROMPTS.model_tech,
      defaultTitle: "技術相談",
      content: content.trim(),
      conversationId: conversationId ?? null,
    });

    return jsonResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[tech] error:", message);
    return jsonResponse({ error: message }, 500);
  }
}
