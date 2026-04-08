import { NextRequest } from "next/server";
import { callClaude } from "@/lib/claude";
import { callGeminiWithSearch } from "@/lib/gemini";
import { supabaseSchema, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEFAULT_PROMPTS } from "@/lib/default-prompts";
import { jsonResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { customerName, mainType, bundles, targetAmount } = await req.json();

    const systemPrompt = `あなたは金属メッキ業界の営業提案書作成AIです。
顧客向けの提案書を簡潔に生成してください。
構成: 課題提示 → 解決策（パッケージ提案）→ 数字（見積もり）→ 行動喚起
余計な締めくくりや定型文は不要です。`;

    const userMessage = `以下の条件で提案書を作成してください：
- 顧客名: ${customerName}
- 主要メッキ種別: ${mainType}
- 抱き合わせ種別: ${bundles.join("、")}
- 月額目標金額: ${targetAmount}万円

金メッキ単独では赤字リスクがあるため、抱き合わせによるパッケージ提案を軸にしてください。`;

    // 提案書は営業ルームのモデル設定に従う
    let model = DEFAULT_PROMPTS.model_sales;
    if (isSupabaseConfigured) {
      const { data } = await supabaseSchema("shared").from("settings").select("key, value").eq("key", "model_sales");
      if (data?.[0]) model = data[0].value;
    }

    let content: string;
    const msgs = [{ role: "user", content: userMessage }];

    if (model === "claude-sonnet-4-6") {
      const apiKey = process.env.ANTHROPIC_API_KEY || "";
      if (!apiKey || apiKey === "YOUR_ANTHROPIC_API_KEY" || !apiKey.startsWith("sk-ant-")) {
        return jsonResponse({
          error: "APIキー未設定です。設定画面でANTHROPIC_API_KEYを入力するか、Geminiモデルに切り替えてください。",
        }, 400);
      }
      content = await callClaude(systemPrompt, msgs, 0.3);
    } else {
      content = await callGeminiWithSearch(systemPrompt, msgs, 0.3);
    }

    if (isSupabaseConfigured) {
      const { error } = await supabaseSchema("room2").from("proposals").insert({
        customer_name: customerName,
        main_plating: mainType,
        bundle_types: bundles,
        target_amount: targetAmount,
        content,
      });
      if (error) console.error("[proposal] save failed:", error.message);
    }

    return jsonResponse({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[proposal] error:", message);
    return jsonResponse({ error: message }, 500);
  }
}
