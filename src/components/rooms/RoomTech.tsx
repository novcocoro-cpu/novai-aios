"use client";

import { memo, useState, useRef, useCallback } from "react";
import ChatPanel from "@/components/ChatPanel";
import TechPanel from "@/components/panels/TechPanel";
import { useChat } from "@/hooks/useChat";

const TechChatSection = memo(function TechChatSection({
  setLoadingFlag,
  sendRef,
  defaultInput,
}: {
  setLoadingFlag: (v: boolean) => void;
  sendRef: React.MutableRefObject<((msg: string) => void) | null>;
  defaultInput?: string;
}) {
  const { messages, loading, sendMessage, messagesEndRef } = useChat("/api/chat/tech", "tech");

  sendRef.current = sendMessage;

  const prevLoading = useRef(loading);
  if (prevLoading.current !== loading) {
    prevLoading.current = loading;
    setLoadingFlag(loading);
  }

  return (
    <ChatPanel
      badge="ROOM-03"
      badgeClass="badge-blue"
      title="開発・調達 AIチャット"
      bubbleClass="bubble-blue"
      btnClass="send-btn-blue"
      placeholder="技術・調達について調査依頼する..."
      aiLabel="AI TECH ADVISOR"
      messages={messages}
      loading={loading}
      onSend={sendMessage}
      messagesEndRef={messagesEndRef}
      defaultInput={defaultInput}
    />
  );
});

export default function RoomTech({
  initialMessage,
}: {
  initialMessage?: string | null;
}) {
  const [chatLoading, setChatLoading] = useState(false);
  const sendRef = useRef<((msg: string) => void) | null>(null);

  const handleResearch = useCallback((query: string) => {
    sendRef.current?.(query);
  }, []);

  return (
    <div className="room-layout">
      <TechChatSection
        setLoadingFlag={setChatLoading}
        sendRef={sendRef}
        defaultInput={initialMessage || undefined}
      />
      <TechPanel onResearch={handleResearch} disabled={chatLoading} />
    </div>
  );
}
