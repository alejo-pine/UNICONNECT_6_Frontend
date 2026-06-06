import { AlertCircle, Clock } from 'lucide-react';

interface Props {
  message: string | null;
  isSpam: boolean;
}

export function ModerationBanner({ message, isSpam }: Props) {
  if (!message) return null;

  return (
    <div
      className={[
        'mb-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
        isSpam
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-red-200 bg-red-50 text-red-600',
      ].join(' ')}
    >
      {isSpam ? (
        <Clock size={13} className="mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
