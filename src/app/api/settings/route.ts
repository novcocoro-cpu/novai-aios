import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { setSetting } from "@/lib/settings";
import { DEFAULT_PROMPTS } from "@/lib/default-prompts";
import { jsonResponse } from "@/lib/api-response";

const USER_ID = process.env.DEFAULT_USER_ID!;

export async function GET() {
  try {
    const supabase = createServerClient("mekki_shared");
    const { data, error } = await supabase
      .from("app_settings")
      .select("setting_key, setting_value")
      .eq("user_id", USER_ID);

    if (error) {
      console.error("[settings] fetch failed:", error.message);
      return jsonResponse({ settings: DEFAULT_PROMPTS });
    }

    const settings: Record<string, string> = { ...DEFAULT_PROMPTS };
    for (const row of data ?? []) {
      settings[row.setting_key] = String(row.setting_value);
    }
    return jsonResponse({ settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[settings] error:", message);
    return jsonResponse({ settings: DEFAULT_PROMPTS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await setSetting(key, value, USER_ID);
    }
    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[settings] error:", message);
    return jsonResponse({ error: message }, 500);
  }
}
