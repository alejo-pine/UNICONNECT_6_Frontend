export interface SearchSubject {
  id: string;
  name: string;
  code?: string;
}

export interface Classmate {
  id: string;
  name: string;
  career: string;
  avatar_url?: string | null;
  semester?: number | null;
}

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface PublicProfileSubject {
  id: string;
  name: string;
}

export interface PublicProfile {
  id: string;
  full_name: string;
  career: string | null;
  semester: number | null;
  phone_number: string | null;
  avatar_url: string | null;
  subjects: PublicProfileSubject[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
