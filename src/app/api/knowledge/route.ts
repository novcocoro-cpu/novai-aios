import { NextRequest } from "next/server";
import { supabaseSchema, isSupabaseConfigured } from "@/lib/supabase-server";
import { jsonResponse } from "@/lib/api-response";

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  file_name: string | null;
  file_type: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// メモリフォールバック
let memoryItems: KnowledgeItem[] = [];
let memCounter = 0;

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");

    if (!isSupabaseConfigured) {
      const filtered = category && category !== "all"
        ? memoryItems.filter((i) => i.category === category)
        : memoryItems;
      return jsonResponse({ items: filtered });
    }

    let query = supabaseSchema("shared")
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
      return jsonResponse({ items: memoryItems });
    }

    return jsonResponse({ items: data || [] });
  } catch {
    return jsonResponse({ items: memoryItems });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { category, title, content, file_name, file_type, tags } = await req.json();

    if (!title || !content) {
      return jsonResponse({ error: "タイトルと内容は必須です" }, 400);
    }

    if (!isSupabaseConfigured) {
      const item: KnowledgeItem = {
        id: `mem_${++memCounter}`,
        category: category || "other",
        title,
        content,
        file_name: file_name || null,
        file_type: file_type || null,
        tags: tags || [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryItems.unshift(item);
      return jsonResponse({ item });
    }

    const { data, error } = await supabaseSchema("shared")
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

    if (!isSupabaseConfigured) {
      const idx = memoryItems.findIndex((i) => i.id === id);
      if (idx >= 0) {
        memoryItems[idx] = {
          ...memoryItems[idx],
          category: category ?? memoryItems[idx].category,
          title: title ?? memoryItems[idx].title,
          content: content ?? memoryItems[idx].content,
          tags: tags ?? memoryItems[idx].tags,
          updated_at: new Date().toISOString(),
        };
      }
      return jsonResponse({ success: true });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;

    const { error } = await supabaseSchema("shared")
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

    if (!isSupabaseConfigured) {
      memoryItems = memoryItems.filter((i) => i.id !== id);
      return jsonResponse({ success: true });
    }

    const { error } = await supabaseSchema("shared")
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
