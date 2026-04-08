import { NextRequest } from "next/server";
import { supabaseSchema, isSupabaseConfigured } from "@/lib/supabase-server";
import { jsonResponse } from "@/lib/api-response";

// フォールバック用のメモリストア
let memoryMaterials = [
  { id: "1", name: "PVDコーティング（TiN）", cost_reduction: 42, is_recommended: true, sort_order: 1 },
  { id: "2", name: "真鍮+金フラッシュ", cost_reduction: 35, is_recommended: false, sort_order: 2 },
  { id: "3", name: "金色アルマイト", cost_reduction: 61, is_recommended: false, sort_order: 3 },
  { id: "4", name: "Ag + 黄色クリアコート", cost_reduction: 28, is_recommended: false, sort_order: 4 },
];

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return jsonResponse({ materials: memoryMaterials });
    }

    const { data, error } = await supabaseSchema("room1")
      .from("alternatives")
      .select("id, name, cost_reduction, is_recommended, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[materials] fetch failed:", error.message);
      return jsonResponse({ materials: memoryMaterials });
    }

    return jsonResponse({ materials: data || [] });
  } catch {
    return jsonResponse({ materials: memoryMaterials });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, cost_reduction, is_recommended } = await req.json();

    if (!isSupabaseConfigured) {
      const id = `mem_${Date.now()}`;
      const item = { id, name, cost_reduction, is_recommended: is_recommended || false, sort_order: memoryMaterials.length + 1 };
      memoryMaterials.push(item);
      return jsonResponse({ material: item });
    }

    // 次のsort_orderを取得
    const { data: maxData } = await supabaseSchema("room1")
      .from("alternatives")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (maxData?.[0]?.sort_order || 0) + 1;

    const { data, error } = await supabaseSchema("room1")
      .from("alternatives")
      .insert({ name, cost_reduction, is_recommended: is_recommended || false, sort_order: nextOrder })
      .select("id, name, cost_reduction, is_recommended, sort_order")
      .single();

    if (error) {
      console.error("[materials] insert failed:", error.message);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ material: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, cost_reduction, is_recommended } = await req.json();

    if (!isSupabaseConfigured) {
      const idx = memoryMaterials.findIndex((m) => m.id === id);
      if (idx >= 0) {
        memoryMaterials[idx] = { ...memoryMaterials[idx], name, cost_reduction, is_recommended };
      }
      return jsonResponse({ success: true });
    }

    const { error } = await supabaseSchema("room1")
      .from("alternatives")
      .update({ name, cost_reduction, is_recommended })
      .eq("id", id);

    if (error) {
      console.error("[materials] update failed:", error.message);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!isSupabaseConfigured) {
      memoryMaterials = memoryMaterials.filter((m) => m.id !== id);
      return jsonResponse({ success: true });
    }

    const { error } = await supabaseSchema("room1")
      .from("alternatives")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[materials] delete failed:", error.message);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
}
