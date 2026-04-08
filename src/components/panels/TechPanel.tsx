"use client";

import { memo, useState, useEffect, useCallback } from "react";

const RESEARCH_THEMES = ["代替コーティング技術", "サプライヤー比較", "特許・先行技術調査", "設備導入費試算"];
const DEFAULT_TAGS = ["PVD", "CVD", "真鍮メッキ", "アルマイト", "DLC"];

interface TechPanelProps {
  onResearch: (query: string) => void;
  disabled: boolean;
}

function TechPanel({ onResearch, disabled }: TechPanelProps) {
  const [theme, setTheme] = useState(RESEARCH_THEMES[0]);
  const [techTags, setTechTags] = useState<string[]>(DEFAULT_TAGS);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set(["PVD", "CVD"]));
  const [newTag, setNewTag] = useState("");

  // 材料マスタからタグを動的取得
  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => {
        if (data.materials && data.materials.length > 0) {
          const materialNames: string[] = data.materials.map((m: { name: string }) => m.name);
          const merged = [...new Set([...DEFAULT_TAGS, ...materialNames])];
          setTechTags(merged);
        }
      })
      .catch(() => {});
  }, []);

  // カスタムタグをSupabaseから読み込み
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.custom_tags_tech) {
          try {
            const saved = JSON.parse(data.settings.custom_tags_tech) as string[];
            if (saved.length > 0) setCustomTags(saved);
          } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  }, []);

  const saveCustomTags = useCallback((tags: string[]) => {
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_tags_tech: JSON.stringify(tags) }),
    }).catch(() => {});
  }, []);

  const toggleTag = (t: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const addTag = () => {
    const val = newTag.trim();
    if (!val) return;
    if (techTags.includes(val) || customTags.includes(val)) {
      setNewTag("");
      return;
    }
    const updated = [...customTags, val];
    setCustomTags(updated);
    setActiveTags((prev) => new Set([...prev, val]));
    saveCustomTags(updated);
    setNewTag("");
  };

  const removeCustomTag = (t: string) => {
    const updated = customTags.filter((c) => c !== t);
    setCustomTags(updated);
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.delete(t);
      return next;
    });
    saveCustomTags(updated);
  };

  return (
    <div className="side-panel">
      <div className="panel-card">
        <div className="panel-header">
          <span className="room-badge badge-blue">RESEARCH</span>
          <span className="panel-header-title">技術リサーチ設定</span>
        </div>
        <div className="panel-body">
          <div className="proposal-form">
            <div className="form-group">
              <label className="form-label">調査テーマ</label>
              <select className="form-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
                {RESEARCH_THEMES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">対象材料・技術タグ</label>
              <div className="tag-list">
                {techTags.map((t) => (
                  <span key={t} className={`tag ${activeTags.has(t) ? "tag-active" : "tag-default"}`} onClick={() => toggleTag(t)}>
                    {t}
                  </span>
                ))}
                {customTags.map((t) => (
                  <span key={`custom-${t}`} className={`tag ${activeTags.has(t) ? "tag-active" : "tag-default"}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span onClick={() => toggleTag(t)} style={{ cursor: "pointer" }}>{t}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); removeCustomTag(t); }}
                      style={{ cursor: "pointer", fontSize: "10px", opacity: 0.7, marginLeft: "2px" }}
                      title="削除"
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                <input
                  style={{ flex: 1, padding: "4px 8px", fontSize: "12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text)" }}
                  placeholder="材料名を入力..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                />
                <button
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  style={{ padding: "4px 10px", fontSize: "12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text2)", cursor: "pointer" }}
                >
                  +
                </button>
              </div>
            </div>
            <button
              className="gen-btn gen-btn-blue"
              disabled={disabled}
              onClick={() => onResearch(`${theme}について調査してください。対象技術: ${Array.from(activeTags).join("・")}`)}
            >
              Web検索して調査レポート生成
            </button>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <span className="room-badge badge-blue">COMPARE</span>
          <span className="panel-header-title">サプライヤー比較</span>
        </div>
        <div className="panel-body">
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "var(--text3)", fontFamily: "var(--mono)" }}>
                <th style={{ padding: "4px 0", textAlign: "left" }}>会社名</th>
                <th style={{ padding: "4px", textAlign: "right" }}>単価</th>
                <th style={{ padding: "4px", textAlign: "right" }}>納期</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "松田工機", price: "¥380万", priceColor: "var(--green)", lead: "6週" },
                { name: "日本真空技研", price: "¥420万", priceColor: "var(--gold2)", lead: "4週" },
                { name: "関西表面技術", price: "¥510万", priceColor: "var(--text2)", lead: "3週" },
              ].map((s) => (
                <tr key={s.name} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "7px 0", color: "var(--text)" }}>{s.name}</td>
                  <td style={{ padding: "7px 4px", textAlign: "right", color: s.priceColor, fontFamily: "var(--mono)" }}>{s.price}</td>
                  <td style={{ padding: "7px 4px", textAlign: "right", color: "var(--text2)", fontFamily: "var(--mono)" }}>{s.lead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default memo(TechPanel);
