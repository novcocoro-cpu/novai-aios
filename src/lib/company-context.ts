// 会社情報 + ナレッジベースをシステムプロンプトに組み込むヘルパー

import { createServerClient } from "./supabase/server";

const COMPANY_KEYS = [
  "company_name",
  "company_industry",
  "company_employees",
  "company_contact",
  "company_monthly_revenue",
  "company_clients",
  "company_challenges",
  "company_successes",
  "company_competitors",
  "company_plating_types",
  "company_gold_usage",
  "company_supplier",
  "company_target_margin",
] as const;

// ── キャッシュ ──
let companyCache: Record<string, string> | null = null;
let companyCacheTime = 0;

interface KBItem { title: string; content: string; category: string | null }
let kbCache: KBItem[] | null = null;
let kbCacheTime = 0;

const CACHE_TTL = 30_000; // 30秒
const KB_MAX_CHARS = 30_000; // ナレッジ全体の文字数上限

// カテゴリ日本語ラベル
const CAT_LABELS: Record<string, string> = {
  estimate: "見積もり",
  recipe: "メッキレシピ",
  design: "設計書",
  customer: "顧客情報",
  success: "成功事例",
  trouble: "トラブル事例",
  supplier: "仕入れ先",
  other: "その他",
};

// ── 会社情報 ──

export async function loadCompanyData(): Promise<Record<string, string>> {
  const now = Date.now();
  if (companyCache && now - companyCacheTime < CACHE_TTL) return companyCache;

  const data: Record<string, string> = {};

  try {
    const supabase = createServerClient("mekki_shared");
    const { data: rows, error } = await supabase
      .from("app_settings")
      .select("setting_key, setting_value")
      .eq("user_id", process.env.DEFAULT_USER_ID!)
      .in("setting_key", [...COMPANY_KEYS]);

    if (error) {
      console.error("[company-context] fetch failed:", error.message);
      return data;
    }

    for (const row of rows ?? []) {
      const raw = row.setting_value;
      if (raw === null || raw === undefined) continue;
      const s = String(raw).trim();
      if (s) data[row.setting_key] = s;
    }

    companyCache = data;
    companyCacheTime = now;
  } catch {
    // ignore
  }

  return data;
}

export function buildCompanyContext(data: Record<string, string>): string {
  const parts: string[] = [];

  if (data.company_name) parts.push(`会社名: ${data.company_name}`);
  if (data.company_industry) parts.push(`業種・主力製品: ${data.company_industry}`);
  if (data.company_employees) parts.push(`従業員数: ${data.company_employees}`);
  if (data.company_contact) parts.push(`担当者: ${data.company_contact}`);
  if (data.company_plating_types) parts.push(`主力メッキ種別: ${data.company_plating_types}`);
  if (data.company_gold_usage) parts.push(`月間金使用量: ${data.company_gold_usage}g`);
  if (data.company_supplier) parts.push(`現在の仕入れ先: ${data.company_supplier}`);
  if (data.company_target_margin) parts.push(`目標利益率: ${data.company_target_margin}%`);
  if (data.company_monthly_revenue) parts.push(`月間平均受注金額: ${data.company_monthly_revenue}`);
  if (data.company_clients) parts.push(`主要取引先: ${data.company_clients}`);
  if (data.company_challenges) parts.push(`現在の主な課題: ${data.company_challenges}`);
  if (data.company_successes) parts.push(`過去の成功事例: ${data.company_successes}`);
  if (data.company_competitors) parts.push(`競合他社: ${data.company_competitors}`);

  if (parts.length === 0) return "";

  return (
    "\n\n【会社情報】以下はあなたがアドバイスする会社の情報です。この情報を踏まえて回答してください。\n" +
    parts.join("\n")
  );
}

// ── ナレッジベース ──

async function loadKnowledgeBase(): Promise<KBItem[]> {
  const now = Date.now();
  if (kbCache && now - kbCacheTime < CACHE_TTL) return kbCache;

  try {
    const supabase = createServerClient("mekki_shared");
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("title, content, category")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[company-context] knowledge_base fetch failed:", error.message);
      return kbCache || [];
    }

    const result = (data || []) as KBItem[];
    kbCache = result;
    kbCacheTime = now;
    return result;
  } catch {
    return kbCache || [];
  }
}

function buildKnowledgeContext(items: KBItem[]): string {
  if (items.length === 0) return "";

  const grouped: Record<string, KBItem[]> = {};
  for (const item of items) {
    const cat = item.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  const sections: string[] = [];
  let totalChars = 0;

  for (const [cat, catItems] of Object.entries(grouped)) {
    const label = CAT_LABELS[cat] || cat;
    const lines: string[] = [`▼ ${label}`];

    for (const item of catItems) {
      const entry = `・${item.title}: ${item.content}`;
      if (totalChars + entry.length > KB_MAX_CHARS) {
        lines.push("...（以下省略：ナレッジ上限に達しました）");
        sections.push(lines.join("\n"));
        return (
          "\n\n【会社の蓄積情報】以下は社内のナレッジベースです。回答の参考にしてください。\n" +
          sections.join("\n\n")
        );
      }
      totalChars += entry.length;
      lines.push(entry);
    }

    sections.push(lines.join("\n"));
  }

  return (
    "\n\n【会社の蓄積情報】以下は社内のナレッジベースです。回答の参考にしてください。\n" +
    sections.join("\n\n")
  );
}

// ── 統合エクスポート ──

export async function getCompanyContextString(): Promise<string> {
  const [companyData, kbItems] = await Promise.all([
    loadCompanyData(),
    loadKnowledgeBase(),
  ]);

  return buildCompanyContext(companyData) + buildKnowledgeContext(kbItems);
}
