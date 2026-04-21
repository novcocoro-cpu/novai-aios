import { createServerClient } from "./supabase/server";
import type { Room } from "./supabase/types";

export type ActivityActionType =
  | "chat_message_sent"
  | "file_uploaded"
  | "simulation_run"
  | "proposal_created"
  | "talk_script_created"
  | "supplier_added"
  | "research_saved"
  | "knowledge_promoted"
  | "session_completed";

export interface LogActivityInput {
  userId: string;
  actionType: ActivityActionType;
  roomNumber?: Room | null;
  targetTable?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  const supabase = createServerClient("mekki_dashboard");
  await supabase.from("activity_logs").insert({
    user_id: input.userId,
    action_type: input.actionType,
    room_number: input.roomNumber ?? null,
    target_table: input.targetTable ?? null,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });
}
