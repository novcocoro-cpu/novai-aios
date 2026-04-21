import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    const supabase = createServerClient("mekki_shared");

    let query = supabase
      .from("knowledge_base")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[knowledge] fetch failed:", error.message);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ items: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { category, title, content, file_name, file_type, tags } = await req.json();

    if (!title || !content) {
      return jsonResponse({ error: "タイトルと内容は必須です" }, 400);
    }

    const supabase = createServerClient("mekki_shared");
    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        category: category || "other",
        title,
        content,
        file_name: file_name || null,
        file_type: file_type || null,
        tags: tags || [],
      })
      .select("*")
      .single();

    if (error) {
      console.error("[knowledge] insert failed:", error.message);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ item: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, category, title, content, tags } = await req.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;

    const supabase = createServerClient("mekki_shared");
    const { error } = await supabase
      .from("knowledge_base")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[knowledge] update failed:", error.message);
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
    const supabase = createServerClient("mekki_shared");

    const { error } = await supabase
      .from("knowledge_base")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[knowledge] delete failed:", error.message);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
}
