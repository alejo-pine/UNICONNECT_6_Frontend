/**
 * Tipos para el módulo de Grupos de Estudio
 */

export interface StudyGroupSubject {
  id: string;
  name: string;
}

export interface GroupUser {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Categoría académica de un grupo
 */
export type StudyGroupCategory = 'ACADEMIC' | 'PROJECT' | 'SOCIAL' | 'SPORTS';

/**
 * Datos mínimos de un grupo de estudio
 */
export interface StudyGroupCreatePayload {
  name: string;
  description: string;
  subject_id: string;
}

/**
 * Grupo de estudio retornado por el backend
 */
export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  subject?: StudyGroupSubject;
  category?: StudyGroupCategory;
  creator_id: string;
  createdBy?: string;
  created_at: string;
  updated_at?: string;
  member_count?: number;
  is_member?: boolean;
  is_admin: boolean;
  members?: GroupUser[];
  pendingRequests?: GroupUser[];
  pendingAdminTransfer?: {
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
}

/**
 * Respuesta de creación de grupo
 */
export interface CreateGroupResponse {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  created_at: string;
  created_by: string;
}

export type GroupSearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface OpenGraphData {
  title?: string;
  description?: string;
  imageUrl?: string;
  url: string;
}

export interface GroupResource {
  id: string;
  group_id: string;
  uploaded_by: string;
  url: string;
  title: string;
  description: string;
  image_url: string;
  role_required: 'member' | 'admin';
  metadata?: any;
  created_at: string;
}

export interface CreateResourcePayload {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  roleRequired?: 'member' | 'admin';
  metadata?: any;
}
