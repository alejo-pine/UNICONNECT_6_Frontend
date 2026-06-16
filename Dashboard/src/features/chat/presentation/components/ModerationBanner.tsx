import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Clock, ShieldAlert } from 'lucide-react';

interface Props {
  message: string | null;
  isSpam: boolean;
  ruleExplanation?: string | null;
  escalated?: boolean;
}

export function ModerationBanner({ message, isSpam, ruleExplanation, escalated }: Props) {
  const [whyOpen, setWhyOpen] = useState(false);

  if (!message) return null;

  const colorSpam = 'border-amber-200 bg-amber-50 text-amber-700';
  const colorError = 'border-red-200 bg-red-50 text-red-600';
  const base = isSpam ? colorSpam : colorError;
  const divider = isSpam ? 'border-amber-200' : 'border-red-200';

  return (
    <div className={`mb-2 rounded-lg border px-3 py-2 text-xs font-medium ${base}`}>
      {/* Main message row */}
      <div className="flex items-start gap-2">
        {isSpam ? (
          <Clock size={13} className="mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
        )}
        <span className="flex-1">{message}</span>
        {ruleExplanation && (
          <button
            type="button"
            onClick={() => setWhyOpen((v) => !v)}
            className="ml-1 flex flex-shrink-0 items-center gap-0.5 underline underline-offset-2 opacity-80 hover:opacity-100"
          >
            ¿Por qué?
            {whyOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}
      </div>

      {/* Rule explanation — collapsible */}
      {whyOpen && ruleExplanation && (
        <p className={`mt-2 border-t pt-2 ${divider} leading-relaxed opacity-90`}>
          {ruleExplanation}
        </p>
      )}

      {/* Escalation notice */}
      {escalated && (
        <div className={`mt-2 flex items-start gap-1.5 border-t pt-2 ${divider} text-amber-800`}>
          <ShieldAlert size={12} className="mt-0.5 flex-shrink-0" />
          <span>
            Tu caso fue escalado a revisión humana. Un administrador lo revisará pronto.
          </span>
        </div>
      )}
    </div>
  );
}
