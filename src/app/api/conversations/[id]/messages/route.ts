import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createServerClient("mekki_shared");
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[messages] fetch failed:", error.message);
      return jsonResponse({ messages: [] });
    }
    return jsonResponse({ messages: data ?? [] });
  } catch (err) {
    console.error("[messages] error:", err);
    return jsonResponse({ messages: [] });
  }
}
