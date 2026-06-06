import { useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button } from '@shared/components/ui/Button';
import type { DmAttachment, PendingDmAttachment } from '../../domain/dm';
import type { DmMessage } from '../../domain/dm';
import { uploadDmToSupabase } from '../../infrastructure/attachmentService';
import { dmHttpService } from '../../infrastructure/dmHttpService';
import { AttachmentChip } from './AttachmentChip';
import { ModerationBanner } from './ModerationBanner';
import { useModerationFeedback } from '../hooks/useModerationFeedback';

const MAX_LENGTH = 1000;
const COUNTER_THRESHOLD = 750;
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/i;

interface Props {
  conversationId: string;
  onMessageSent?: (message: DmMessage) => void;
}

export function DmMessageInput({ conversationId, onMessageSent }: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingDmAttachment[]>([]);
  const [urlWarning, setUrlWarning] = useState(false);

  const { moderationCode, isBlocked, displayMessage, handleModerationError, clearError } =
    useModerationFeedback();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removePending = (localId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.localId !== localId));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    for (const file of files) {
      const localId = `${Date.now()}_${Math.random()}_${file.name}`;
      setPendingAttachments((prev) => [...prev, { localId, file, uploading: true }]);

      const result = await uploadDmToSupabase(file, conversationId);

      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.localId === localId
            ? result.success
              ? { ...a, uploading: false, storagePath: result.storagePath }
              : { ...a, uploading: false, error: result.error }
            : a,
        ),
      );
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSendError(null);
    clearError();
    setUrlWarning(URL_REGEX.test(val));
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    const readyAttachments = pendingAttachments.filter(
      (a) => !a.uploading && a.storagePath && !a.error,
    );
    if ((!trimmed && readyAttachments.length === 0) || sending || isBlocked) return;

    setSending(true);
    setSendError(null);

    const attachments: DmAttachment[] = readyAttachments.map((a) => ({
      fileName: a.file.name,
      fileType: a.file.type,
      fileSize: a.file.size,
      storagePath: a.storagePath!,
    }));

    const result = await dmHttpService.sendMessage(conversationId, trimmed || undefined, attachments);

    if (!result.success) {
      if (result.moderationCode) {
        handleModerationError(result.moderationCode, result.error);
      } else {
        setSendError(result.error ?? 'No se pudo enviar el mensaje');
      }
    } else {
      setContent('');
      setPendingAttachments([]);
      setUrlWarning(false);
      clearError();
      if (result.data) onMessageSent?.(result.data);
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      void handleSend();
    }
  };

  const isUploading = pendingAttachments.some((a) => a.uploading);
  const hasReadyContent =
    content.trim().length > 0 ||
    pendingAttachments.some((a) => !a.uploading && a.storagePath && !a.error);
  const canSend = hasReadyContent && !sending && !isUploading && !isBlocked;
  const showCounter = content.length > COUNTER_THRESHOLD;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3">
      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingAttachments.map((att) => (
            <AttachmentChip
              key={att.localId}
              attachment={att}
              onRemove={() => removePending(att.localId)}
            />
          ))}
        </div>
      )}

      <ModerationBanner message={displayMessage} isSpam={moderationCode === 'MO_003'} />

      {!displayMessage && sendError && (
        <p className="mb-2 text-xs font-medium text-red-600">{sendError}</p>
      )}

      {urlWarning && !displayMessage && (
        <p className="mb-2 text-xs font-medium text-amber-600">
          No se permiten enlaces externos en el chat.
        </p>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Adjuntar archivo"
          disabled={isBlocked}
          className="flex-shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:opacity-40"
        >
          <Paperclip size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={isBlocked ? 'Espera antes de escribir de nuevo…' : 'Escribe un mensaje… (Ctrl+Enter para enviar)'}
            rows={2}
            maxLength={MAX_LENGTH}
            disabled={isBlocked}
            className="w-full resize-none rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {showCounter && (
            <span
              className={[
                'absolute bottom-2 right-2 text-xs',
                content.length >= MAX_LENGTH ? 'text-red-500' : 'text-ink-400',
              ].join(' ')}
            >
              {content.length}/{MAX_LENGTH}
            </span>
          )}
        </div>

        <Button
          onClick={() => void handleSend()}
          disabled={!canSend}
          className="flex-shrink-0"
          title="Enviar"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
