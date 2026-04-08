import { NextRequest } from "next/server";
import { supabaseSchema, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEFAULT_PROMPTS } from "@/lib/default-prompts";
import { jsonResponse } from "@/lib/api-response";

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return jsonResponse({ settings: DEFAULT_PROMPTS });
    }

    const { data, error } = await supabaseSchema("shared").from("settings").select("key, value");
    if (error) {
      console.error("[settings] fetch failed:", error.message);
      return jsonResponse({ settings: DEFAULT_PROMPTS });
    }

    const settings: Record<string, string> = { ...DEFAULT_PROMPTS };
    if (data) {
      for (const row of data) {
        settings[row.key] = row.value;
      }
    }

    return jsonResponse({ settings });
  } catch {
    return jsonResponse({ settings: DEFAULT_PROMPTS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!isSupabaseConfigured) {
      // Update in-memory defaults
      for (const [key, value] of Object.entries(body)) {
        DEFAULT_PROMPTS[key] = value as string;
      }
      return jsonResponse({ success: true });
    }

    for (const [key, value] of Object.entries(body)) {
      const { error } = await supabaseSchema("shared").from("settings").upsert({
        key,
        value: value as string,
        updated_at: new Date().toISOString(),
      });
      if (error) console.error(`[settings] upsert ${key} failed:`, error.message);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[settings] error:", message);
    return jsonResponse({ error: message }, 500);
  }
}
