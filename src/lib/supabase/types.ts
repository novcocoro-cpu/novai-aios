export type Room = 1 | 2 | 3;

export type SessionStatus = "active" | "completed" | "archived";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatSession {
  id: string;
  user_id: string;
  room_number: Room;
  title: string | null;
  status: SessionStatus;
  summary: string | null;
  message_count: number;
  total_tokens: number;
  summarized_until_message_id: string | null;
  completed_at: string | null;
  archived_at: string | null;
  retention_days: number | null;
  model_used: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  model_used: string | null;
  attachments: Array<{ file_id: string; filename: string }>;
  metadata: Record<string, unknown>;
  created_at: string;
}
