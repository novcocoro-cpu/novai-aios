import { createServerClient } from "./supabase/server";

export async function getSetting<T = unknown>(
  key: string,
  userId: string | null = null,
): Promise<T | null> {
  const supabase = createServerClient("mekki_shared");
  const base = supabase
    .from("app_settings")
    .select("setting_value")
    .eq("setting_key", key);
  const filtered = userId ? base.eq("user_id", userId) : base.is("user_id", null);
  const { data } = await filtered.maybeSingle();
  return (data?.setting_value as T) ?? null;
}

export async function setSetting(
  key: string,
  value: unknown,
  userId: string | null = null,
): Promise<void> {
  const supabase = createServerClient("mekki_shared");
  await supabase
    .from("app_settings")
    .upsert(
      { user_id: userId, setting_key: key, setting_value: value },
      { onConflict: "user_id,setting_key" },
    );
}
