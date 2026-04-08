"use client";

import { memo, useState, useRef } from "react";
import ChatPanel from "@/components/ChatPanel";
import StrategyPanel from "@/components/panels/StrategyPanel";
import { useChat } from "@/hooks/useChat";

/* チャット部分を分離し、state変更が右パネルに伝播しないようにする */
const StrategyChatSection = memo(function StrategyChatSection({
  setLoadingFlag,
  sendRef,
  lastAiRef,
  defaultInput,
  handoffButton,
}: {
  setLoadingFlag: (v: boolean) => void;
  sendRef: React.MutableRefObject<((msg: string) => void) | null>;
  lastAiRef: React.MutableRefObject<string>;
  defaultInput?: string;
  handoffButton?: { label: string; onClick: (lastAiContent: string) => void };
}) {
  const { messages, loading, sendMessage, messagesEndRef } = useChat("/api/chat/strategy", "strategy");

  sendRef.current = sendMessage;

  // 最後のAIメッセージをrefに保持
  const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
  lastAiRef.current = lastAi?.content || "";

  const prevLoading = useRef(loading);
  if (prevLoading.current !== loading) {
    prevLoading.current = loading;
    setLoadingFlag(loading);
  }

  return (
    <ChatPanel
      badge="ROOM-01"
      badgeClass="badge-gold"
      title="戦略・相場 AIチャット"
      bubbleClass="bubble-ai"
      placeholder="戦略・相場について質問する..."
      aiLabel="AI STRATEGIST"
      messages={messages}
      loading={loading}
      onSend={sendMessage}
      messagesEndRef={messagesEndRef}
      defaultInput={defaultInput}
      handoffButton={handoffButton}
    />
  );
});

export default function RoomStrategy({
  onHandoff,
  initialMessage,
}: {
  onHandoff?: (target: string, message: string) => void;
  initialMessage?: string | null;
}) {
  const [, setChatLoading] = useState(false);
  const sendRef = useRef<((msg: string) => void) | null>(null);
  const lastAiRef = useRef("");

  const handoffButton = onHandoff
    ? {
        label: "この戦略を営業ルームに引き継ぐ →",
        onClick: () => {
          const summary = lastAiRef.current.slice(0, 300);
          onHandoff(
            "room2",
            `【戦略ルームからの引き継ぎ】\n${summary}\n\nこの戦略を踏まえて提案書を作成してください。`
          );
        },
      }
    : undefined;

  return (
    <div className="room-layout">
      <StrategyChatSection
        setLoadingFlag={setChatLoading}
        sendRef={sendRef}
        lastAiRef={lastAiRef}
        defaultInput={initialMessage || undefined}
        handoffButton={handoffButton}
      />
      <StrategyPanel />
    </div>
  );
}
