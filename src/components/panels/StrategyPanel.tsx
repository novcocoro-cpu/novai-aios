"use client";

import { memo, useState, useMemo, useEffect } from "react";

interface Material {
  id: string;
  name: string;
  cost_reduction: number;
  is_recommended: boolean;
  sort_order: number;
}

function StrategyPanel() {
  const [goldGrams, setGoldGrams] = useState(280);
  const [processingCost, setProcessingCost] = useState(800000);
  const [overheadCost, setOverheadCost] = useState(200000);
  const [goldPrice, setGoldPrice] = useState(14820);
  const [goldUpdatedAt, setGoldUpdatedAt] = useState<string | null>(null);
  const [orderPrice] = useState(4000000);
  const [materials, setMaterials] = useState<Material[]>([]);

  // 追加・編集フォーム用state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCost, setAddCost] = useState(0);
  const [addRecommended, setAddRecommended] = useState(false);
  const [addSaving, setAddSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCost, setEditCost] = useState(0);
  const [editRecommended, setEditRecommended] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // 金相場をリアルタイム取得 + 15分ごとに自動更新
  useEffect(() => {
    const fetchGoldPrice = () => {
      fetch("/api/gold-price")
        .then((r) => r.json())
        .then((data) => {
          if (data.price) {
            setGoldPrice(data.price);
            setGoldUpdatedAt(
              data.updated_at
                ? new Date(data.updated_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
                : new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
            );
          }
        })
        .catch(() => {});
    };

    fetchGoldPrice(); // 初回取得
    const interval = setInterval(fetchGoldPrice, 15 * 60 * 1000); // 15分ごと
    return () => clearInterval(interval);
  }, []);

  // 代替材料をDBから取得
  const fetchMaterials = () => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => {
        if (data.materials) setMaterials(data.materials);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const totalCost = useMemo(
    () => goldGrams * goldPrice + processingCost + overheadCost,
    [goldGrams, goldPrice, processingCost, overheadCost]
  );
  const diff = orderPrice - totalCost;

  const numGuard = (e: React.FormEvent<HTMLInputElement>) => {
    const ev = e.nativeEvent as InputEvent;
    if (ev.data && !/^[\d.-]$/.test(ev.data)) e.preventDefault();
  };

  const handleAdd = async () => {
    if (!addName.trim()) return;
    setAddSaving(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName, cost_reduction: addCost, is_recommended: addRecommended }),
      });
      if (res.ok) {
        fetchMaterials();
        setAddName("");
        setAddCost(0);
        setAddRecommended(false);
        setShowAddForm(false);
      }
    } catch { /* ignore */ }
    setAddSaving(false);
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/materials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, cost_reduction: editCost, is_recommended: editRecommended }),
      });
      if (res.ok) {
        fetchMaterials();
        setEditingId(null);
      }
    } catch { /* ignore */ }
    setEditSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchMaterials();
    } catch { /* ignore */ }
  };

  const startEdit = (m: Material) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditCost(m.cost_reduction);
    setEditRecommended(m.is_recommended);
  };

  const iconBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 4px",
    fontSize: "13px",
    lineHeight: 1,
    opacity: 0.6,
  };

  return (
    <div className="side-panel">
      {/* KPI */}
      <div className="panel-card">
        <div className="panel-header">
          <span className="room-badge badge-gold">MARKET</span>
          <span className="panel-header-title">今日の相場</span>
          {goldUpdatedAt && (
            <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--text3)", fontFamily: "var(--mono)" }}>
              更新: {goldUpdatedAt}
            </span>
          )}
        </div>
        <div className="panel-body">
          <div className="kpi-grid">
            <div className="kpi-card kpi-gold">
              <div className="kpi-label">GOLD / g</div>
              <div className="kpi-value" style={{ color: "var(--gold2)" }}>¥{goldPrice.toLocaleString()}</div>
              <div className="kpi-change up">▲ +8.2% 先月比</div>
            </div>
            <div className="kpi-card kpi-red">
              <div className="kpi-label">原価 / 台</div>
              <div className="kpi-value" style={{ color: "var(--red)" }}>¥420万</div>
              <div className="kpi-change down">▼ 赤字 ¥220万</div>
            </div>
            <div className="kpi-card kpi-teal">
              <div className="kpi-label">USD/JPY</div>
              <div className="kpi-value" style={{ color: "var(--teal)" }}>153.4</div>
              <div className="kpi-change down">▼ -0.3%</div>
            </div>
            <div className="kpi-card kpi-blue">
              <div className="kpi-label">Pt / g</div>
              <div className="kpi-value" style={{ color: "var(--blue)" }}>¥5,240</div>
              <div className="kpi-change up">▲ +1.1%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Simulator */}
      <div className="panel-card">
        <div className="panel-header">
          <span className="room-badge badge-gold">SIM</span>
          <span className="panel-header-title">価格戦略シミュレーター</span>
        </div>
        <div className="panel-body">
          <div className="sim-row">
            <span className="sim-label">金使用量（g）</span>
            <input className="sim-input" type="number" inputMode="numeric" step="1" value={goldGrams} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setGoldGrams(v); }} onBeforeInput={numGuard} />
          </div>
          <div className="sim-row">
            <span className="sim-label">加工費</span>
            <input className="sim-input" type="number" inputMode="numeric" step="1000" value={processingCost} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setProcessingCost(v); }} onBeforeInput={numGuard} />
          </div>
          <div className="sim-row">
            <span className="sim-label">諸経費</span>
            <input className="sim-input" type="number" inputMode="numeric" step="1000" value={overheadCost} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setOverheadCost(v); }} onBeforeInput={numGuard} />
          </div>
          <hr className="sim-divider" />
          <div className="sim-total">
            <span className="sim-total-label">原価合計（推定）</span>
            <span className="sim-total-value">¥{totalCost.toLocaleString()}</span>
          </div>
          {diff < 0 && (
            <div className="sim-warning">
              ⚠ 現在の受注単価 ¥{orderPrice.toLocaleString()} では ¥{Math.abs(diff).toLocaleString()} の赤字です
            </div>
          )}
        </div>
      </div>

      {/* Alternative Materials — DBから動的取得 + CRUD */}
      <div className="panel-card">
        <div className="panel-header">
          <span className="room-badge badge-gold">ALT</span>
          <span className="panel-header-title">代替材料候補</span>
        </div>
        <div className="panel-body">
          {materials.length === 0 && (
            <div style={{ fontSize: "12px", color: "var(--text3)" }}>読み込み中...</div>
          )}
          {materials.map((m, i) => (
            <div key={m.id}>
              {editingId === m.id ? (
                /* 編集モード */
                <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px", marginBottom: "6px" }}>
                  <input
                    style={{ width: "100%", padding: "4px 6px", marginBottom: "4px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text)", fontSize: "12px" }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="材料名"
                  />
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text3)" }}>削減率%</span>
                    <input
                      type="number"
                      style={{ width: "60px", padding: "4px 6px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text)", fontSize: "12px" }}
                      value={editCost}
                      onChange={(e) => setEditCost(parseInt(e.target.value, 10) || 0)}
                    />
                    <label style={{ fontSize: "11px", color: "var(--text3)", display: "flex", alignItems: "center", gap: "3px", marginLeft: "auto" }}>
                      <input type="checkbox" checked={editRecommended} onChange={(e) => setEditRecommended(e.target.checked)} />
                      推奨
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => handleEdit(m.id)}
                      disabled={editSaving}
                      style={{ flex: 1, padding: "4px", fontSize: "11px", background: "var(--gold2)", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      {editSaving ? "保存中..." : "保存"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ flex: 1, padding: "4px", fontSize: "11px", background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer" }}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                /* 表示モード */
                <div className="material-item" style={{ position: "relative" }}>
                  <span className="material-rank">{String(i + 1).padStart(2, "0")}</span>
                  <span className="material-name">{m.name}</span>
                  <span className="material-cost">-{m.cost_reduction}%</span>
                  {m.is_recommended && <span className="material-tag">推奨</span>}
                  <span style={{ marginLeft: "auto", display: "flex", gap: "2px" }}>
                    <button onClick={() => startEdit(m)} style={iconBtnStyle} title="編集">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(m.id)} style={{ ...iconBtnStyle, color: "var(--red)" }} title="削除">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* 追加フォーム */}
          {showAddForm ? (
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px", marginTop: "8px" }}>
              <input
                style={{ width: "100%", padding: "4px 6px", marginBottom: "4px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text)", fontSize: "12px" }}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="材料名を入力"
                autoFocus
              />
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text3)" }}>コスト削減率%</span>
                <input
                  type="number"
                  style={{ width: "60px", padding: "4px 6px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text)", fontSize: "12px" }}
                  value={addCost}
                  onChange={(e) => setAddCost(parseInt(e.target.value, 10) || 0)}
                />
                <label style={{ fontSize: "11px", color: "var(--text3)", display: "flex", alignItems: "center", gap: "3px", marginLeft: "auto" }}>
                  <input type="checkbox" checked={addRecommended} onChange={(e) => setAddRecommended(e.target.checked)} />
                  推奨
                </label>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={handleAdd}
                  disabled={addSaving || !addName.trim()}
                  style={{ flex: 1, padding: "4px", fontSize: "11px", background: "var(--gold2)", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  {addSaving ? "追加中..." : "追加"}
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setAddName(""); setAddCost(0); setAddRecommended(false); }}
                  style={{ flex: 1, padding: "4px", fontSize: "11px", background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer" }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "6px",
                fontSize: "12px",
                background: "none",
                border: "1px dashed var(--border)",
                borderRadius: "6px",
                color: "var(--text3)",
                cursor: "pointer",
              }}
            >
              + 材料を追加
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(StrategyPanel);
