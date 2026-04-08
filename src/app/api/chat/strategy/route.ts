import { NextRequest } from "next/server";
import { callClaude } from "@/lib/claude";
import { callGeminiWithSearch } from "@/lib/gemini";
import { supabaseSchema, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEFAULT_PROMPTS } from "@/lib/default-prompts";
import { saveConversation } from "@/lib/conversation-store";
import { jsonResponse } from "@/lib/api-response";
import { getCompanyContextString } from "@/lib/company-context";

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId } = await req.json();

    let systemPrompt = DEFAULT_PROMPTS.prompt_strategy;
    let temperature = 0.3;
    let model = DEFAULT_PROMPTS.model_strategy;
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseSchema("shared").from("settings").select("key, value").in("key", ["prompt_strategy", "temperature", "model_strategy"]);
      if (error) console.error("[strategy] settings fetch failed:", error.message);
      if (data) {
        for (const row of data) {
          if (row.key === "prompt_strategy") systemPrompt = row.value;
          if (row.key === "temperature") temperature = parseFloat(row.value);
          if (row.key === "model_strategy") model = row.value;
        }
      }
    }

    const companyContext = await getCompanyContextString();
    let content: string;

    if (model === "claude-sonnet-4-6") {
      const apiKey = process.env.ANTHROPIC_API_KEY || "";
      if (!apiKey || apiKey === "YOUR_ANTHROPIC_API_KEY" || !apiKey.startsWith("sk-ant-")) {
        return jsonResponse({
          error: "APIキー未設定です。設定画面でANTHROPIC_API_KEYを入力するか、Geminiモデルに切り替えてください。",
        }, 400);
      }
      content = await callClaude(systemPrompt + companyContext, messages, temperature);
    } else {
      content = await callGeminiWithSearch(systemPrompt + companyContext, messages, temperature);
    }

    const allMessages = [...messages, { role: "assistant", content, timestamp: new Date().toISOString() }];
    const title = messages[0]?.content?.slice(0, 50) || "戦略相談";
    const savedId = await saveConversation("strategy", conversationId, allMessages, title);

    return jsonResponse({ content, conversationId: savedId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[strategy] error:", message);
    return jsonResponse({ error: message }, 500);
  }
}
