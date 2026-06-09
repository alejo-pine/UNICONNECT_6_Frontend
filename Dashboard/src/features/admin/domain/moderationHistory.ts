export interface ModerationRecord {
  id: string;
  user_id: string;
  rejection_code: string;
  reason: string;
  blocked_until: string | null;
  created_at: string;
}

export type ModerationHistoryResponse =
  | { success: true; data: ModerationRecord[] }
  | { success: false; error: string; statusCode?: number };
