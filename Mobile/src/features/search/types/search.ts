/**
 * Tipos para la feature de búsqueda de compañeros (US-005)
 */

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

/**
 * Máquina de estados de la búsqueda.
 * idle     → esperando que el usuario seleccione una materia
 * loading  → petición en curso
 * success  → resultados encontrados
 * empty    → petición exitosa pero sin resultados
 * error    → fallo en la petición
 */
export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";
