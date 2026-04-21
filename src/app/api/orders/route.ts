import { createServerClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/api-response";

const FALLBACK_ORDERS = [
  { id: "1", customer_name: "鈴木自動車工業", plating_type: "金+亜鉛セット", amount: 5200000, cost: 3900000, profit_loss: 1300000, status: "profit" },
  { id: "2", customer_name: "ホンダ部品㈱", plating_type: "金メッキ単独", amount: 3800000, cost: 4200000, profit_loss: -400000, status: "loss" },
  { id: "3", customer_name: "山田精機", plating_type: "ニッケル+クロム", amount: 1400000, cost: 900000, profit_loss: 500000, status: "profit" },
  { id: "4", customer_name: "東海部品㈱", plating_type: "金メッキ交渉中", amount: 4200000, cost: 4200000, profit_loss: 0, status: "pending" },
];

export async function GET() {
  try {
    const supabase = createServerClient("mekki_dashboard");
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[orders] fetch failed:", error.message);
      return jsonResponse({ orders: FALLBACK_ORDERS });
    }

    return jsonResponse({ orders: data || [] });
  } catch {
    return jsonResponse({ orders: FALLBACK_ORDERS });
  }
}
