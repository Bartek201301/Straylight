'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { usePathname } from 'next/navigation';
import { useUserProfile } from '@/contexts/AuthContext';
import Lottie from 'lottie-react';
import chatbotAnimation from '@/data/chatbot.json';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const GUEST_SUGGESTIONS: { label: string; answer: string }[] = [
  {
    label: 'O czym jest projekt?',
    answer:
      'StrayLight to platforma wspierająca rozwój kariery z pomocą AI. Łączymy treści, narzędzia i społeczność, aby pomagać w świadomym rozwoju zawodowym.',
  },
  {
    label: 'Kim jesteście?',
    answer:
      'Jesteśmy zespołem pasjonatów technologii, produktu i edukacji. Budujemy narzędzia oparte o AI, które realnie pomagają w karierze.',
  },
  {
    label: 'Jak mogę dołączyć?',
    answer:
      'Załóż konto, dołącz do newslettera i śledź nasze artykuły. Planujemy też program społeczności i możliwości współpracy – stay tuned!',
  },
];

async function sendMessageToAIPlaceholder(prompt: string): Promise<string> {
  // TODO: Zamień na realne wywołanie API (OpenAI/Supabase Function itp.)
  await new Promise((r) => setTimeout(r, 1200));
  return `Odpowiedź AI na: "${prompt}"`;
}

export default function FloatingChat() {
  const { isAuthenticated } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [availableSuggestions, setAvailableSuggestions] =
    useState(GUEST_SUGGESTIONS);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  // Simple toggle with exit animation handling
  const [isClosing, setIsClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleOpen = useCallback(() => {
    setHasGreeted(false);
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
        setIsExpanded(false);
      }, 300);
    } else {
      setIsOpen(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length]);

  const handleGuestSuggestion = useCallback(
    async (label: string, answer: string) => {
      // Remove clicked suggestion immediately
      setAvailableSuggestions((prev) => prev.filter((s) => s.label !== label));
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content: label },
      ]);
      setIsThinking(true);
      await new Promise((r) => setTimeout(r, 3000));
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: answer },
      ]);
    },
    []
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: trimmed },
    ]);
    setInput('');
    setIsThinking(true);
    try {
      let reply: string;
      if (isAuthenticated) {
        // Gather page context (client-side)
        const getPageText = (): string | undefined => {
          try {
            const candidates = [
              document.querySelector('article'),
              document.querySelector('.article-content'),
              document.querySelector('main'),
            ].filter(Boolean) as HTMLElement[];
            const joined = candidates
              .map((el) => el.innerText)
              .join('\n')
              .replace(/\s+/g, ' ')
              .trim();
            if (!joined) return undefined;
            // limit to ~12k chars
            return joined.slice(0, 12000);
          } catch {
            return undefined;
          }
        };
        const pageCtx = {
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          title: typeof document !== 'undefined' ? document.title : undefined,
          pathname: pathname,
          content: getPageText(),
        };

        const r = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            page: pageCtx,
            history: messages.slice(-6),
          }),
        });
        if (!r.ok) {
          throw new Error('AI API error');
        }
        const data = await r.json();
        reply = data.reply || 'Brak odpowiedzi.';
      } else {
        // Guests fallback (should not hit when input is disabled)
        reply = await sendMessageToAIPlaceholder(trimmed);
      }
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: reply },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Wystąpił błąd po stronie AI. Spróbuj ponownie.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isThinking]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isAuthenticated) {
          handleSend();
        }
      }
    },
    [handleSend, isAuthenticated]
  );

  // Initial typing animation then greeting on first open
  useEffect(() => {
    if (!isOpen) {
      // Reset suggestions on full page refresh only; close/open should preserve
      // No action needed here
      return;
    }
    if (messages.length > 0) return;
    setIsThinking(true);
    const timer = setTimeout(() => {
      setIsThinking(false);
      const greeting = !isAuthenticated
        ? 'Cześć! Jestem StrayLight Assistant. Aby prowadzić rozmowę, zaloguj się. Jeśli wolisz, skorzystaj z gotowych pytań poniżej.'
        : 'Cześć! Jestem StrayLight Assistant. Pisz śmiało – odpowiem na Twoje pytania.';
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: greeting },
      ]);
      setHasGreeted(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isOpen, isAuthenticated, messages.length]);

  // When opening again, ensure greeting-gate if messages exist (do not reset suggestions)
  useEffect(() => {
    if (!isOpen) return;
    if (!isAuthenticated && messages.length > 0) {
      setHasGreeted(true);
    }
  }, [isOpen, isAuthenticated, messages.length]);

  // Logo icon (w przycisku czatu)
  const LogoIcon = useMemo(
    () => (
      <div className="w-11 h-11">
        <Lottie
          animationData={chatbotAnimation as unknown as object}
          loop
          autoplay
        />
      </div>
    ),
    []
  );

  const _ChevronIcon = useMemo(
    () => (
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M6.5 9l5.5 6 5.5-6"
          stroke="currentColor"
          strokeWidth="2.25"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    []
  );

  const ExpandIcon = useMemo(
    () => (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M8 4H4v4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 20h4v-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16v4h4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 8V4h-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    []
  );

  const RestoreIcon = useMemo(
    () => (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="7" y="7" width="10" height="10" rx="2" ry="2" />
      </svg>
    ),
    []
  );

  const CloseIcon = useMemo(
    () => (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6.225 4.811a1 1 0 011.414 0L12 9.172l4.361-4.361a1 1 0 111.414 1.414L13.414 10.586l4.361 4.361a1 1 0 01-1.414 1.414L12 12l-4.361 4.361a1 1 0 01-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 010-1.414z" />
      </svg>
    ),
    []
  );

  const LockIcon = useMemo(
    () => (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z" />
      </svg>
    ),
    []
  );

  return (
    <div className="fixed z-50 bottom-5 right-5">
      {/* Toggle button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          'chat-button-glow micro-interaction flex items-center justify-center rounded-full shadow-lg shadow-black/50',
          'bg-black text-white',
          'w-14 h-14 border border-white/10 ring-1 ring-white/20',
          'transition-transform duration-300 ease-smooth hover:scale-110 active:scale-95'
        )}
        aria-label={isOpen ? 'Zamknij czat' : 'Otwórz czat'}
      >
        {LogoIcon}
      </button>

      {/* Panel chat */}
      {isOpen && (
        <div
          className={cn(
            'absolute bottom-20 right-0 max-w-[92vw] max-h-[90vh] flex flex-col',
            isExpanded ? 'w-[36rem] h-[78vh]' : 'w-[30rem] h-[70vh]',
            'rounded-2xl border border-white/10 shadow-2xl shadow-black/60',
            'bg-black/80 backdrop-blur-md text-white transition-all duration-300 ease-smooth',
            isClosing ? 'animate-chat-panel-out' : 'animate-chat-panel-in'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-sm">
              <OptimizedImage
                src="/avatar-chatbota.png"
                alt="SL Asystent"
                width={20}
                height={20}
                className="w-5 h-5 rounded-sm"
                priority={false}
              />
              <span>SL Asystent</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="p-1 rounded hover:bg-white/10"
                aria-label={isExpanded ? 'Przywróć rozmiar' : 'Powiększ okno'}
                aria-pressed={isExpanded}
              >
                {isExpanded ? RestoreIcon : ExpandIcon}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/10"
                aria-label="Zamknij"
              >
                {CloseIcon}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'text-sm leading-relaxed animate-chat-message-in flex',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] px-3 py-2 rounded-2xl border',
                    m.role === 'user'
                      ? 'bg-white text-black border-white/10'
                      : 'bg-white/5 text-white/90 border-white/10'
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="max-w-[70%] px-3 py-2 rounded-2xl border border-white/10 bg-white/5">
                  <div className="typing-dots" aria-label="Pisze...">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Suggestions for guests - show only after greeting */}
            {!isAuthenticated &&
              hasGreeted &&
              !isThinking &&
              availableSuggestions.length > 0 && (
                <div className="pt-1">
                  <div className="text-[11px] uppercase tracking-wider text-white/50 mb-2">
                    Proponowane pytania
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSuggestions.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => handleGuestSuggestion(s.label, s.answer)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-full border border-white/15',
                          'bg-white/5 hover:bg-white/10 text-white transition-colors'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={!isAuthenticated}
                placeholder={
                  isAuthenticated
                    ? 'Napisz wiadomość...'
                    : 'Zaloguj się aby skorzystać'
                }
                className={cn(
                  'flex-1 bg-transparent text-sm outline-none',
                  'px-3 py-2 rounded-lg border border-white/15',
                  'placeholder-white/40',
                  !isAuthenticated
                    ? 'opacity-70 cursor-not-allowed'
                    : 'focus:border-white/30'
                )}
                aria-label={
                  isAuthenticated
                    ? 'Pole wiadomości'
                    : 'Zaloguj się aby skorzystać'
                }
              />
              {!isAuthenticated ? (
                <div className="flex items-center gap-1 text-white/70 text-xs pr-1 select-none">
                  {LockIcon}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isThinking || !input.trim()}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg border border-white/15 micro-interaction',
                    'bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  Wyślij
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
