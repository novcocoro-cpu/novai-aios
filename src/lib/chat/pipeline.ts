import { createSession } from "./sessions";
import { saveMessage } from "./messages";
import { getContextForAI } from "./context";
import { getSetting } from "../settings";
import { callClaude, type LlmResult } from "../claude";
import { callGeminiWithSearch } from "../gemini";
import { getCompanyContextString } from "../company-context";
import type { Room } from "../supabase/types";

export interface RunChatTurnInput {
  room: Room;
  promptKey: string;
  modelKey: string;
  defaultSystemPrompt: string;
  defaultModel: string;
  defaultTitle: string;
  content: string;
  conversationId: string | null;
}

export interface RunChatTurnOutput {
  content: string;
  conversationId: string;
}

const DEFAULT_TEMPERATURE = 0.3;

function callModel(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
): Promise<LlmResult> {
  if (model.startsWith("claude")) {
    return callClaude(systemPrompt, messages, temperature);
  }
  if (model.startsWith("gemini")) {
    return callGeminiWithSearch(systemPrompt, messages, temperature);
  }
  throw new Error(`Unknown model prefix: ${model}`);
}

export async function runChatTurn(input: RunChatTurnInput): Promise<RunChatTurnOutput> {
  const defaultUserId = process.env.DEFAULT_USER_ID;
  if (!defaultUserId) {
    throw new Error("DEFAULT_USER_ID が未設定です。.env.local を確認してください。");
  }

  const systemPromptRaw =
    (await getSetting<string>(input.promptKey)) ?? input.defaultSystemPrompt;
  const modelRaw = (await getSetting<string>(input.modelKey)) ?? input.defaultModel;
  const temperatureRaw = await getSetting<number | string>("temperature");
  const temperature =
    typeof temperatureRaw === "number"
      ? temperatureRaw
      : typeof temperatureRaw === "string"
        ? Number(temperatureRaw) || DEFAULT_TEMPERATURE
        : DEFAULT_TEMPERATURE;

  let sessionId = input.conversationId;
  if (!sessionId) {
    const title = input.content.slice(0, 50) || input.defaultTitle;
    const session = await createSession(defaultUserId, input.room, title);
    sessionId = session.id;
  }

  const { summary, recentMessages: prior } = await getContextForAI(sessionId);
  const recentMessages = [...prior, { role: "user", content: input.content }];

  const companyContext = await getCompanyContextString();
  const summaryBlock = summary ? `【これまでの経緯の要約】\n${summary}\n\n` : "";
  const fullSystemPrompt = summaryBlock + systemPromptRaw + companyContext;

  const { text: answer, usage } = await callModel(
    modelRaw,
    fullSystemPrompt,
    recentMessages,
    temperature,
  );

  await saveMessage(sessionId, "user", input.content, {
    tokenCount: usage.input_tokens,
  });
  await saveMessage(sessionId, "assistant", answer, {
    modelUsed: modelRaw,
    tokenCount: usage.output_tokens,
  });

  return { content: answer, conversationId: sessionId };
}
