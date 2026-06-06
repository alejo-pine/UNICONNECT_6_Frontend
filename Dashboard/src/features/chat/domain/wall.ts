export interface WallAttachment {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
}

export interface GroupMember {
  id: string;
  name: string;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
  votedByMe: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  closed: boolean;
  expiresAt?: string;
  closedAt?: string;
}

export interface WallPost {
  id: string;
  groupId: string;
  senderId: string;
  senderName?: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  attachments: WallAttachment[];
  mentions: string[];
  mentionedNames: string[];
  poll?: Poll;
}

export interface WallInboxItem {
  groupId: string;
  groupName: string;
  lastPost: WallPost | null;
}

export interface PendingAttachment {
  localId: string;
  file: File;
  uploading: boolean;
  storagePath?: string;
  error?: string;
}

export interface ChatApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  moderationCode?: string;
}
