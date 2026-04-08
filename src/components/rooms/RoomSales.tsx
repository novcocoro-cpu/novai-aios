"use client";

import { memo, useState, useCallback, useRef } from "react";
import ChatPanel from "@/components/ChatPanel";
import SalesPanel from "@/components/panels/SalesPanel";
import { useChat, type ChatMessage } from "@/hooks/useChat";

const SalesChatSection = memo(function SalesChatSection({
  setMessagesRef,
  setLoadingFlag,
  lastAiRef,
  defaultInput,
  handoffButton,
}: {
  setMessagesRef: React.MutableRefObject<React.Dispatch<React.SetStateAction<ChatMessage[]>> | null>;
  setLoadingFlag: (v: boolean) => void;
  lastAiRef: React.MutableRefObject<string>;
  defaultInput?: string;
  handoffButton?: { label: string; onClick: (lastAiContent: string) => void };
}) {
  const { messages, loading, sendMessage, messagesEndRef, setMessages } = useChat("/api/chat/sales", "sales");

  setMessagesRef.current = setMessages;

  const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
  lastAiRef.current = lastAi?.content || "";

  const prevLoading = useRef(loading);
  if (prevLoading.current !== loading) {
    prevLoading.current = loading;
    setLoadingFlag(loading);
  }

  return (
    <ChatPanel
      badge="ROOM-02"
      badgeClass="badge-teal"
      title="営業支援 AIチャット"
      bubbleClass="bubble-teal"
      btnClass="send-btn-teal"
      placeholder="営業戦略・提案書について相談する..."
      aiLabel="AI SALES COACH"
      messages={messages}
      loading={loading}
      onSend={sendMessage}
      messagesEndRef={messagesEndRef}
      defaultInput={defaultInput}
      handoffButton={handoffButton}
    />
  );
});

export default function RoomSales({
  onHandoff,
  initialMessage,
}: {
  onHandoff?: (target: string, message: string) => void;
  initialMessage?: string | null;
}) {
  const setMessagesRef = useRef<React.Dispatch<React.SetStateAction<ChatMessage[]>> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const lastAiRef = useRef("");

  const handleGenerate = useCallback(async (params: { customerName: string; mainType: string; bundles: string[]; targetAmount: number }) => {
    const addMessage = setMessagesRef.current;
    if (!addMessage) return;

    setGenerating(true);
    const now = () => new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    const bundleList = params.bundles.join("・");

    const userMsg: ChatMessage = {
      role: "user",
      content: `【提案書生成】${params.customerName}向け\n${params.mainType} + 抱き合わせ: ${bundleList}\n月額目標: ${params.targetAmount}万円`,
      timestamp: now(),
    };
    addMessage((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/generate/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.content || `エラー: ${data.error || "不明"}`,
        timestamp: now(),
      };
      addMessage((prev) => [...prev, aiMsg]);
    } catch (err) {
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: `エラーが発生しました: ${err instanceof Error ? err.message : "不明"}`,
        timestamp: now(),
      };
      addMessage((prev) => [...prev, aiMsg]);
    } finally {
      setGenerating(false);
    }
  }, []);

  const handoffButton = onHandoff
    ? {
        label: "この提案内容を開発ルームで調査 →",
        onClick: () => {
          const summary = lastAiRef.current.slice(0, 300);
          onHandoff(
            "room3",
            `【営業ルームからの引き継ぎ】\n${summary}\n\nこの内容を実現するための技術・調達先を調査してください。`
          );
        },
      }
    : undefined;

  return (
    <div className="room-layout">
      <SalesChatSection
        setMessagesRef={setMessagesRef}
        setLoadingFlag={setChatLoading}
        lastAiRef={lastAiRef}
        defaultInput={initialMessage || undefined}
        handoffButton={handoffButton}
      />
      <SalesPanel onGenerate={handleGenerate} generating={generating || chatLoading} />
    </div>
  );
}
