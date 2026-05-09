export interface EventCardSummary {
  id: string;
  title: string;
  description: string;
  faculty: string;
  event_date: string;
  event_time: string;
  image_url: string | null;
}

export interface EventDetail extends EventCardSummary {
  profile_id: string;
  organizer_name: string;
  location: string;
  category: string;
  created_at: string;
}

export interface ApiErrorResponse {
  error?: string;
  statusCode?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
