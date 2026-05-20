export interface StudyGroupSubject {
  id: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type StudyGroupCategory = 'ACADEMIC' | 'PROJECT' | 'SOCIAL' | 'SPORTS';

export interface UserProfileSummary {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface StudyGroupCreatePayload {
  name: string;
  description: string;
  subject_id: string;
}

export interface PendingAdminTransfer {
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  subject?: StudyGroupSubject;
  category?: StudyGroupCategory;
  createdBy?: string;
  creator_id: string;
  created_at: string;
  updated_at?: string;
  member_count?: number;
  members?: string[];
  pendingRequests?: string[];
  pendingAdminTransfer?: PendingAdminTransfer;
  is_member?: boolean;
  is_admin: boolean;
}

export interface CreateGroupResponse {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  created_at: string;
  created_by: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface LeaveGroupResponse {
  success: boolean;
  message?: string;
}

export interface TransferAdminResponse {
  success: boolean;
  message?: string;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface StudySession {
  id: string;
  groupId: string;
  creatorId: string;
  name: string;
  description: string;
  location?: string;
  startTime: string;
  endTime: string;
  seriesId: string | null;
  recurrenceType: RecurrenceType;
  createdAt: string;
}

export interface CreateStudySessionPayload {
  name: string;
  description: string;
  location?: string;
  startTime: string;
  endTime: string;
  recurrenceType: RecurrenceType;
  recurrenceEndDate?: string;
}

export interface UpdateStudySessionPayload {
  name?: string;
  description?: string;
  location?: string;
  updateMode: 'this' | 'future';
  fromDate?: string;
}

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
