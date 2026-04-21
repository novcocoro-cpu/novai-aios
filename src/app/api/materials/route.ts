import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const supabase = createServerClient("mekki_room1");
    const { data, error } = await supabase
      .from("alternatives")
      .select("id, name, cost_reduction, is_recommended, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[materials] fetch failed:", error.message);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ materials: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, cost_reduction, is_recommended } = await req.json();
    const supabase = createServerClient("mekki_room1");

    const { data: maxData } = await supabase
      .from("alternatives")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (maxData?.[0]?.sort_order || 0) + 1;

    const { data, error } = await supabase
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
    const supabase = createServerClient("mekki_room1");

    const { error } = await supabase
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
    const supabase = createServerClient("mekki_room1");

    const { error } = await supabase
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
