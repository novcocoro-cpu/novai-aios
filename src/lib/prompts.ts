import { createServerClient } from "./supabase/server";
import type { Room } from "./supabase/types";

export async function getActivePrompt(roomNumber: Room): Promise<string | null> {
  const supabase = createServerClient("mekki_shared");
  const { data } = await supabase
    .from("prompt_templates")
    .select("prompt_text")
    .eq("room_number", roomNumber)
    .eq("is_active", true)
    .maybeSingle();
  return (data?.prompt_text as string | null) ?? null;
}
