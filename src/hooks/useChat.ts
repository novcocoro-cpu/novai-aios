"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function useChat(endpoint: string, room: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs to avoid stale closures
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // Load latest conversation from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/conversations?room=${room}`);
        const data = await res.json();
        if (!cancelled && data.conversations?.length > 0) {
          const latest = data.conversations[0];
          if (latest.messages?.length > 0) {
            const restored: ChatMessage[] = latest.messages.map((m: { role: string; content: string; timestamp?: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: m.timestamp
                ? new Date(m.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
                : "--:--",
            }));
            setMessages(restored);
            setConversationId(latest.id);
          }
        }
      } catch {
        // Supabase not available, start fresh
      } finally {
        if (!cancelled) setInitialized(true);
      }
    })();
    return () => { cancelled = true; };
  }, [room]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || loadingRef.current) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: content.trim(),
        timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      };

      const updatedMessages = [...messagesRef.current, userMsg];
      setMessages(updatedMessages);
      setLoading(true);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: userMsg.content,
            conversationId: conversationIdRef.current,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText);
        }

        const data = await res.json();

        const aiMsg: ChatMessage = {
          role: "assistant",
          content: data.content,
          timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, aiMsg]);

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      } catch (err) {
        const errorMsg: ChatMessage = {
          role: "assistant",
          content: `エラーが発生しました: ${err instanceof Error ? err.message : "不明なエラー"}`,
          timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  return { messages, loading, sendMessage, messagesEndRef, setMessages, initialized };
}
