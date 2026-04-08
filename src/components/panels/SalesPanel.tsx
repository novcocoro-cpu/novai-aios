"use client";

import { memo, useState, useEffect, useCallback } from "react";

const PLATING_TYPES = ["金メッキ（装飾用）", "亜鉛ダイカストメッキ", "ニッケルメッキ", "クロームメッキ"];
const BUNDLE_OPTIONS = ["亜鉛メッキ", "ニッケルメッキ", "クロームメッキ", "アルマイト", "表面研磨"];

interface SalesPanelProps {
  onGenerate: (params: { customerName: string; mainType: string; bundles: string[]; targetAmount: number }) => void;
  generating: boolean;
}

function SalesPanel({ onGenerate, generating }: SalesPanelProps) {
  const [customerName, setCustomerName] = useState("鈴木自動車工業 株式会社");
  const [mainType, setMainType] = useState(PLATING_TYPES[0]);
  const [bundles, setBundles] = useState<Set<string>>(new Set(["亜鉛メッキ", "ニッケルメッキ"]));
  const [customBundles, setCustomBundles] = useState<string[]>([]);
  const [newBundle, setNewBundle] = useState("");
  const [targetAmount, setTargetAmount] = useState(520);

  // カスタムタグをSupabaseから読み込み
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.custom_tags_sales) {
          try {
            const saved = JSON.parse(data.settings.custom_tags_sales) as string[];
            if (saved.length > 0) setCustomBundles(saved);
          } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  }, []);

  const saveCustomTags = useCallback((tags: string[]) => {
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_tags_sales: JSON.stringify(tags) }),
    }).catch(() => {});
  }, []);

  const toggleBundle = (b: string) => {
    setBundles((prev) => {
      const next = new Set(prev);
      next.has(b) ? next.delete(b) : next.add(b);
      return next;
    });
  };

  const addBundle = () => {
    const val = newBundle.trim();
    if (!val) return;
    if (BUNDLE_OPTIONS.includes(val) || customBundles.includes(val)) {
      setNewBundle("");
      return;
    }
    const updated = [...customBundles, val];
    setCustomBundles(updated);
    setBundles((prev) => new Set([...prev, val]));
    saveCustomTags(updated);
    setNewBundle("");
  };

  const removeCustomBundle = (b: string) => {
    const updated = customBundles.filter((c) => c !== b);
    setCustomBundles(updated);
    setBundles((prev) => {
      const next = new Set(prev);
      next.delete(b);
      return next;
    });
    saveCustomTags(updated);
  };

  return (
    <div className="side-panel">
      <div className="panel-card">
        <div className="panel-header">
          <span className="room-badge badge-teal">BUILDER</span>
          <span className="panel-header-title">提案書ビルダー</span>
        </div>
        <div className="panel-body">
          <div className="proposal-form">
            <div className="form-group">
              <label className="form-label">顧客名</label>
              <input className="form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">主要メッキ種別</label>
              <select className="form-select" value={mainType} onChange={(e) => setMainType(e.target.value)}>
                {PLATING_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">抱き合わせ種別（複数選択）</label>
              <div className="tag-list">
                {BUNDLE_OPTIONS.map((b) => (
                  <span key={b} className={`tag ${bundles.has(b) ? "tag-active" : "tag-default"}`} onClick={() => toggleBundle(b)}>
                    {b}
                  </span>
                ))}
                {customBundles.map((b) => (
                  <span key={`custom-${b}`} className={`tag ${bundles.has(b) ? "tag-active" : "tag-default"}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span onClick={() => toggleBundle(b)} style={{ cursor: "pointer" }}>{b}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); removeCustomBundle(b); }}
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
                  placeholder="種別名を入力..."
                  value={newBundle}
                  onChange={(e) => setNewBundle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBundle(); } }}
                />
                <button
                  onClick={addBundle}
                  disabled={!newBundle.trim()}
                  style={{ padding: "4px 10px", fontSize: "12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text2)", cursor: "pointer" }}
                >
                  +
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">月額目標金額（万円）</label>
              <input className="form-input" type="number" inputMode="numeric" step="10" value={targetAmount} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setTargetAmount(v); }} onBeforeInput={(e) => { const ev = e.nativeEvent as InputEvent; if (ev.data && !/^[\d.-]$/.test(ev.data)) e.preventDefault(); }} />
            </div>
            <button
              className="gen-btn"
              disabled={generating}
              onClick={() => onGenerate({ customerName, mainType, bundles: Array.from(bundles), targetAmount })}
            >
              {generating ? "生成中..." : "提案書を自動生成"}
            </button>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <span className="room-badge badge-teal">SCRIPT</span>
          <span className="panel-header-title">トークスクリプト</span>
        </div>
        <div className="panel-body" style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--teal)" }}>オープニング</strong><br />
          「本日は金相場の件でご連絡しました。お客様の調達コスト安定に向けて新しいご提案があります」<br /><br />
          <strong style={{ color: "var(--teal)" }}>課題提示</strong><br />
          「金相場が3ヶ月で15%上昇しており、単価維持が困難な状況です」<br /><br />
          <strong style={{ color: "var(--teal)" }}>提案</strong><br />
          「複数工程をパッケージ化することで、全体コストを最適化できます」
        </div>
      </div>
    </div>
  );
}

export default memo(SalesPanel);
