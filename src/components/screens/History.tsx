"use client";

import { useState, useEffect } from "react";

interface Conversation {
  id: string;
  room: string;
  title: string;
  messages: { role: string; content: string; timestamp: string }[];
  tags: string[];
  created_at: string;
}

const ROOM_CONFIG: Record<string, { badge: string; label: string }> = {
  strategy: { badge: "badge-gold", label: "ROOM-01" },
  sales: { badge: "badge-teal", label: "ROOM-02" },
  tech: { badge: "badge-blue", label: "ROOM-03" },
};

const FILTERS = ["すべて", "部屋①戦略", "部屋②営業", "部屋③開発"];

export default function History() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState("すべて");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const filterRoom = (f: string) => {
    if (f === "部屋①戦略") return "strategy";
    if (f === "部屋②営業") return "sales";
    if (f === "部屋③開発") return "tech";
    return null;
  };

  const filtered = filter === "すべて"
    ? conversations
    : conversations.filter((c) => c.room === filterRoom(filter));

  return (
    <>
      <div className="history-filters">
        {FILTERS.map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="history-list">
        {!loaded && <div style={{ color: "var(--text3)", padding: "20px" }}>読み込み中...</div>}
        {loaded && filtered.length === 0 && (
          <div style={{ color: "var(--text3)", padding: "20px" }}>会話履歴がありません</div>
        )}
        {filtered.map((c) => {
          const cfg = ROOM_CONFIG[c.room] || ROOM_CONFIG.strategy;
          const preview = c.messages?.[c.messages.length - 1]?.content?.slice(0, 120) || "";
          const date = new Date(c.created_at).toLocaleString("ja-JP", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit",
          });
          return (
            <div key={c.id} className="history-item">
              <div className="h-meta">
                <span className="h-date">{date}</span>
                <span className={`h-room room-badge ${cfg.badge}`}>{cfg.label}</span>
              </div>
              <div className="h-title">{c.title || "無題の会話"}</div>
              <div className="h-preview">{preview}...</div>
              {c.tags && c.tags.length > 0 && (
                <div className="h-tags">
                  {c.tags.map((t) => (
                    <span key={t} className="h-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly Report */}
      <div style={{ marginTop: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text2)", marginBottom: "12px", fontFamily: "var(--mono)" }}>
          ── AI MONTHLY REPORT / {new Date().toISOString().slice(0, 7)}
        </div>
        <div className="report-grid">
          <div className="report-card">
            <div className="report-card-title">CONVERSATION SUMMARY</div>
            <div style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.7 }}>
              今月のAI相談：<strong style={{ color: "var(--text)" }}>{conversations.length}件</strong><br />
              最頻出テーマ：<strong style={{ color: "var(--gold2)" }}>金相場対策</strong>
            </div>
          </div>
          <div className="report-card">
            <div className="report-card-title">KEY INSIGHTS THIS MONTH</div>
            <div className="insight-list">
              <div className="insight-item" style={{ padding: "8px" }}>
                <span className="insight-icon" style={{ fontSize: "13px" }}>◉</span>
                <div className="insight-text" style={{ fontSize: "11px" }}><strong>抱き合わせ成約率 38%</strong>に上昇。目標60%に向けて継続</div>
              </div>
              <div className="insight-item" style={{ padding: "8px" }}>
                <span className="insight-icon" style={{ fontSize: "13px" }}>⚠</span>
                <div className="insight-text" style={{ fontSize: "11px" }}><strong>金単独受注の平均赤字額 ¥142万</strong>。早急な価格改定が必要</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
