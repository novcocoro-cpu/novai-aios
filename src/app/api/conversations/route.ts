import { NextRequest } from "next/server";
import { loadConversations } from "@/lib/conversation-store";
import { jsonResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const room = req.nextUrl.searchParams.get("room") as "strategy" | "sales" | "tech" | null;
    const conversations = await loadConversations(room ?? undefined);
    return jsonResponse({ conversations });
  } catch (err) {
    console.error("[conversations] GET error:", err);
    return jsonResponse({ conversations: [] });
  }
}
