import { DmMensajeBase } from '../../domain/mensaje/DmMensajeBase';
import { AttachmentRenderer } from './AttachmentRenderer';
import { dmHttpService } from '../../infrastructure/dmHttpService';
import type { DmMessage } from '../../domain/dm';
import type { WallAttachment } from '../../domain/wall';
import { formatRelativeTime } from '@shared/utils/time';

interface Props {
  message: DmMessage;
  isOwn: boolean;
}

export function DmMessageBubble({ message, isOwn }: Props) {
  const attachments = (message.attachments ?? []) as WallAttachment[];

  const base = new DmMensajeBase(
    message.content ?? '',
    isOwn,
    new Date(message.createdAt),
  );

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[70%] flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        {base.render()}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <AttachmentRenderer
                key={att.id ?? `att-${i}`}
                attachment={att}
                getUrl={(id) => dmHttpService.getAttachmentUrl(id)}
              />
            ))}
          </div>
        )}

        <span className="text-[10px] text-ink-400">
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
