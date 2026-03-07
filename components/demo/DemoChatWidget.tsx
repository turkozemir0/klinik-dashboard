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
    typing: 'AI yazıyor...',
    welcome: 'Merhaba! Size nasıl yardımcı olabilirim?',
  },
  en: {
    placeholder: 'Type your message...',
    send: 'Send',
    typing: 'AI is typing...',
    welcome: 'Hello! How can I help you today?',
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shadow">
          AI
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">stoaix Asistan</p>
          <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            {lang === 'tr' ? 'Çevrimiçi' : 'Online'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[78%] bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
              <p className="text-sm text-slate-700 leading-relaxed">{t.welcome}</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]"></span>
                <span className="ml-2 text-xs text-slate-400">{t.typing}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-100">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white px-4 py-2.5 text-sm font-medium transition shrink-0"
          >
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
}
