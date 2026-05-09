/**
 * Tipos para perfil público de estudiante
 */

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
