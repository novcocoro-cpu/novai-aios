import { NextRequest } from "next/server";
import { listActiveSessions } from "@/lib/chat/sessions";
import { jsonResponse } from "@/lib/api-response";
import type { Room } from "@/lib/supabase/types";

const ROOM_MAP: Record<string, Room> = {
  strategy: 1,
  sales: 2,
  tech: 3,
};

export async function GET(req: NextRequest) {
  try {
    const defaultUserId = process.env.DEFAULT_USER_ID;
    if (!defaultUserId) {
      console.error("[conversations] DEFAULT_USER_ID not set");
      return jsonResponse({ conversations: [] });
    }

    const roomParam = req.nextUrl.searchParams.get("room");
    if (roomParam && roomParam in ROOM_MAP) {
      const sessions = await listActiveSessions(defaultUserId, ROOM_MAP[roomParam]);
      return jsonResponse({ conversations: sessions });
    }

    const rooms = Object.values(ROOM_MAP) as Room[];
    const perRoom = await Promise.all(
      rooms.map((r) => listActiveSessions(defaultUserId, r)),
    );
    const all = perRoom.flat().sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    return jsonResponse({ conversations: all });
  } catch (err) {
    console.error("[conversations] GET error:", err);
    return jsonResponse({ conversations: [] });
  }
}
