import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatbotStore } from '../../store/chatbotStore';
import { chatbotHttpService } from '../../infrastructure/chatbotHttpService';
import { MarkdownMessage } from './MarkdownMessage';
import type { ChatMessage, Conversation, MessageStatus } from '../../domain/chatbot';

// ─── Helpers ────────────────────────────────────────────────────────────────

let _msgId = 0;
const nextId = () => `local-${++_msgId}-${Date.now()}`;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { icon: string; bg: string; fg: string }> = {
  timeout: { icon: 'schedule', bg: '#fff8e1', fg: '#7b5800' },
  error: { icon: 'error_outline', bg: '#ffdad6', fg: '#ba1a1a' },
  role_not_supported: { icon: 'block', bg: '#e8f1ff', fg: '#00284D' },
};

function StatusBanner({ status, message }: { status: MessageStatus; message: string }) {
  const cfg = STATUS_CFG[status];
  if (!cfg) return null;
  return (
    <div
      className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs max-w-[88%]"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      <span
        className="material-symbols-outlined flex-shrink-0 mt-px"
        style={{ fontSize: '15px' }}
      >
        {cfg.icon}
      </span>
      <span className="font-sans leading-relaxed">{message}</span>
    </div>
  );
}

function TypingDots() {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm px-3 py-2.5"
      style={{ background: '#f0f2f5', border: '1px solid #e4e2e1' }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 rounded-full"
          style={{
            background: '#73777f',
            animation: `uc-chatbot-dot 1.2s ease-in-out ${i * 0.22}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────

function FeedbackButtons({ 
  question, 
  response, 
  references 
}: { 
  question: string; 
  response: string; 
  references?: any[]; 
}) {
  const [status, setStatus] = useState<'idle' | 'useful' | 'not_useful' | 'submitting' | 'done'>('idle');
  const [comment, setComment] = useState('');

  const submitFeedback = async (rating: boolean, text?: string) => {
    setStatus('submitting');
    await chatbotHttpService.submitFeedback({
      question,
      response,
      rating,
      comments: text,
      references,
    });
    setStatus('done');
  };

  if (status === 'done') {
    return <p className="text-[10px] text-slate-400 mt-1 pl-1">¡Gracias por tu opinión!</p>;
  }

  if (status === 'not_useful') {
    return (
      <div className="mt-2 rounded-xl bg-white p-3 border border-slate-200 shadow-sm flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
        <p className="text-xs font-semibold text-[#00284D]">¿En qué podemos mejorar?</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Opcional: Detalles sobre por qué no fue útil..."
          className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#00284D]"
          rows={2}
        />
        <div className="flex gap-2 justify-end">
          <button 
            type="button" 
            onClick={() => setStatus('idle')}
            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={() => void submitFeedback(false, comment)}
            className="text-xs bg-[#00284D] text-white px-3 py-1 rounded-md"
          >
            Enviar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 mt-1.5 pl-1 opacity-60 hover:opacity-100 transition-opacity">
      <button
        type="button"
        disabled={status === 'submitting'}
        onClick={() => void submitFeedback(true)}
        className="text-slate-400 hover:text-green-600 transition-colors flex items-center gap-1 text-xs font-medium"
        title="Útil"
      >
        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
        Útil
      </button>
      <button
        type="button"
        disabled={status === 'submitting'}
        onClick={() => setStatus('not_useful')}
        className="text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs font-medium"
        title="No útil"
      >
        <span className="material-symbols-outlined text-[16px]">thumb_down</span>
        No útil
      </button>
    </div>
  );
}

export function ChatbotWidget() {
  const {
    isOpen,
    toggle,
    close,
    activeView,
    setView,
    conversationId,
    setConversationId,
    messages,
    addMessage,
    setMessages,
    conversations,
    setConversations,
    isSending,
    setSending,
    startNewConversation,
  } = useChatbotStore();

  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages change or typing indicator appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  // Focus input when switching to chat view
  useEffect(() => {
    if (isOpen && activeView === 'chat') {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen, activeView]);

  // Refresh conversation list whenever widget opens
  useEffect(() => {
    if (!isOpen) return;
    chatbotHttpService.getConversations().then((convs) => {
      setConversations(
        convs.map((c) => ({ id: c.id, createdAt: c.createdAt, lastMessage: c.lastMessage })),
      );
    });
  }, [isOpen, setConversations]);

  // ─── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setSending(true);

    const result = await chatbotHttpService.sendMessage({
      message: text,
      ...(conversationId ? { conversationId } : {}),
    });

    // Persist new conversationId from first reply
    if (result.conversationId && result.conversationId !== conversationId) {
      setConversationId(result.conversationId);
    }

    const botContent =
      result.status === 'success'
        ? result.reply
        : (result.error ?? result.reply ?? 'Ocurrió un error inesperado.');

    const botMsg: ChatMessage = {
      id: nextId(),
      role: 'assistant',
      content: botContent,
      references: result.references,
      status: result.status,
      timestamp: Date.now(),
    };
    addMessage(botMsg);
    setSending(false);
  }, [input, isSending, conversationId, addMessage, setSending, setConversationId]);

  // ─── Load prior conversation ───────────────────────────────────────────────

  const handleSelectConversation = useCallback(
    async (conv: Conversation) => {
      setLoadingHistory(true);
      setConversationId(conv.id);
      setView('chat');
      const apiMsgs = await chatbotHttpService.getConversationMessages(conv.id);
      setMessages(
        apiMsgs.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          references: m.references,
          status: 'success' as const,
          timestamp: new Date(m.createdAt).getTime(),
        })),
      );
      setLoadingHistory(false);
    },
    [setConversationId, setView, setMessages],
  );

  // ─── Input helpers ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Keyframe for typing dots */}
      <style>{`
        @keyframes uc-chatbot-dot {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; }
          40%            { transform: scale(1);    opacity: 1;    }
        }
      `}</style>

      {/* ── Chat Panel ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Asistente UniConnect"
          className="fixed z-[200] flex flex-col rounded-2xl overflow-hidden"
          style={{
            bottom: '6.1rem',
            right: '1.5rem',
            width: '384px',
            maxHeight: '540px',
            background: '#ffffff',
            border: '1px solid #E9ECEF',
            boxShadow: '0 24px 64px -12px rgba(0,0,0,0.28)',
          }}
        >
          {/* ── Panel header ──────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: '#00284D' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#D4AF37' }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '18px',
                    color: '#00284D',
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  support_agent
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-serif leading-tight">
                  Asistente UniConnect
                </p>
                {conversationId && activeView === 'chat' && (
                  <p
                    className="text-[10px] font-sans leading-tight"
                    style={{ color: 'rgba(255,255,255,0.50)' }}
                  >
                    Conversación activa
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* History / back toggle */}
              <button
                type="button"
                title={
                  activeView === 'chat' ? 'Ver conversaciones anteriores' : 'Volver al chat'
                }
                onClick={() => setView(activeView === 'chat' ? 'conversations' : 'chat')}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                  {activeView === 'chat' ? 'history' : 'arrow_back'}
                </span>
              </button>

              {/* Close */}
              <button
                type="button"
                title="Cerrar asistente"
                onClick={close}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                  close
                </span>
              </button>
            </div>
          </div>

          {/* ── Conversations view ─────────────────────────────────────── */}
          {activeView === 'conversations' && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Toolbar */}
              <div
                className="flex items-center justify-between px-4 py-2 flex-shrink-0"
                style={{ borderBottom: '1px solid #f0eded' }}
              >
                <span
                  className="text-xs font-semibold font-sans uppercase tracking-wide"
                  style={{ color: '#73777f' }}
                >
                  Conversaciones anteriores
                </span>
                <button
                  type="button"
                  onClick={startNewConversation}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors font-sans"
                  style={{ color: '#00284D' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e8f1ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    add
                  </span>
                  Nueva
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 px-6 text-center">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '36px', color: '#c3c6cf' }}
                    >
                      chat_bubble
                    </span>
                    <p className="text-xs font-sans" style={{ color: '#73777f' }}>
                      No hay conversaciones previas
                    </p>
                    <button
                      type="button"
                      onClick={startNewConversation}
                      className="text-xs font-medium font-sans px-4 py-1.5 rounded-xl"
                      style={{ background: '#00284D', color: '#ffffff' }}
                    >
                      Iniciar conversación
                    </button>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isActive = conv.id === conversationId;
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => void handleSelectConversation(conv)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                        style={{
                          background: isActive ? '#e8f1ff' : 'transparent',
                          borderBottom: '1px solid #f0eded',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = '#fbf9f8';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span
                          className="material-symbols-outlined flex-shrink-0 mt-0.5"
                          style={{
                            fontSize: '15px',
                            color: isActive ? '#00284D' : '#73777f',
                          }}
                        >
                          {isActive ? 'chat_bubble' : 'chat_bubble_outline'}
                        </span>
                        <div className="min-w-0">
                          <p
                            className="text-xs font-semibold font-sans truncate"
                            style={{ color: '#1b1c1c' }}
                          >
                            {formatDate(conv.createdAt)}
                          </p>
                          {conv.lastMessage && (
                            <p
                              className="text-xs font-sans truncate mt-0.5"
                              style={{ color: '#73777f' }}
                            >
                              {conv.lastMessage}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── Chat view ──────────────────────────────────────────────── */}
          {activeView === 'chat' && (
            <>
              {/* Messages */}
              <div
                className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3"
                style={{ background: '#fafafa' }}
              >
                {/* Empty state */}
                {messages.length === 0 && !isSending && !loadingHistory && (
                  <div className="flex flex-col items-center justify-center h-full py-8 gap-4 text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: '#e8f1ff' }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '28px',
                          color: '#00284D',
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        support_agent
                      </span>
                    </div>
                    <div className="space-y-1 px-4">
                      <p
                        className="text-sm font-semibold font-serif"
                        style={{ color: '#00132a' }}
                      >
                        ¿En qué puedo ayudarte?
                      </p>
                      <p className="text-xs font-sans" style={{ color: '#73777f' }}>
                        Pregúntame sobre la plataforma, tus grupos, eventos o cualquier duda
                        académica.
                      </p>
                    </div>
                  </div>
                )}

                {/* History loading */}
                {loadingHistory && (
                  <div className="flex items-center justify-center py-10">
                    <span
                      className="material-symbols-outlined animate-spin"
                      style={{ fontSize: '28px', color: '#73777f' }}
                    >
                      sync
                    </span>
                  </div>
                )}

                {/* Message bubbles */}
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {msg.role === 'user' ? (
                      <div
                        className="max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white font-sans"
                        style={{ background: '#00284D' }}
                      >
                        {msg.content}
                      </div>
                    ) : (
                      <div className="max-w-[88%] space-y-1.5">
                        {/* Error / timeout / role_not_supported banner */}
                        {msg.status && msg.status !== 'success' ? (
                          <StatusBanner status={msg.status} message={msg.content} />
                        ) : (
                          <div
                            className="rounded-2xl rounded-tl-sm px-3 py-2.5 font-sans"
                            style={{ background: '#f0f2f5', border: '1px solid #e4e2e1' }}
                          >
                            <MarkdownMessage content={msg.content} />
                          </div>
                        )}

                        {/* References */}
                        {msg.references && msg.references.length > 0 && (
                          <div className="space-y-1 pl-0.5 pt-0.5">
                            <p
                              className="text-[10px] font-semibold uppercase tracking-wide font-sans"
                              style={{ color: '#73777f' }}
                            >
                              Referencias
                            </p>
                            {msg.references.map((ref, ri) => (
                              <a
                                key={ri}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-medium font-sans rounded-lg px-2.5 py-1.5 transition-colors"
                                style={{ background: '#e8f1ff', color: '#00284D' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#d3e3ff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#e8f1ff';
                                }}
                              >
                                <span
                                  className="material-symbols-outlined flex-shrink-0"
                                  style={{ fontSize: '13px' }}
                                >
                                  open_in_new
                                </span>
                                <span className="truncate">{ref.title}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Feedback Buttons */}
                        {msg.status === 'success' && index > 0 && messages[index - 1].role === 'user' && (
                          <FeedbackButtons
                            question={messages[index - 1].content}
                            response={msg.content}
                            references={msg.references}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isSending && (
                  <div className="flex items-start">
                    <TypingDots />
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div
                className="flex-shrink-0 px-3 pt-2 pb-3"
                style={{ background: '#ffffff', borderTop: '1px solid #f0eded' }}
              >
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu pregunta… (Enter para enviar)"
                    rows={1}
                    disabled={isSending}
                    className="flex-1 resize-none rounded-xl px-3 py-2 text-sm font-sans focus:outline-none transition-shadow"
                    style={{
                      background: '#f8f9fa',
                      border: '1.5px solid #e4e2e1',
                      color: '#1b1c1c',
                      minHeight: '36px',
                      maxHeight: '96px',
                      lineHeight: '1.5',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#00284D';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0,40,77,0.10)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e4e2e1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isSending}
                    title="Enviar mensaje"
                    className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-all"
                    style={{
                      background: !input.trim() || isSending ? '#c3c6cf' : '#00284D',
                      color: '#ffffff',
                      cursor: !input.trim() || isSending ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                    >
                      send
                    </span>
                  </button>
                </div>
                <p
                  className="text-[10px] mt-1.5 text-center font-sans"
                  style={{ color: '#c3c6cf' }}
                >
                  Shift + Enter para nueva línea
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── FAB Button ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente UniConnect'}
        aria-expanded={isOpen}
        className="fixed z-[200] flex items-center justify-center rounded-full"
        style={{
          bottom: '2.1rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          background: isOpen ? '#43474e' : '#00284D',
          boxShadow: isOpen
            ? '0 4px 16px rgba(0,0,0,0.22)'
            : '0 8px 28px rgba(0,40,77,0.38)',
          transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.96)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
      >
        <span
          className="material-symbols-outlined text-white"
          style={{
            fontSize: '26px',
            fontVariationSettings: "'FILL' 1",
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          {isOpen ? 'close' : 'support_agent'}
        </span>
      </button>
    </>
  );
}
