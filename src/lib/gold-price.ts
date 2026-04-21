import { createServerClient } from "./supabase/server";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

export async function fetchGoldPriceFromGemini(): Promise<number | null> {
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
      },
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
      if (price >= 3000 && price <= 50000) return price;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveGoldPrice(
  price: number,
  source: string = "gemini",
): Promise<{ updated_at: string }> {
  const fetched_at = new Date().toISOString();
  const supabase = createServerClient("mekki_room1");
  const { error } = await supabase
    .from("gold_prices")
    .insert({ fetched_at, price_jpy_per_gram: price, source });
  if (error) {
    console.error("[gold-price] insert failed:", error.message);
    throw new Error(error.message);
  }
  return { updated_at: fetched_at };
}

export async function readCachedGoldPrice(): Promise<{
  price: number;
  updated_at: string;
} | null> {
  const supabase = createServerClient("mekki_room1");
  const { data, error } = await supabase
    .from("gold_prices")
    .select("price_jpy_per_gram, fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    price: Number(data.price_jpy_per_gram),
    updated_at: data.fetched_at,
  };
}
