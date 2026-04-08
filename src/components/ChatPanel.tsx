"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import type { ChatMessage } from "@/hooks/useChat";
import {
  copyToClipboard,
  exportSingleCsv,
  exportSingleWord,
  exportAllCsv,
  exportAllWord,
} from "@/utils/export";

interface ChatPanelProps {
  badge: string;
  badgeClass: string;
  title: string;
  roomName?: string;
  bubbleClass: string;
  btnClass?: string;
  placeholder: string;
  aiLabel: string;
  messages: ChatMessage[];
  loading: boolean;
  onSend: (msg: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  defaultInput?: string;
  handoffButton?: { label: string; onClick: (lastAiContent: string) => void };
}

export default function ChatPanel({
  badge,
  badgeClass,
  title,
  roomName,
  bubbleClass,
  btnClass = "",
  placeholder,
  aiLabel,
  messages,
  loading,
  onSend,
  messagesEndRef,
  defaultInput,
  handoffButton,
}: ChatPanelProps) {
  const effectiveRoomName = roomName || title;
  const [input, setInput] = useState(defaultInput || "");
  const [interimText, setInterimText] = useState("");
  const [recording, setRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; text: string } | null>(null);
  const [parsing, setParsing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleSend = () => {
    if ((!input.trim() && !attachedFile) || loading || parsing) return;

    let messageToSend = input.trim();

    if (attachedFile) {
      const fileContext = `\n\n【添付ファイル：${attachedFile.name}】\n${attachedFile.text}\n上記ファイルの内容を参考にして回答してください。`;
      messageToSend = messageToSend ? messageToSend + fileContext : `添付ファイルの内容について教えてください。${fileContext}`;
      setAttachedFile(null);
    }

    onSend(messageToSend);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // リセット（同じファイルの再選択を可能に）
    e.target.value = "";

    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "ファイルの解析に失敗しました");
        return;
      }

      setAttachedFile({ name: data.fileName, text: data.text });
    } catch {
      alert("ファイルのアップロードに失敗しました");
    } finally {
      setParsing(false);
    }
  };

  const [micError, setMicError] = useState("");

  const toggleVoice = useCallback(async () => {
    setMicError("");

    // If currently recording, stop
    if (recording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("音声入力はGoogle Chromeでのみ使用できます。Chromeでお開きください。");
      return;
    }

    // Check microphone permission and availability
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setMicError("マイクの使用を許可してください。アドレスバー左の鍵アイコン → マイクを「許可」に変更してください。");
      } else if (e.name === "NotFoundError") {
        setMicError("マイクが見つかりません。PCにマイクが接続されているか確認してください。");
      } else if (e.name === "NotReadableError" || e.name === "AbortError") {
        setMicError("マイクが他のアプリで使用中か、無効になっています。Windowsの設定 → プライバシー → マイクで有効にしてください。");
      } else {
        setMicError(`マイクエラー: ${e.name} - ${e.message}`);
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentInterim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          setInput((prev) => prev + transcript);
          setInterimText("");
          setTimeout(adjustTextareaHeight, 0);
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }
      if (currentInterim) {
        setInterimText(currentInterim);
      }
    };

    recognition.onstart = () => {
      setRecording(true);
      setInterimText("");
      setMicError("");
    };

    recognition.onend = () => {
      setRecording(false);
      setInterimText("");
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setMicError("マイクの使用を許可してください。アドレスバー左の鍵アイコン → マイクを「許可」に変更してください。");
      } else if (event.error === "network") {
        setMicError("ネットワークエラーです。インターネット接続を確認してください。");
      } else if (event.error === "no-speech") {
        setMicError("音声が検出されませんでした。もう一度お試しください。");
      } else if (event.error !== "aborted") {
        setMicError(`音声認識エラー: ${event.error}`);
      }
      setRecording(false);
      setInterimText("");
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (e) {
      setMicError("音声入力の開始に失敗しました。ページを再読み込みしてお試しください。");
      setRecording(false);
      recognitionRef.current = null;
    }
  }, [recording, adjustTextareaHeight]);

  return (
    <div className="chat-area">
      <div className="chat-header">
        <span className={`room-badge ${badgeClass}`}>{badge}</span>
        <span className="chat-title">{title}</span>
        {messages.some((m) => m.role === "assistant") && (
          <div className="export-header-btns">
            <button
              className="export-btn"
              onClick={() => exportAllWord(effectiveRoomName, messages)}
              title="全会話をWordで保存"
            >📄 全てWord</button>
            <button
              className="export-btn"
              onClick={() => exportAllCsv(effectiveRoomName, messages)}
              title="全会話をCSVで保存"
            >📊 全てCSV</button>
          </div>
        )}
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role === "user" ? "msg-user" : "msg-ai"}`}>
            <span className="msg-label">
              {msg.role === "user" ? `田中社長 · ${msg.timestamp}` : `${aiLabel} · ${msg.timestamp}`}
            </span>
            <div
              className={`msg-bubble ${msg.role === "user" ? "bubble-user" : bubbleClass}`}
              dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
            />
            {msg.role === "assistant" && (
              <ExportButtons
                roomName={effectiveRoomName}
                answer={msg.content}
                answerTime={msg.timestamp}
                question={i > 0 && messages[i - 1].role === "user" ? messages[i - 1].content : ""}
              />
            )}
          </div>
        ))}
        {loading && (
          <div className="msg msg-ai">
            <span className="msg-label">{aiLabel} · 回答生成中</span>
            <div className={`msg-bubble ${bubbleClass}`}>
              <span className="loading-dots">考え中</span>
            </div>
          </div>
        )}
        {/* 引き継ぎボタン */}
        {handoffButton && !loading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <button
              className="handoff-btn"
              onClick={() => {
                const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
                handoffButton.onClick(lastAi?.content || "");
              }}
            >
              {handoffButton.label}
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 添付ファイルプレビュー */}
      {(attachedFile || parsing) && (
        <div style={{
          padding: "6px 12px",
          background: "var(--bg3)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
        }}>
          {parsing ? (
            <span style={{ color: "var(--text3)" }}>ファイルを解析中...</span>
          ) : attachedFile ? (
            <>
              <span style={{ color: "var(--text2)" }}>📎 {attachedFile.name}</span>
              <button
                onClick={() => setAttachedFile(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text3)",
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "0 4px",
                }}
                title="添付を取り消し"
              >
                ✕
              </button>
            </>
          ) : null}
        </div>
      )}

      {micError && (
        <div style={{
          padding: "8px 12px",
          background: "rgba(248,113,113,0.1)",
          borderTop: "1px solid rgba(248,113,113,0.3)",
          color: "#f87171",
          fontSize: "12px",
          lineHeight: "1.5",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          <span>{micError}</span>
          <button
            onClick={() => setMicError("")}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "14px", padding: "0 4px", flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      <div className="chat-input-area">
        {/* ファイル添付ボタン */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.csv,.xlsx,.xls,.docx"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <button
          className="mic-btn"
          onClick={() => fileInputRef.current?.click()}
          title="ファイルを添付（txt/pdf/csv/xlsx/docx）"
          type="button"
          disabled={parsing}
          style={parsing ? { opacity: 0.5 } : undefined}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <button
          className={`mic-btn ${recording ? "mic-recording" : ""}`}
          onClick={toggleVoice}
          title={recording ? "録音停止" : "音声入力"}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={placeholder}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            style={{ minHeight: "42px", maxHeight: "160px", overflow: "auto", width: "100%" }}
          />
          {interimText && (
            <div style={{ fontSize: "12px", color: "#999", padding: "2px 8px", fontStyle: "italic" }}>
              {interimText}
            </div>
          )}
        </div>
        <button className={`send-btn ${btnClass}`} onClick={handleSend} disabled={loading || parsing || (!input.trim() && !attachedFile)}>
          送信
        </button>
      </div>
    </div>
  );
}

function ExportButtons({
  roomName,
  answer,
  answerTime,
  question,
}: {
  roomName: string;
  answer: string;
  answerTime: string;
  question: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="export-msg-btns">
      <button className="export-btn" onClick={() => exportSingleWord(roomName, question, answer, answerTime)} title="Wordで保存">
        📄 Word
      </button>
      <button className="export-btn" onClick={() => exportSingleCsv(roomName, question, answer, answerTime)} title="CSVで保存">
        📊 CSV
      </button>
      <button className="export-btn" onClick={handleCopy} title="クリップボードにコピー">
        {copied ? "✅ コピーしました！" : "📋 コピー"}
      </button>
    </div>
  );
}

function formatContent(text: string): string {
  // 添付ファイルコンテキスト部分を非表示にする（ユーザーの吹き出しから長いファイル内容を隠す）
  const fileCtxStart = text.indexOf("\n\n【添付ファイル：");
  const cleaned = fileCtxStart >= 0 ? text.slice(0, fileCtxStart) : text;
  return cleaned
    .replace(/\u200B/g, "")          // ゼロ幅スペース除去
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, "") // 置換文字除去
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}
