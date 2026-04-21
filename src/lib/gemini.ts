const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const DEFAULT_MODEL = "gemini-2.5-flash";

async function callGeminiOnce(
  systemPrompt: string,
  contents: { role: string; parts: { text: string }[] }[],
  temperature: number,
  model: string
): Promise<string | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        tools: [{ googleSearch: {} }],
        generationConfig: {
          temperature,
        },
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${error}`);
  }

  const data = await res.json();

  if (!data.candidates?.[0]?.content?.parts) {
    return null; // empty response
  }

  const textParts = data.candidates[0].content.parts
    .filter((p: { text?: string }) => p.text)
    .map((p: { text: string }) => p.text);

  const result = textParts.join("\n");
  return result || null;
}

export async function callGeminiWithSearch(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  temperature: number = 0.3,
  model: string = DEFAULT_MODEL
): Promise<string> {
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  // First attempt
  const first = await callGeminiOnce(systemPrompt, contents, temperature, model);
  if (first) return first;

  // Retry once on empty response
  console.warn("[gemini] Empty response, retrying once...");
  const second = await callGeminiOnce(systemPrompt, contents, temperature, model);
  if (second) return second;

  throw new Error("AIからの応答が空でした。内容を変えてもう一度お試しください。");
}
