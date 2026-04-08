"use client";

import { useState, useEffect, useCallback } from "react";

type SettingsTab = "prompts" | "materials" | "company" | "knowledge";

interface Material {
  id: string;
  name: string;
  cost_reduction: number;
  is_recommended: boolean;
}

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>("prompts");

  return (
    <div className="settings-layout">
      <div className="settings-nav">
        <button className={`settings-nav-item ${tab === "prompts" ? "active" : ""}`} onClick={() => setTab("prompts")}>
          プロンプト設定
        </button>
        <button className={`settings-nav-item ${tab === "materials" ? "active" : ""}`} onClick={() => setTab("materials")}>
          材料マスタ管理
        </button>
        <button className={`settings-nav-item ${tab === "company" ? "active" : ""}`} onClick={() => setTab("company")}>
          会社情報・データ
        </button>
        <button className={`settings-nav-item ${tab === "knowledge" ? "active" : ""}`} onClick={() => setTab("knowledge")}>
          会社ナレッジベース
        </button>
      </div>
      <div className="settings-panel">
        {tab === "prompts" && <PromptsTab />}
        {tab === "materials" && <MaterialsTab />}
        {tab === "company" && <CompanyTab />}
        {tab === "knowledge" && <KnowledgeTab />}
      </div>
    </div>
  );
}

/* ──────────────────────────────────
   プロンプト設定タブ（既存機能）
   ────────────────────────────────── */
function PromptsTab() {
  const [promptStrategy, setPromptStrategy] = useState("");
  const [promptSales, setPromptSales] = useState("");
  const [promptTech, setPromptTech] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [modelStrategy, setModelStrategy] = useState("gemini-2.5-flash");
  const [modelSales, setModelSales] = useState("gemini-2.5-flash");
  const [modelTech, setModelTech] = useState("gemini-2.5-flash");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings as Record<string, string>;
          setPromptStrategy(s.prompt_strategy || "");
          setPromptSales(s.prompt_sales || "");
          setPromptTech(s.prompt_tech || "");
          setTemperature(parseFloat(s.temperature || "0.3"));
          setModelStrategy(s.model_strategy || "gemini-2.5-flash");
          setModelSales(s.model_sales || "gemini-2.5-flash");
          setModelTech(s.model_tech || "gemini-2.5-flash");
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_strategy: promptStrategy,
          prompt_sales: promptSales,
          prompt_tech: promptTech,
          temperature: temperature.toString(),
          model_strategy: modelStrategy,
          model_sales: modelSales,
          model_tech: modelTech,
        }),
      });
      setSaveMsg("保存しました");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setSaveMsg("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="settings-section-title">プロンプト設定 — 各部屋のAI人格を定義</div>

      <div className="setting-row">
        <label className="setting-label">部屋① — 戦略・相場AIのシステムプロンプト</label>
        <div className="setting-desc">金相場分析・代替材料提案・価格戦略の際にAIが参照する指示文</div>
        <textarea className="setting-input setting-textarea" value={promptStrategy} onChange={(e) => setPromptStrategy(e.target.value)} />
      </div>

      <div className="setting-row">
        <label className="setting-label">部屋② — 営業支援AIのシステムプロンプト</label>
        <div className="setting-desc">提案書・トークスクリプト生成時のAI指示文</div>
        <textarea className="setting-input setting-textarea" style={{ minHeight: "80px" }} value={promptSales} onChange={(e) => setPromptSales(e.target.value)} />
      </div>

      <div className="setting-row">
        <label className="setting-label">部屋③ — 開発・調達AIのシステムプロンプト</label>
        <div className="setting-desc">技術リサーチ・サプライヤー調査時のAI指示文</div>
        <textarea className="setting-input setting-textarea" style={{ minHeight: "80px" }} value={promptTech} onChange={(e) => setPromptTech(e.target.value)} />
      </div>

      <div className="setting-row">
        <label className="setting-label">AIモデル選択（部屋ごと）</label>
        <div className="setting-desc" style={{ marginBottom: "12px" }}>各部屋で使用するAIモデルを選択できます。Claude Sonnet 4.6を使用するにはANTHROPIC_API_KEYの設定が必要です。</div>

        {[
          { key: "strategy", label: "部屋① 戦略・相場AI", value: modelStrategy, setter: setModelStrategy },
          { key: "sales", label: "部屋② 営業支援AI", value: modelSales, setter: setModelSales },
          { key: "tech", label: "部屋③ 開発・調達AI", value: modelTech, setter: setModelTech },
        ].map((room) => (
          <div key={room.key} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", marginBottom: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>{room.label}</div>
            <div style={{ display: "flex", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: room.value === "gemini-2.5-flash" ? "var(--teal)" : "var(--text2)" }}>
                <input
                  type="radio"
                  name={`model_${room.key}`}
                  checked={room.value === "gemini-2.5-flash"}
                  onChange={() => room.setter("gemini-2.5-flash")}
                />
                Gemini 2.5 Flash
                {room.value === "gemini-2.5-flash" && <span style={{ fontSize: "10px", color: "var(--green)" }}>（現在選択中）</span>}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: room.value === "claude-sonnet-4-6" ? "var(--gold2)" : "var(--text2)" }}>
                <input
                  type="radio"
                  name={`model_${room.key}`}
                  checked={room.value === "claude-sonnet-4-6"}
                  onChange={() => room.setter("claude-sonnet-4-6")}
                />
                Claude Sonnet 4.6
                <span style={{ fontSize: "10px", color: "var(--text3)" }}>（APIキー必要）</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="setting-row">
        <label className="setting-label">出力の創造性（Temperature）</label>
        <div className="setting-desc">低 = 安定・正確 / 高 = 創造的・バリエーション豊富</div>
        <div className="slider-row">
          <span style={{ fontSize: "11px", color: "var(--text3)" }}>安定</span>
          <input type="range" className="range-slider" min="0" max="100" value={temperature * 100} onChange={(e) => setTemperature(Number(e.target.value) / 100)} />
          <span style={{ fontSize: "11px", color: "var(--text3)" }}>創造的</span>
          <span className="slider-val">{temperature.toFixed(1)}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button className="save-btn" onClick={save} disabled={saving}>{saving ? "保存中..." : "設定を保存"}</button>
        {saveMsg && <span style={{ fontSize: "12px", color: "var(--green)" }}>{saveMsg}</span>}
      </div>
    </>
  );
}

/* ──────────────────────────────────
   材料マスタ管理タブ（改善①）
   ────────────────────────────────── */
function MaterialsTab() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");

  // 新規追加用
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState(0);
  const [newRecommended, setNewRecommended] = useState(false);

  // 編集中のID
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCost, setEditCost] = useState(0);
  const [editRecommended, setEditRecommended] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (data.materials) setMaterials(data.materials);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const showMsg = (msg: string) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), cost_reduction: newCost, is_recommended: newRecommended }),
      });
      if (res.ok) {
        setNewName("");
        setNewCost(0);
        setNewRecommended(false);
        await fetchMaterials();
        showMsg("追加しました");
      }
    } catch { showMsg("追加に失敗しました"); }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch("/api/materials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, cost_reduction: editCost, is_recommended: editRecommended }),
      });
      if (res.ok) {
        setEditId(null);
        await fetchMaterials();
        showMsg("更新しました");
      }
    } catch { showMsg("更新に失敗しました"); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchMaterials();
        showMsg("削除しました");
      }
    } catch { showMsg("削除に失敗しました"); }
  };

  const startEdit = (m: Material) => {
    setEditId(m.id);
    setEditName(m.name);
    setEditCost(m.cost_reduction);
    setEditRecommended(m.is_recommended);
  };

  if (loading) return <div style={{ color: "var(--text3)" }}>読み込み中...</div>;

  return (
    <>
      <div className="settings-section-title">材料マスタ管理 — 代替材料リストを編集</div>
      <div className="setting-desc" style={{ marginBottom: "16px" }}>
        ここで登録した材料は、戦略ルームの「代替材料候補」と開発ルームの「技術タグ」に反映されます。
      </div>

      {/* 既存材料一覧 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        {materials.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "var(--bg3)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            {editId === m.id ? (
              <>
                <input className="setting-input" style={{ flex: 1, padding: "6px 8px" }} value={editName} onChange={(e) => setEditName(e.target.value)} />
                <input className="setting-input" type="number" style={{ width: "70px", padding: "6px 8px", textAlign: "right" }} value={editCost} onChange={(e) => setEditCost(Number(e.target.value))} />
                <span style={{ fontSize: "11px", color: "var(--text3)" }}>%</span>
                <label style={{ fontSize: "11px", color: "var(--text2)", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                  <input type="checkbox" checked={editRecommended} onChange={(e) => setEditRecommended(e.target.checked)} />
                  推奨
                </label>
                <button className="save-btn" style={{ padding: "5px 12px", fontSize: "11px", marginTop: 0 }} onClick={() => handleUpdate(m.id)}>保存</button>
                <button style={{ background: "none", border: "1px solid var(--border2)", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", color: "var(--text2)", cursor: "pointer" }} onClick={() => setEditId(null)}>取消</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: "13px" }}>{m.name}</span>
                <span style={{ fontSize: "12px", fontFamily: "var(--mono)", color: "var(--teal)" }}>-{m.cost_reduction}%</span>
                {m.is_recommended && <span className="material-tag">推奨</span>}
                <button style={{ background: "none", border: "1px solid var(--border2)", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "var(--text2)", cursor: "pointer" }} onClick={() => startEdit(m)}>編集</button>
                <button style={{ background: "none", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "var(--red)", cursor: "pointer" }} onClick={() => handleDelete(m.id)}>削除</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 新規追加フォーム */}
      <div style={{ background: "var(--bg3)", borderRadius: "10px", border: "1px solid var(--border)", padding: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "12px" }}>新しい材料を追加</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="form-group">
            <label className="form-label">材料名</label>
            <input className="setting-input" placeholder="例: PVDコーティング（TiN）" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">コスト削減率（%）</label>
              <input className="setting-input" type="number" value={newCost} onChange={(e) => setNewCost(Number(e.target.value))} />
            </div>
            <label style={{ fontSize: "12px", color: "var(--text2)", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", paddingBottom: "8px" }}>
              <input type="checkbox" checked={newRecommended} onChange={(e) => setNewRecommended(e.target.checked)} />
              推奨
            </label>
          </div>
          <button className="save-btn" style={{ width: "100%" }} onClick={handleAdd} disabled={!newName.trim()}>
            材料を追加
          </button>
        </div>
      </div>

      {saveMsg && <span style={{ display: "block", marginTop: "12px", fontSize: "12px", color: "var(--green)" }}>{saveMsg}</span>}
    </>
  );
}

/* ──────────────────────────────────
   会社情報・データタブ（改善③）
   ────────────────────────────────── */
const COMPANY_FIELDS: { key: string; label: string; section: string; type: "text" | "textarea" | "number"; placeholder: string }[] = [
  // 基本情報
  { key: "company_name", label: "会社名", section: "basic", type: "text", placeholder: "田中メッキ工業 株式会社" },
  { key: "company_industry", label: "業種・主力製品", section: "basic", type: "text", placeholder: "金属メッキ加工業" },
  { key: "company_employees", label: "従業員数", section: "basic", type: "text", placeholder: "45名" },
  { key: "company_contact", label: "担当者名", section: "basic", type: "text", placeholder: "田中太郎" },
  // 経営データ
  { key: "company_monthly_revenue", label: "月間平均受注金額", section: "business", type: "text", placeholder: "2,500万円" },
  { key: "company_clients", label: "主要取引先（複数）", section: "business", type: "textarea", placeholder: "鈴木自動車工業、ホンダ部品、山田精機..." },
  { key: "company_challenges", label: "現在の主な課題", section: "business", type: "textarea", placeholder: "金相場高騰による利益率低下、後継者不足..." },
  { key: "company_successes", label: "過去の成功事例", section: "business", type: "textarea", placeholder: "PVDコーティング導入でコスト42%削減..." },
  { key: "company_competitors", label: "競合他社情報", section: "business", type: "textarea", placeholder: "松田工機（低価格路線）、日本真空技研..." },
  // メッキ固有データ
  { key: "company_plating_types", label: "主力メッキ種別（複数可）", section: "plating", type: "textarea", placeholder: "金メッキ（装飾用）、ニッケルメッキ、クロームメッキ" },
  { key: "company_gold_usage", label: "月間金使用量（g）", section: "plating", type: "text", placeholder: "3500" },
  { key: "company_supplier", label: "現在の仕入れ先", section: "plating", type: "text", placeholder: "田中貴金属工業" },
  { key: "company_target_margin", label: "目標利益率（%）", section: "plating", type: "text", placeholder: "15" },
];

function CompanyTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings as Record<string, string>;
          const initial: Record<string, string> = {};
          for (const field of COMPANY_FIELDS) {
            initial[field.key] = s[field.key] || "";
          }
          setValues(initial);
        }
      })
      .catch(() => {});
  }, []);

  const update = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      // 空でないフィールドのみ送信
      const toSave: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        toSave[k] = v;
      }
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      setSaveMsg("保存しました — AIチャットに自動反映されます");
      setTimeout(() => setSaveMsg(""), 4000);
    } catch {
      setSaveMsg("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (sectionKey: string, title: string) => {
    const fields = COMPANY_FIELDS.filter((f) => f.section === sectionKey);
    return (
      <div key={sectionKey} style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--gold2)", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>
          {title}
        </div>
        {fields.map((field) => (
          <div className="setting-row" key={field.key}>
            <label className="setting-label">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                className="setting-input setting-textarea"
                style={{ minHeight: "60px" }}
                placeholder={field.placeholder}
                value={values[field.key] || ""}
                onChange={(e) => update(field.key, e.target.value)}
              />
            ) : (
              <input
                className="setting-input"
                type="text"
                placeholder={field.placeholder}
                value={values[field.key] || ""}
                onChange={(e) => update(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="settings-section-title">会社情報・データ入力</div>
      <div className="setting-desc" style={{ marginBottom: "20px" }}>
        ここに入力した情報はAIのシステムプロンプトに自動で組み込まれ、各部屋のAIがあなたの会社を理解した上で回答します。
      </div>

      {renderSection("basic", "■ 基本情報")}
      {renderSection("business", "■ 経営データ")}
      {renderSection("plating", "■ メッキ固有データ")}

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button className="save-btn" onClick={save} disabled={saving}>
          {saving ? "保存中..." : "会社情報を保存"}
        </button>
        {saveMsg && <span style={{ fontSize: "12px", color: "var(--green)" }}>{saveMsg}</span>}
      </div>
    </>
  );
}

/* ──────────────────────────────────
   会社ナレッジベースタブ
   ────────────────────────────────── */
const KB_CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: "estimate", label: "見積もり", color: "var(--gold2)" },
  { value: "recipe", label: "レシピ", color: "var(--teal)" },
  { value: "design", label: "設計書", color: "var(--blue)" },
  { value: "customer", label: "顧客情報", color: "#a78bfa" },
  { value: "success", label: "成功事例", color: "var(--green)" },
  { value: "trouble", label: "トラブル", color: "var(--red)" },
  { value: "supplier", label: "仕入れ先", color: "#f59e0b" },
  { value: "other", label: "その他", color: "var(--text3)" },
];

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  file_name: string | null;
  file_type: string | null;
  tags: string[];
  created_at: string;
}

function KnowledgeTab() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  // 入力タブ
  const [inputMode, setInputMode] = useState<"text" | "file">("text");

  // テキスト入力
  const [newCat, setNewCat] = useState("other");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");

  // ファイルアップロード
  const [fileCat, setFileCat] = useState("other");
  const [fileTitle, setFileTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 編集
  const [editId, setEditId] = useState<string | null>(null);
  const [editCat, setEditCat] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const url = filterCat === "all" ? "/api/knowledge" : `/api/knowledge?category=${filterCat}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [filterCat]);

  useEffect(() => { setLoading(true); fetchItems(); }, [fetchItems]);

  const showMsg = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 3000); };

  const catLabel = (val: string) => KB_CATEGORIES.find((c) => c.value === val)?.label || val;
  const catColor = (val: string) => KB_CATEGORIES.find((c) => c.value === val)?.color || "var(--text3)";

  // テキスト保存
  const handleAddText = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCat,
          title: newTitle.trim(),
          content: newContent.trim(),
          tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setNewTitle(""); setNewContent(""); setNewTags("");
        await fetchItems();
        showMsg("ナレッジを追加しました");
      }
    } catch { showMsg("追加に失敗しました"); }
  };

  // ファイルアップロード
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("category", fileCat);
      if (fileTitle.trim()) fd.append("title", fileTitle.trim());

      const res = await fetch("/api/knowledge/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) { showMsg(`エラー: ${data.error}`); }
      else {
        setSelectedFile(null); setFileTitle("");
        await fetchItems();
        showMsg("ファイルをアップロードしました");
      }
    } catch { showMsg("アップロードに失敗しました"); }
    finally { setUploading(false); }
  };

  // 編集
  const startEdit = (item: KnowledgeItem) => {
    setEditId(item.id); setEditCat(item.category); setEditTitle(item.title); setEditContent(item.content);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      const res = await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, category: editCat, title: editTitle, content: editContent }),
      });
      if (res.ok) { setEditId(null); await fetchItems(); showMsg("更新しました"); }
    } catch { showMsg("更新に失敗しました"); }
  };

  // 削除
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/knowledge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { await fetchItems(); showMsg("削除しました"); }
    } catch { showMsg("削除に失敗しました"); }
  };

  return (
    <>
      <div className="settings-section-title">会社ナレッジベース — 社内文書・ノウハウをAIに学習させる</div>
      <div className="setting-desc" style={{ marginBottom: "16px" }}>
        登録したナレッジは各部屋のAIに自動反映されます。見積もり・レシピ・設計書・成功事例などを蓄積し、AIの回答精度を向上させましょう。
      </div>

      {/* カテゴリフィルター */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        <button className={`filter-btn ${filterCat === "all" ? "on" : ""}`} onClick={() => setFilterCat("all")}>全て</button>
        {KB_CATEGORIES.map((c) => (
          <button key={c.value} className={`filter-btn ${filterCat === c.value ? "on" : ""}`} onClick={() => setFilterCat(c.value)}>{c.label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* 左側：一覧 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "500px", overflowY: "auto" }}>
          {loading && <div style={{ color: "var(--text3)", fontSize: "12px" }}>読み込み中...</div>}
          {!loading && items.length === 0 && <div style={{ color: "var(--text3)", fontSize: "12px" }}>登録されたナレッジはありません</div>}

          {items.map((item) => (
            <div key={item.id} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
              {editId === item.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <select className="form-select" style={{ fontSize: "12px" }} value={editCat} onChange={(e) => setEditCat(e.target.value)}>
                    {KB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input className="setting-input" style={{ padding: "6px 8px" }} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <textarea className="setting-input" style={{ minHeight: "80px", fontSize: "12px" }} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="save-btn" style={{ padding: "5px 14px", fontSize: "11px", marginTop: 0 }} onClick={handleUpdate}>保存</button>
                    <button style={{ background: "none", border: "1px solid var(--border2)", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", color: "var(--text2)", cursor: "pointer" }} onClick={() => setEditId(null)}>取消</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "var(--bg4)", color: catColor(item.category), border: `1px solid ${catColor(item.category)}30`, fontFamily: "var(--mono)" }}>
                      {catLabel(item.category)}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 500, flex: 1 }}>{item.title}</span>
                    {item.file_name && <span style={{ fontSize: "10px", color: "var(--text3)" }}>📎</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.5, marginBottom: "8px" }}>
                    {item.content.slice(0, 80)}{item.content.length > 80 ? "..." : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text3)", fontFamily: "var(--mono)" }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString("ja-JP") : ""}
                    </span>
                    <span style={{ flex: 1 }} />
                    <button style={{ background: "none", border: "1px solid var(--border2)", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", color: "var(--text2)", cursor: "pointer" }} onClick={() => startEdit(item)}>編集</button>
                    <button style={{ background: "none", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", color: "var(--red)", cursor: "pointer" }} onClick={() => handleDelete(item.id)}>削除</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 右側：新規追加 */}
        <div style={{ background: "var(--bg3)", borderRadius: "10px", border: "1px solid var(--border)", padding: "16px" }}>
          {/* 入力モードタブ */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
            <button
              className={`filter-btn ${inputMode === "text" ? "on" : ""}`}
              onClick={() => setInputMode("text")}
              style={{ flex: 1 }}
            >
              テキストで入力
            </button>
            <button
              className={`filter-btn ${inputMode === "file" ? "on" : ""}`}
              onClick={() => setInputMode("file")}
              style={{ flex: 1 }}
            >
              ファイルをアップロード
            </button>
          </div>

          {inputMode === "text" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">カテゴリ</label>
                <select className="form-select" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                  {KB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">タイトル</label>
                <input className="setting-input" placeholder="例: 金メッキ見積もり基準" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">内容</label>
                <textarea
                  className="setting-input setting-textarea"
                  style={{ minHeight: "150px" }}
                  placeholder="ナレッジの内容を入力..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">タグ（カンマ区切り）</label>
                <input className="setting-input" placeholder="例: 金メッキ, 見積もり, 原価" value={newTags} onChange={(e) => setNewTags(e.target.value)} />
              </div>
              <button className="save-btn" style={{ width: "100%" }} onClick={handleAddText} disabled={!newTitle.trim() || !newContent.trim()}>
                ナレッジを保存
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">カテゴリ</label>
                <select className="form-select" value={fileCat} onChange={(e) => setFileCat(e.target.value)}>
                  {KB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">タイトル（省略時はファイル名）</label>
                <input className="setting-input" placeholder="例: 2024年度見積もり一覧" value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">ファイル選択</label>
                <div style={{ border: "2px dashed var(--border2)", borderRadius: "8px", padding: "20px", textAlign: "center", cursor: "pointer" }}
                  onClick={() => document.getElementById("kb-file-input")?.click()}
                >
                  <input
                    id="kb-file-input"
                    type="file"
                    accept=".txt,.pdf,.csv,.xlsx,.xls,.docx"
                    style={{ display: "none" }}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile ? (
                    <div>
                      <div style={{ fontSize: "13px", color: "var(--text)" }}>{selectedFile.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "4px" }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "20px", marginBottom: "6px" }}>+</div>
                      <div style={{ fontSize: "12px", color: "var(--text3)" }}>
                        .txt / .pdf / .csv / .xlsx / .docx
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button className="save-btn" style={{ width: "100%" }} onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? "アップロード中..." : "ファイルをアップロード"}
              </button>
            </div>
          )}
        </div>
      </div>

      {saveMsg && <span style={{ display: "block", marginTop: "12px", fontSize: "12px", color: "var(--green)" }}>{saveMsg}</span>}
    </>
  );
}
