import { useCallback, useEffect, useRef, useState } from 'react';

const COOLDOWN_DURATION = 300;

const MODERATION_MESSAGES: Record<string, string> = {
  MO_001: 'Tu mensaje es demasiado largo. Reduce el contenido e intenta de nuevo.',
  MO_002: 'Tu mensaje contiene contenido no permitido en esta comunidad.',
  MO_004: 'No está permitido enviar enlaces externos en el chat.',
};

// Variable a nivel de módulo: persiste entre desmontajes en la misma sesión de app
let spamBlockUntil = 0;

const getRemainingSeconds = (): number => {
  if (!spamBlockUntil) return 0;
  const remaining = Math.ceil((spamBlockUntil - Date.now()) / 1000);
  if (remaining <= 0) {
    spamBlockUntil = 0;
    return 0;
  }
  return remaining;
};

export interface ModerationError {
  code?: string;
  detail?: string;
  escalated?: boolean;
  ruleExplanation?: string;
}

const SPAM_PATTERN = /demasiados mensajes en poco tiempo/i;

/** Extrae código de moderación y detalle de un error de Axios */
export const extractModerationError = (e: unknown): ModerationError => {
  if (e && typeof e === 'object') {
    const axiosErr = e as {
      response?: {
        data?: {
          moderationCode?: string;
          codigoError?: string;
          ruleExplanation?: string;
          detalle?: string;
          message?: string;
          escalated?: boolean;
        };
      };
    };
    const data = axiosErr.response?.data;
    // Backend now sends 'moderationCode'; fallback to legacy 'codigoError' for compat
    const code = data?.moderationCode ?? data?.codigoError;
    if (typeof code === 'string' && code.startsWith('MO_')) {
      const ruleExplanation = data?.ruleExplanation || undefined;
      const escalated = data?.escalated === true;
      // Use detalle for legacy compat, else fall to message (short banner text)
      const detail = data?.detalle || data?.message;
      return { code, detail, escalated, ruleExplanation };
    }
    // Fallback: detect MO_003 by message text if moderationCode field is absent
    const msg = typeof data?.message === 'string' ? data.message : '';
    if (SPAM_PATTERN.test(msg)) {
      return { code: 'MO_003', detail: msg };
    }
  }
  return {};
};

export function useModerationFeedback() {
  const [moderationCode, setModerationCode] = useState<string | null>(() =>
    getRemainingSeconds() > 0 ? 'MO_003' : null,
  );
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(() => getRemainingSeconds());
  const [escalated, setEscalated] = useState(false);
  const [ruleExplanation, setRuleExplanation] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Lee el timestamp real en cada tick en vez de decrementar state (prev - 1).
  const startInterval = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      const remaining = getRemainingSeconds();
      if (remaining <= 0) {
        clearTimer();
        spamBlockUntil = 0;
        setModerationCode(null);
        setServerMessage(null);
        setEscalated(false);
        setRuleExplanation(null);
        setCooldownSeconds(0);
      } else {
        setCooldownSeconds(remaining);
      }
    }, 1000);
  }, [clearTimer]);

  // Rehydrata el timer al montar si hay un bloqueo activo
  useEffect(() => {
    if (getRemainingSeconds() > 0) {
      startInterval();
    }
    return () => clearTimer();
  }, [clearTimer, startInterval]);

  const handleModerationError = useCallback(
    (code: string, detail?: string, esc?: boolean, ruleExp?: string) => {
      setModerationCode(code);
      setServerMessage(detail ?? null);
      setEscalated(esc ?? false);
      setRuleExplanation(ruleExp ?? null);

      if (code === 'MO_003') {
        spamBlockUntil = Date.now() + COOLDOWN_DURATION * 1000;
        setCooldownSeconds(COOLDOWN_DURATION);
        startInterval();
      }
    },
    [startInterval],
  );

  const clearError = useCallback(() => {
    if (moderationCode !== 'MO_003') {
      setModerationCode(null);
      setServerMessage(null);
      setEscalated(false);
      setRuleExplanation(null);
    }
  }, [moderationCode]);

  const isBlocked = cooldownSeconds > 0;

  const formatCooldown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')} min` : `${seconds}s`;
  };

  const displayMessage = (() => {
    if (!moderationCode) return null;
    if (moderationCode === 'MO_003') {
      return `Has enviado demasiados mensajes en poco tiempo. Podrás escribir nuevamente en ${formatCooldown(cooldownSeconds)}.`;
    }
    return serverMessage || MODERATION_MESSAGES[moderationCode] || 'No se pudo enviar el mensaje.';
  })();

  return {
    moderationCode,
    isBlocked,
    cooldownSeconds,
    displayMessage,
    escalated,
    ruleExplanation,
    handleModerationError,
    clearError,
  };
}
