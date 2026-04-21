import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/settings";

const DEFAULT_ARCHIVE_DAYS = 90;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const days =
    (await getSetting<number>("auto_archive_completed_days")) ?? DEFAULT_ARCHIVE_DAYS;
  const threshold = new Date(Date.now() - days * 86400 * 1000).toISOString();
  const supabase = createServerClient("mekki_shared");

  const { error, count } = await supabase
    .from("chat_sessions")
    .update(
      { status: "archived", archived_at: new Date().toISOString() },
      { count: "exact" },
    )
    .eq("status", "completed")
    .lt("completed_at", threshold);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, archived: count ?? 0, thresholdDays: days });
}
