import type { IMensaje } from '../../domain/mensaje/IMensaje';
import { MensajeConEncuesta } from '../../domain/mensaje/MensajeConEncuesta';
import type { WallPost } from '../../domain/wall';
import { AttachmentRenderer } from './AttachmentRenderer';
import { WallPostCard } from './WallPostCard';

interface Props {
  post: WallPost;
  currentUserId?: string;
  onSenderClick?: (senderId: string, senderName: string, avatarUrl?: string) => void;
  onPollVote?: (pollId: string, optionId: string) => void;
  onPollClose?: (pollId: string) => void;
  onPollAlreadyVoted?: () => void;
}

export function WallPostWithAttachments({
  post,
  currentUserId,
  onSenderClick,
  onPollVote,
  onPollClose,
  onPollAlreadyVoted,
}: Props) {
  const attachmentsNode =
    post.attachments.length > 0 ? (
      <div className="ml-12 mt-2 flex flex-wrap gap-2">
        {post.attachments.map((att, i) => (
          <AttachmentRenderer key={att.id ?? `att-${i}`} attachment={att} />
        ))}
      </div>
    ) : null;

  // Posts con encuesta → usar el Decorator (Criterio 3 US-V04)
  if (post.poll) {
    // Adaptador inline: envuelve WallPostCard + adjuntos como IMensaje
    // Para posts de encuesta el backend almacena la pregunta en content;
    // suprimimos el texto para evitar que aparezca duplicado bajo el card.
    const pollBase = { ...post, content: '' };
    const wallBase: IMensaje = {
      getContenido: () => post.content,
      getMetadata: () => ({ postId: post.id, senderId: post.senderId }),
      render: () => (
        <>
          <WallPostCard
            post={pollBase}
            currentUserId={currentUserId}
            onSenderClick={onSenderClick}
          />
          {attachmentsNode}
        </>
      ),
    };

    const decorated = new MensajeConEncuesta(
      wallBase,
      post.poll,
      (pollId, optionId) => onPollVote?.(pollId, optionId),
      onPollClose ? (pollId) => onPollClose(pollId) : undefined,
      onPollAlreadyVoted,
    );

    return <div>{decorated.render()}</div>;
  }

  // Posts sin encuesta → renderizado existente sin cambios
  return (
    <div>
      <WallPostCard post={post} currentUserId={currentUserId} onSenderClick={onSenderClick} />
      {attachmentsNode}
    </div>
  );
}
