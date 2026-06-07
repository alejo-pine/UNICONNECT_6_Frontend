import { useEffect, useRef, useState } from 'react';

const COOLDOWN_DURATION = 300;
const SPAM_BLOCK_KEY = 'uniconnect_spam_block_until';

const MODERATION_MESSAGES: Record<string, string> = {
  MO_001: 'Tu mensaje es demasiado largo. Reduce el contenido e intenta de nuevo.',
  MO_002: 'Tu mensaje contiene contenido no permitido en esta comunidad.',
  MO_004: 'No está permitido enviar enlaces externos en el chat.',
};

function getRemainingSeconds(): number {
  try {
    const raw = localStorage.getItem(SPAM_BLOCK_KEY);
    if (!raw) return 0;
    const remaining = Math.ceil((parseInt(raw, 10) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

export function useModerationFeedback() {
  const [moderationCode, setModerationCode] = useState<string | null>(() =>
    getRemainingSeconds() > 0 ? 'MO_003' : null,
  );
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(() => getRemainingSeconds());
  const [escalated, setEscalated] = useState(false);
  const [ruleExplanation, setRuleExplanation] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const expireBlock = () => {
    clearTimer();
    setModerationCode(null);
    setServerMessage(null);
    setEscalated(false);
    setRuleExplanation(null);
    setCooldownSeconds(0);
    try { localStorage.removeItem(SPAM_BLOCK_KEY); } catch { /* noop */ }
  };

  // Lee el timestamp real en cada tick en vez de decrementar state (prev - 1).
  // Así el countdown es preciso aunque el browser throttlee el intervalo en
  // pestañas de fondo (los navegadores limitan setInterval a ~1 vez/min en BG).
  const startInterval = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      const remaining = getRemainingSeconds();
      if (remaining <= 0) {
        expireBlock();
      } else {
        setCooldownSeconds(remaining);
      }
    }, 1000);
  };

  useEffect(() => {
    if (getRemainingSeconds() > 0) {
      startInterval();
    }

    // Corrige el display inmediatamente al volver a la pestaña, sin esperar
    // al próximo tick del intervalo (que puede haber tardado hasta 1 min).
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const remaining = getRemainingSeconds();
      if (remaining > 0) {
        setCooldownSeconds(remaining);
        if (timerRef.current == null) startInterval();
      } else if (timerRef.current != null) {
        expireBlock();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModerationError = (
    code: string,
    detail?: string,
    esc?: boolean,
    ruleExp?: string,
  ) => {
    setModerationCode(code);
    setServerMessage(detail ?? null);
    setEscalated(esc ?? false);
    setRuleExplanation(ruleExp ?? null);

    if (code === 'MO_003') {
      try {
        localStorage.setItem(SPAM_BLOCK_KEY, String(Date.now() + COOLDOWN_DURATION * 1000));
      } catch { /* noop */ }
      setCooldownSeconds(COOLDOWN_DURATION);
      startInterval();
    }
  };

  const clearError = () => {
    if (moderationCode !== 'MO_003') {
      setModerationCode(null);
      setServerMessage(null);
      setEscalated(false);
      setRuleExplanation(null);
    }
  };

  const formatCooldown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')} min` : `${seconds}s`;
  };

  const isBlocked = cooldownSeconds > 0;

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
