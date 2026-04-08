const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const CLAUDE_MODEL = "claude-sonnet-4-6-20250514";

export async function callClaude(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  temperature: number = 0.3
): Promise<string> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_API_KEY" || !ANTHROPIC_API_KEY.startsWith("sk-ant-")) {
    throw new Error(
      "ANTHROPIC_API_KEY が未設定です。.env.local に正しい API キーを設定してください。\n" +
      "取得先: https://console.anthropic.com/settings/keys"
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    if (res.status === 401) {
      throw new Error(
        "APIキーが無効です（401 Unauthorized）。console.anthropic.com で新しいキーを発行し、.env.local の ANTHROPIC_API_KEY を更新してください。"
      );
    }
    throw new Error(`Claude API error: ${res.status} — ${error}`);
  }

  const data = await res.json();
  return data.content[0].text;
}
