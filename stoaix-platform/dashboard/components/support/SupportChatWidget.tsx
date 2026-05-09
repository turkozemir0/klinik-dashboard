'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, X, Trash2, Send, Loader2 } from 'lucide-react'
import { useOrg } from '@/lib/org-context'
import { useLang } from '@/lib/lang-context'
import { useIsDemo } from '@/lib/demo-context'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'stoaix_support_chat'
const MAX_STORED = 50

const labels = {
  tr: {
    title: 'stoaix Destek',
    placeholder: 'Sorunuzu yazın...',
    clearChat: 'Sohbeti temizle',
    close: 'Kapat',
    supportLink: 'Destek talebi oluştur',
    rateLimit: 'Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.',
    errorGeneric: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    greeting: 'Merhaba! stoaix platformu hakkında sorularınızı yanıtlayabilirim. Nasıl yardımcı olabilirim?',
  },
  en: {
    title: 'stoaix Support',
    placeholder: 'Type your question...',
    clearChat: 'Clear chat',
    close: 'Close',
    supportLink: 'Create support ticket',
    rateLimit: 'Too many messages. Please wait and try again.',
    errorGeneric: 'Something went wrong. Please try again.',
    greeting: 'Hello! I can answer your questions about the stoaix platform. How can I help you?',
  },
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function renderMarkdown(text: string): string {
  // Escape HTML first to prevent XSS, then apply markdown formatting
  return escapeHtml(text)
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-slate-200 px-1 rounded text-sm">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-2 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold mt-2 mb-1">$1</h3>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>')
}

function CyclingSubtitle({ lang }: { lang: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after 1s, hide after 4s, repeat every 6s
    const show = setTimeout(() => setVisible(true), 1000)
    const interval = setInterval(() => {
      setVisible(true)
      setTimeout(() => setVisible(false), 3000)
    }, 6000)
    const firstHide = setTimeout(() => setVisible(false), 4000)
    return () => { clearTimeout(show); clearTimeout(firstHide); clearInterval(interval) }
  }, [])

  const text = lang === 'en' ? 'Stoaix AI Assistant 👋' : 'Ben Stoaix AI Asistan 👋'

  return (
    <span
      className={`text-[10px] text-slate-400 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-0.5'
      }`}
    >
      {text}
    </span>
  )
}

export default function SupportChatWidget() {
  const { orgId, isSuperAdmin } = useOrg()
  const { lang } = useLang()
  const isDemo = useIsDemo()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const t = labels[lang] || labels.tr

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[]
        if (Array.isArray(parsed)) setMessages(parsed)
      }
    } catch { /* ignore */ }
  }, [])

  // Save to localStorage on messages change
  useEffect(() => {
    if (messages.length > 0) {
      const toStore = messages.slice(-MAX_STORED)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    }
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Escape key to close
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    setError('')
    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError(t.rateLimit)
        } else {
          setError(data.error || t.errorGeneric)
        }
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setError(t.errorGeneric)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, t])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
    setError('')
  }

  // Hide in demo orgs
  if (isDemo) return null
  // Hide if no org
  if (!orgId) return null
  // TODO: Herkese açmak için bu satırı kaldır
  if (!isSuperAdmin) return null

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[45] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label={t.title}
        >
          <Bot size={26} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[45] flex w-[400px] max-h-[520px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl max-md:w-[calc(100vw-2rem)] max-md:bottom-4 max-md:right-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600">
                <Bot size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-900">{t.title}</h3>
                <CyclingSubtitle lang={lang} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title={t.clearChat}
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title={t.close}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: 'calc(520px - 130px)' }}>
            {/* Greeting if empty */}
            {messages.length === 0 && (
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 max-w-[85%]">
                {t.greeting}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-50 text-slate-800'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div
                      className="support-md leading-relaxed [&_li]:text-sm [&_h3]:text-sm [&_h4]:text-xs"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-slate-50 px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-slate-100 px-3 py-2.5">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-300 focus:ring-1 focus:ring-brand-200"
                style={{ maxHeight: 80 }}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <div className="mt-1.5 text-center">
              <a
                href="/dashboard/settings?tab=support"
                className="text-xs text-slate-400 transition-colors hover:text-brand-500"
              >
                {t.supportLink}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
