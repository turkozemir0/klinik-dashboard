'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Phone, Instagram, Send, RefreshCw } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  id: string
  full_name: string | null
  phone: string | null
  channel_identifiers: Record<string, string> | null
}

interface Lead {
  id: string
  qualification_score: number
  status: string
}

interface LastMessage {
  conversation_id: string
  content: string
  role: string
  created_at: string
}

interface Conversation {
  id: string
  channel: 'whatsapp' | 'instagram' | 'voice' | string
  mode: 'ai' | 'human' | string
  status: string
  started_at: string
  contact: Contact | null
  lead: Lead | null
  last_message: LastMessage | null
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChannelIcon({ channel, size = 14 }: { channel: string; size?: number }) {
  if (channel === 'whatsapp') return <MessageSquare size={size} className="text-emerald-500" />
  if (channel === 'instagram') return <Instagram size={size} className="text-pink-500" />
  if (channel === 'voice') return <Phone size={size} className="text-blue-500" />
  return <MessageSquare size={size} className="text-slate-400" />
}

function ChannelBadge({ channel }: { channel: string }) {
  const styles: Record<string, string> = {
    whatsapp: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    instagram: 'bg-pink-50 text-pink-700 border border-pink-200',
    voice: 'bg-blue-50 text-blue-700 border border-blue-200',
  }
  const labels: Record<string, string> = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    voice: 'Voice',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[channel] ?? 'bg-slate-100 text-slate-600'}`}>
      <ChannelIcon channel={channel} size={10} />
      {labels[channel] ?? channel}
    </span>
  )
}

function ScoreDot({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-red-400' : score >= 40 ? 'bg-amber-400' : 'bg-slate-300'
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={`Score: ${score}`} />
  )
}

function timeAgo(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return lang === 'tr' ? 'şimdi' : 'now'
  if (mins < 60) return lang === 'tr' ? `${mins} dk` : `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return lang === 'tr' ? `${hrs} sa` : `${hrs}h`
  const days = Math.floor(hrs / 24)
  return lang === 'tr' ? `${days} gün` : `${days}d`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  orgId: string
  lang: string
}

const CHANNELS = ['all', 'whatsapp', 'instagram', 'voice']

// Pipeline stages — status value + display label (emoji dahil)
const PIPELINE_STAGES: { value: string; label: Record<string, string> }[] = [
  { value: 'all',         label: { tr: 'Tümü',        en: 'All' } },
  { value: 'new',         label: { tr: '🆕 Yeni',     en: '🆕 New' } },
  { value: 'in_progress', label: { tr: '🤖 Qualifying', en: '🤖 Qualifying' } },
  { value: 'handed_off',  label: { tr: '🔥 Hot Lead',  en: '🔥 Hot Lead' } },
  { value: 'nurturing',   label: { tr: '⏳ Takipte',   en: '⏳ Nurturing' } },
  { value: 'qualified',   label: { tr: '📅 Randevu',   en: '📅 Appt.' } },
  { value: 'converted',   label: { tr: '✅ Kazanıldı', en: '✅ Won' } },
  { value: 'lost',        label: { tr: '❌ Kayıp',     en: '❌ Lost' } },
]

// For display in conversation list items
const LEAD_STATUS_LABELS: Record<string, Record<string, string>> = {
  tr: { all: 'Tümü', new: 'Yeni', in_progress: 'Qualifying', qualified: 'Randevu', handed_off: 'Hot Lead', nurturing: 'Takipte', converted: 'Kazanıldı', lost: 'Kayıp' },
  en: { all: 'All', new: 'New', in_progress: 'Qualifying', qualified: 'Appt.', handed_off: 'Hot Lead', nurturing: 'Nurturing', converted: 'Won', lost: 'Lost' },
}

export default function InboxClient({ orgId, lang }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const sl = LEAD_STATUS_LABELS[lang] ?? LEAD_STATUS_LABELS.tr

  // ─── Fetch conversation list ─────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true)
    try {
      const params = new URLSearchParams()
      if (channelFilter !== 'all') params.set('channel', channelFilter)
      if (statusFilter !== 'all') params.set('leadStatus', statusFilter)
      const res = await fetch(`/api/inbox?${params}`)
      const json = await res.json()
      if (json.conversations) setConversations(json.conversations)
    } finally {
      setLoadingConvs(false)
    }
  }, [channelFilter, statusFilter])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // ─── Fetch messages for selected conversation ────────────────────────────
  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    setMessages([])
    try {
      const res = await fetch(`/api/inbox/${convId}/messages`)
      const json = await res.json()
      if (json.messages) setMessages(json.messages)
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchMessages(selectedId)
  }, [selectedId, fetchMessages])

  // ─── Auto-scroll to bottom ───────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Fallback: poll messages every 15s (silent, no loading spinner) ─────────
  useEffect(() => {
    if (!selectedId) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/inbox/${selectedId}/messages`)
      const json = await res.json()
      if (!json.messages) return
      setMessages(prev => {
        const prevIds = new Set(prev.map(m => m.id))
        const newMsgs = (json.messages as Message[]).filter(m => !prevIds.has(m.id) && !m.id.startsWith('sent-'))
        if (!newMsgs.length) return prev
        return [...prev, ...newMsgs]
      })
    }, 15_000)
    return () => clearInterval(interval)
  }, [selectedId])

  // ─── Realtime: new message in selected conversation ──────────────────────
  useEffect(() => {
    if (!selectedId) return

    const channel = supabase
      .channel(`inbox-messages-${selectedId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          const msg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            // Remove optimistic placeholder for assistant messages when real one arrives
            const withoutOptimistic = msg.role === 'assistant'
              ? prev.filter(m => !m.id.startsWith('sent-'))
              : prev
            return [...withoutOptimistic, msg]
          })
          // Also update the conversation's last_message preview in the list
          setConversations(prev => prev.map(c =>
            c.id === selectedId
              ? { ...c, last_message: { conversation_id: selectedId, content: msg.content, role: msg.role, created_at: msg.created_at } }
              : c
          ))
        }
      )
      .subscribe((status) => {
        console.log(`[inbox-realtime] messages channel status: ${status}`)
      })

    return () => { supabase.removeChannel(channel) }
  }, [selectedId, supabase])

  // ─── Realtime: conversation list updates (INSERT + UPDATE) ─────────────
  useEffect(() => {
    const channel = supabase
      .channel(`inbox-convs-${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations', filter: `organization_id=eq.${orgId}` },
        () => { void fetchConversations() }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `organization_id=eq.${orgId}` },
        () => { void fetchConversations() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, supabase, fetchConversations])

  // ─── Fallback: poll conversation list every 30s (silent) ─────────────────
  useEffect(() => {
    const interval = setInterval(() => void fetchConversations(), 30_000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  // ─── Send reply ──────────────────────────────────────────────────────────
  async function handleSend() {
    if (!replyText.trim() || !selectedId || sending) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedId, content: replyText.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setSendError(json.error ?? 'Gönderilemedi'); return }
      const sentContent = replyText.trim()
      setReplyText('')
      // Add sent message immediately (realtime may have latency)
      const sentAt = new Date().toISOString()
      setMessages(prev => [...prev, { id: `sent-${Date.now()}`, role: 'assistant', content: sentContent, created_at: sentAt }])
      setConversations(prev => prev.map(c =>
        c.id === selectedId
          ? { ...c, last_message: { conversation_id: selectedId, content: sentContent, role: 'assistant', created_at: sentAt } }
          : c
      ))
      void fetchConversations()
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() }
  }

  const selected = conversations.find(c => c.id === selectedId)
  const isVoice = selected?.channel === 'voice'

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-slate-50">

      {/* ── Left: Conversation List ─────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">

        {/* Header + filters */}
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">
              {lang === 'tr' ? 'Gelen Kutusu' : 'Inbox'}
            </h2>
            <button
              onClick={fetchConversations}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={lang === 'tr' ? 'Yenile' : 'Refresh'}
            >
              <RefreshCw size={14} className={loadingConvs ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Channel filter */}
          <div className="flex gap-1 flex-wrap mb-2">
            {CHANNELS.map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  channelFilter === ch
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {ch === 'all' ? (lang === 'tr' ? 'Tümü' : 'All') : ch.charAt(0).toUpperCase() + ch.slice(1)}
              </button>
            ))}
          </div>

          {/* Pipeline stage filter — yatay scroll */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1">
            {PIPELINE_STAGES.map(stage => (
              <button
                key={stage.value}
                onClick={() => setStatusFilter(stage.value)}
                className={`shrink-0 px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  statusFilter === stage.value
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {stage.label[lang] ?? stage.label.tr}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs && !conversations.length ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              {lang === 'tr' ? 'Yükleniyor…' : 'Loading…'}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              {lang === 'tr' ? 'Konuşma yok' : 'No conversations'}
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                  selectedId === conv.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <p className="text-sm font-medium text-slate-800 truncate flex-1">
                    {conv.contact?.full_name ?? conv.contact?.phone ?? '—'}
                  </p>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {timeAgo(conv.started_at, lang)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <ChannelBadge channel={conv.channel} />
                  {conv.lead && <ScoreDot score={conv.lead.qualification_score} />}
                  {conv.mode === 'human' && (
                    <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
                      Human
                    </span>
                  )}
                </div>
                {conv.last_message && (
                  <p className="text-xs text-slate-400 truncate">
                    {conv.last_message.role === 'assistant' ? '↑ ' : ''}
                    {conv.last_message.content}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Thread + Reply ───────────────────────────────────────── */}
      {selectedId && selected ? (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Thread header */}
          <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {selected.contact?.full_name ?? selected.contact?.phone ?? '—'}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <ChannelBadge channel={selected.channel} />
                {selected.lead && (
                  <span className="text-[11px] text-slate-500">
                    Score: <strong>{selected.lead.qualification_score}</strong>
                  </span>
                )}
                {selected.lead && (
                  <span className="text-[11px] text-slate-400">
                    {sl[selected.lead.status] ?? selected.lead.status}
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                  selected.mode === 'human'
                    ? 'bg-purple-50 text-purple-600 border-purple-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {selected.mode === 'human' ? 'İnsan Modu' : 'AI Modu'}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {loadingMsgs ? (
              <div className="text-center text-slate-400 text-sm pt-10">
                {lang === 'tr' ? 'Yükleniyor…' : 'Loading…'}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-slate-400 text-sm pt-10">
                {lang === 'tr' ? 'Henüz mesaj yok' : 'No messages yet'}
              </div>
            ) : (
              messages.map(msg => {
                if (msg.role === 'system') {
                  return (
                    <div key={msg.id} className="text-center">
                      <span className="text-[11px] italic text-slate-400">{msg.content}</span>
                    </div>
                  )
                }
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                        : 'bg-brand-500 text-white rounded-tr-sm shadow-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isUser ? 'text-slate-400' : 'text-brand-100'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          <div className="border-t border-slate-200 bg-white px-4 py-3">
            {isVoice ? (
              <p className="text-sm text-slate-400 text-center py-2">
                {lang === 'tr' ? 'Ses konuşmalarına yazılı yanıt gönderilemez.' : 'Text replies are not available for voice calls.'}
              </p>
            ) : (
              <div className="flex gap-2 items-end">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={lang === 'tr' ? 'Yanıt yaz… (Enter = gönder, Shift+Enter = satır)' : 'Reply… (Enter = send, Shift+Enter = newline)'}
                  rows={2}
                  className="flex-1 resize-none text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-400 placeholder:text-slate-400"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!replyText.trim() || sending}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors shrink-0"
                >
                  <Send size={14} />
                  {lang === 'tr' ? 'Gönder' : 'Send'}
                </button>
              </div>
            )}
            {sendError && (
              <p className="text-xs text-red-500 mt-1.5">{sendError}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{lang === 'tr' ? 'Bir konuşma seç' : 'Select a conversation'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
