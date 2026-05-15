import type { WallPost } from '../../domain/wall';
import { WallPostCard } from './WallPostCard';
import { AttachmentRenderer } from './AttachmentRenderer';

interface Props {
  post: WallPost;
  currentUserId?: string;
  onSenderClick?: (senderId: string, senderName: string, avatarUrl?: string) => void;
}

export function WallPostWithAttachments({ post, currentUserId, onSenderClick }: Props) {
  return (
    <div>
      <WallPostCard post={post} currentUserId={currentUserId} onSenderClick={onSenderClick} />
      {post.attachments.length > 0 && (
        <div className="ml-12 mt-2 flex flex-wrap gap-2">
          {post.attachments.map((att, i) => (
            <AttachmentRenderer key={att.id ?? `att-${i}`} attachment={att} />
          ))}
        </div>
      )}
    </div>
  );
}
