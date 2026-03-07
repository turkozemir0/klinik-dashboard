'use client';

import { useRef, useEffect } from 'react';
import type { Lang } from '@/lib/i18n/messages';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DemoChatWidgetProps {
  messages: Message[];
  input: string;
  loading: boolean;
  lang: Lang;
  onInputChange: (v: string) => void;
  onSend: () => void;
}

const UI = {
  tr: {
    placeholder: 'Mesajınızı yazın...',
    send: 'Gönder',
    typing: 'AI analiz ediyor...',
    welcome: 'Merhaba! Size nasıl yardımcı olabilirim?',
    online: 'Çevrimiçi',
    assistant: 'stoaix AI Asistan',
  },
  en: {
    placeholder: 'Type your message...',
    send: 'Send',
    typing: 'AI is analysing...',
    welcome: 'Hello! How can I help you today?',
    online: 'Online',
    assistant: 'stoaix AI Assistant',
  },
};

export default function DemoChatWidget({
  messages,
  input,
  loading,
  lang,
  onInputChange,
  onSend,
}: DemoChatWidgetProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const t = UI[lang];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) onSend();
    }
  }

  return (
    <div className="flex flex-col h-full bg-demo-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-demo-border">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-demo-blue flex items-center justify-center shadow-[0_0_16px_rgba(35,61,255,0.5)]">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-demo-cyan border-2 border-demo-bg animate-pulse_dot" />
        </div>
        <div>
          <p className="text-sm font-semibold text-demo-text">{t.assistant}</p>
          <p className="text-xs text-demo-cyan font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan inline-block animate-pulse_dot" />
            {t.online}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-demo-card border border-demo-border rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-pulse_dot" />
          <span className="text-[10px] text-demo-muted uppercase tracking-widest font-medium">LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[78%] bg-demo-card border border-demo-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <p className="text-sm text-demo-text leading-relaxed">{t.welcome}</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-demo-blue text-white rounded-tr-sm shadow-[0_0_12px_rgba(35,61,255,0.3)]'
                  : 'bg-demo-card border border-demo-border text-demo-text rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-demo-card border border-demo-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-bounce [animation-delay:300ms]" />
                <span className="ml-2 text-xs text-demo-muted">{t.typing}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-3 border-t border-demo-border">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-demo-border bg-demo-card px-3.5 py-2.5 text-sm text-demo-text placeholder-demo-muted focus:outline-none focus:border-demo-cyan focus:ring-1 focus:ring-demo-cyan transition disabled:opacity-50 max-h-28 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-demo-blue hover:opacity-90 disabled:opacity-30 text-white px-4 py-2.5 text-sm font-semibold transition shrink-0 shadow-[0_0_12px_rgba(35,61,255,0.4)]"
          >
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
}
