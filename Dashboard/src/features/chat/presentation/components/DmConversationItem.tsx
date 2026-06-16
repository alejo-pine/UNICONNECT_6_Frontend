import { ChevronRight } from 'lucide-react';
import type { DmConversation } from '../../domain/dm';
import { formatRelativeTime } from '@shared/utils/time';

interface Props {
  conversation: DmConversation;
  onClick: () => void;
}

export function DmConversationItem({ conversation, onClick }: Props) {
  const { otherParticipant, lastMessage, createdAt } = conversation;
  const initial = otherParticipant.name.charAt(0).toUpperCase();
  const displayDate = lastMessage?.createdAt ?? createdAt;


  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-ink-100 bg-white px-5 py-4 text-left shadow-sm transition hover:bg-brand-50"
    >
      <div className="flex h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
        {otherParticipant.avatarUrl ? (
          <img
            src={otherParticipant.avatarUrl}
            alt={otherParticipant.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-100 text-sm font-bold text-brand-900">
            {initial}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink-900">{otherParticipant.name}</p>
      </div>

      <span className="flex-shrink-0 text-xs text-ink-400">{formatRelativeTime(displayDate)}</span>

      <ChevronRight size={16} className="flex-shrink-0 text-ink-300" />
    </button>
  );
}
