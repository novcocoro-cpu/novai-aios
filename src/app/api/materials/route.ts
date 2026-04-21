import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/api-response";

// TODO: alternative_materials テーブルとUI設計の整合性を取る必要あり。
// 現状は空配列でUI側を「データなし」表示にする。移動後に再設計。
// DB実体: id, user_id, session_id, material_name, properties, cost_comparison,
//         use_cases, source_urls, ai_summary, notes, created_at, updated_at
// UI期待: name, cost_reduction, is_recommended, sort_order
export async function GET() {
  return jsonResponse({ materials: [] });
}

export async function POST(req: NextRequest) {
  try {
    const { name, cost_reduction, is_recommended } = await req.json();
    const supabase = createServerClient("mekki_room1");

    const { data: maxData } = await supabase
      .from("alternative_materials")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (maxData?.[0]?.sort_order || 0) + 1;

    const { data, error } = await supabase
      .from("alternative_materials")
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
    const supabase = createServerClient("mekki_room1");

    const { error } = await supabase
      .from("alternative_materials")
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
    const supabase = createServerClient("mekki_room1");

    const { error } = await supabase
      .from("alternative_materials")
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
