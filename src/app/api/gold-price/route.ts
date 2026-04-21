import { createServerClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/api-response";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const FALLBACK_PRICE = 14820;

let cachedPrice = FALLBACK_PRICE;
let cachedAt: string | null = null;

async function fetchGoldPriceFromGemini(): Promise<number | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "今日の金（ゴールド）の日本円での1グラムあたりの小売価格を数字だけ答えてください。単位や説明は不要です。例: 14820",
                },
              ],
            },
          ],
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0 },
        }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.filter((p: { text?: string }) => p.text)
      ?.map((p: { text: string }) => p.text)
      ?.join("") || "";

    const match = text.replace(/,/g, "").match(/(\d{4,6})/);
    if (match) {
      const price = parseInt(match[1], 10);
      if (price >= 3000 && price <= 50000) {
        return price;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const freshPrice = await fetchGoldPriceFromGemini();
    const now = new Date().toISOString();
    const supabase = createServerClient("mekki_room1");

    if (freshPrice) {
      await supabase
        .from("market_data")
        .upsert({ key: "gold_price_jpy", value: freshPrice, source: "gemini", updated_at: now });
      cachedPrice = freshPrice;
      cachedAt = now;

      return jsonResponse({
        price: freshPrice,
        updated_at: now,
        source: "gemini",
      });
    }

    const { data } = await supabase
      .from("market_data")
      .select("value, updated_at")
      .eq("key", "gold_price_jpy")
      .single();

    if (data) {
      return jsonResponse({
        price: Number(data.value),
        updated_at: data.updated_at,
        source: "cache",
      });
    }

    return jsonResponse({
      price: cachedPrice,
      updated_at: cachedAt,
      source: "fallback",
    });
  } catch {
    return jsonResponse({
      price: cachedPrice || FALLBACK_PRICE,
      updated_at: cachedAt,
      source: "fallback",
    });
  }
}
