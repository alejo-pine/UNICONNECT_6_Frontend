export interface Subject {
  id: string;
  name: string;
}
/*
export interface ProfileData {
  career: string;
  semester: number;
  avatar?: string;
  subjects: Subject[];
  phone?: string;
  name?: string;
  university?: string;
}*/

// src/features/profile/types/profile.ts
export interface ProfileData {
  id: string;
  name?: string;           // Nombre del usuario
  email?: string;          // Email del usuario
  avatar_url?: string | null;  // URL del avatar
  career?: string | null;  // Carrera/Programa
  semester?: number | null; // Semestre actual
  phone_number?: string | null; // Número de teléfono
  created_at?: string;    // Fecha de creación
  materias?: Subject[];    // Se mantiene para la lógica de la App (tabla intermedia)
}

export interface Career {
  value: string;
  label: string;
}

export interface Semester {
  value: string;
  label: string;
}

export const CAREERS: Career[] = [
  { value: 'Ingeniería de sistemas', label: 'Ingeniería de sistemas' },
  { value: 'Derecho', label: 'Derecho' },
  { value: 'Ingeniería Agronómica', label: 'Ingeniería Agronómica' },
  { value: 'Diseño Visual', label: 'Diseño Visual' },
  { value: 'Licenciatura en Educación Física', label: 'Lic. en Educación Física' },
  { value: 'Medicina', label: 'Medicina' },
  { value: 'Enfermería', label: 'Enfermería' },
  { value: 'Artes Plásticas', label: 'Artes Plásticas' },
  { value: 'Desarrollo Familiar', label: 'Desarrollo Familiar' },
  { value: 'Geología', label: 'Geología' },
  { value: 'Ingeniería de Alimentos', label: 'Ingeniería de Alimentos' },
  { value: 'Biología', label: 'Biología' },
  { value: 'Antropología', label: 'Antropología' },
  { value: 'Filosofía y Letras', label: 'Filosofía y Letras' },
];

export const SEMESTERS: Semester[] = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
];
