import { createClient } from "@supabase/supabase-js";

export type MekkiSchema =
  | "mekki_shared"
  | "mekki_room1"
  | "mekki_room2"
  | "mekki_room3"
  | "mekki_dashboard";

export function createServerClient(schema: MekkiSchema = "mekki_shared") {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema },
      auth: { persistSession: false },
    },
  );
}
