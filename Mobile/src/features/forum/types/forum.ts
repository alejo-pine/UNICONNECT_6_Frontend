export interface ForumQuestion {
  id: string;
  subject_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  title: string;
  content: string;
  is_resolved: boolean;
  answer_count: number;
  created_at: string;
}

export interface ForumAnswer {
  id: string;
  question_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  is_accepted: boolean;
  vote_count: number;
  has_voted: boolean;
  created_at: string;
}

export interface CreateQuestionPayload {
  subject_id: string;
  title: string;
  content: string;
}

export interface CreateAnswerPayload {
  content: string;
}

export interface AcceptAnswerPayload {
  is_accepted: boolean;
}

export interface ForumApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isForbidden?: boolean;
}
