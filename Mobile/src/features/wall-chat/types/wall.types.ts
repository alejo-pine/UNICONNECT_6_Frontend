export interface WallPostAttachment {
  id?: string;
  postId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath?: string;
  uploadedAt?: string;
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
  /** Nombre para mostrar; lo envía el backend en GET/POST del muro y en eventos WS. */
  senderName?: string;
  avatarUrl?: string | null;
  content?: string;
  createdAt: string;
  attachments?: WallPostAttachment[];
  poll?: Poll;
}

export interface WallLastPost {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface WallInboxEntry {
  groupId: string;
  groupName: string;
  lastPost: WallLastPost | null;
}
