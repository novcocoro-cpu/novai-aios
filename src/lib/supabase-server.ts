// サーバーサイド専用 Supabase クライアント（API Routes用）
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// キーが未設定かどうか判定
export const isSupabaseConfigured =
  supabaseServiceKey !== "YOUR_SUPABASE_SERVICE_ROLE_KEY" &&
  supabaseServiceKey !== "YOUR_SUPABASE_ANON_KEY" &&
  supabaseServiceKey.length > 20;

// デフォルト（publicスキーマ）用
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// カスタムスキーマ用 — インスタンスをキャッシュして使い回す
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schemaClients: Record<string, any> = {};

export function supabaseSchema(schema: "shared" | "room1" | "room2" | "room3" | "dashboard") {
  if (!schemaClients[schema]) {
    schemaClients[schema] = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema },
    });
  }
  return schemaClients[schema];
}
