'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Phone, Instagram, Send, RefreshCw, Bot, User, Search, Loader2, Sparkles, CalendarPlus, X, Plus } from 'lucide-react'
import { useIsDemo } from '@/lib/demo-context'
import Avatar from '@/components/Avatar'
import ChannelBadge from '@/components/ChannelBadge'

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
  collected_data?: Record<string, any> | null
  source_channel?: string | null
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
  content_type?: string
  media_url?: string
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChannelOverlay({ channel }: { channel: string }) {
  const cfg: Record<string, { icon: typeof MessageSquare; color: string }> = {
    whatsapp: { icon: MessageSquare, color: 'text-emerald-600 bg-emerald-100' },
    instagram: { icon: Instagram, color: 'text-pink-600 bg-pink-100' },
    voice: { icon: Phone, color: 'text-violet-600 bg-violet-100' },
    reactivation: { icon: RefreshCw, color: 'text-orange-600 bg-orange-100' },
  }
  const c = cfg[channel] ?? { icon: MessageSquare, color: 'text-slate-500 bg-slate-100' }
  const Icon = c.icon
  return (
    <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ${c.color}`}>
      <Icon size={8} />
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-red-500 text-white' : score >= 40 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{score}</span>
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
  currentUserId: string
  userRole: string | null
}

const CHANNELS = ['all', 'whatsapp', 'instagram', 'voice', 'reactivation']

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

const PAGE_SIZE = 20

export default function InboxClient({ orgId, lang, currentUserId, userRole }: Props) {
  const isDemo = useIsDemo()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [handoffLoading, setHandoffLoading] = useState(false)

  // Appointment modal state
  const [showApptModal, setShowApptModal] = useState(false)
  const [apptSaving, setApptSaving] = useState(false)
  const [apptError, setApptError] = useState('')
  const [apptForm, setApptForm] = useState({ title: '', date: '', startTime: '10:00', endTime: '11:00', notes: '' })

  // Pagination + Search state
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const sl = LEAD_STATUS_LABELS[lang] ?? LEAD_STATUS_LABELS.tr

  // ─── Search debounce ─────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value.trim())
    }, 400)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [])

  // ─── Fetch conversation list ─────────────────────────────────────────────
  const fetchConversations = useCallback(async (append = false, cursorOverride?: string | null) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoadingConvs(true)
    }
    try {
      const params = new URLSearchParams()
      if (channelFilter !== 'all') params.set('channel', channelFilter)
      if (statusFilter !== 'all') params.set('leadStatus', statusFilter)
      if (searchQuery && searchQuery.length >= 2) params.set('search', searchQuery)
      params.set('limit', String(PAGE_SIZE))

      const useCursor = append ? (cursorOverride ?? nextCursor) : null
      if (useCursor) params.set('cursor', useCursor)

      const res = await fetch(`/api/inbox?${params}`)
      if (!res.ok) { console.error(`[inbox] conversations fetch ${res.status}`); return }
      const json = await res.json()

      if (append) {
        setConversations(prev => [...prev, ...(json.conversations ?? [])])
      } else {
        setConversations(json.conversations ?? [])
      }
      setHasMore(json.hasMore ?? false)
      setNextCursor(json.nextCursor ?? null)
    } catch (err) {
      console.error('[inbox] conversations fetch error:', err)
    } finally {
      setLoadingConvs(false)
      setLoadingMore(false)
    }
  }, [channelFilter, statusFilter, searchQuery, nextCursor])

  // Reset + fetch when filters or search change
  useEffect(() => {
    setConversations([])
    setNextCursor(null)
    setHasMore(false)
    fetchConversations(false, null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelFilter, statusFilter, searchQuery])

  // ─── Load more handler ────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return
    fetchConversations(true)
  }, [hasMore, loadingMore, fetchConversations])

  // ─── Fetch messages for selected conversation ────────────────────────────
  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    setMessages([])
    try {
      const res = await fetch(`/api/inbox/${convId}/messages`)
      if (!res.ok) { console.error(`[inbox] messages fetch ${res.status}`); return }
      const json = await res.json()
      if (json.messages) setMessages(json.messages)
    } catch (err) {
      console.error('[inbox] messages fetch error:', err)
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
      try {
        const res = await fetch(`/api/inbox/${selectedId}/messages`)
        if (!res.ok) return
        const json = await res.json()
        if (!json.messages) return
        setMessages(prev => {
          const prevIds = new Set(prev.map(m => m.id))
          const newMsgs = (json.messages as Message[]).filter(m => !prevIds.has(m.id) && !m.id.startsWith('sent-'))
          if (!newMsgs.length) return prev
          return [...prev, ...newMsgs]
        })
      } catch { /* silent poll failure */ }
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
            const withoutOptimistic = msg.role === 'assistant'
              ? prev.filter(m => !m.id.startsWith('sent-'))
              : prev
            return [...withoutOptimistic, msg]
          })
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
        () => { void fetchConversations(false, null) }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `organization_id=eq.${orgId}` },
        () => { void fetchConversations(false, null) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, supabase, fetchConversations])

  // ─── Fallback: poll conversation list every 30s (silent) ─────────────────
  useEffect(() => {
    const interval = setInterval(() => void fetchConversations(false, null), 30_000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  // ─── Handoff: takeover / release ─────────────────────────────────────────
  const canTakeover = ['admin', 'yönetici', 'satisci'].includes(userRole ?? '')

  async function handleTakeover() {
    if (!selectedId || handoffLoading) return
    setHandoffLoading(true)
    try {
      const res = await fetch(`/api/conversations/${selectedId}/takeover`, { method: 'POST' })
      if (res.ok) {
        setConversations(prev => prev.map(c =>
          c.id === selectedId ? { ...c, mode: 'human' } : c
        ))
      }
    } catch { /* ignore */ }
    setHandoffLoading(false)
  }

  async function handleRelease() {
    if (!selectedId || handoffLoading) return
    setHandoffLoading(true)
    try {
      const res = await fetch(`/api/conversations/${selectedId}/release`, { method: 'POST' })
      if (res.ok) {
        setConversations(prev => prev.map(c =>
          c.id === selectedId ? { ...c, mode: 'ai' } : c
        ))
      }
    } catch { /* ignore */ }
    setHandoffLoading(false)
  }

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
      let json: any
      try { json = await res.json() } catch { json = {} }
      if (!res.ok) { setSendError(json.error ?? 'Gönderilemedi'); return }
      const sentContent = replyText.trim()
      setReplyText('')
      const sentAt = new Date().toISOString()
      setMessages(prev => [...prev, { id: `sent-${Date.now()}`, role: 'assistant', content: sentContent, created_at: sentAt }])
      setConversations(prev => prev.map(c =>
        c.id === selectedId
          ? { ...c, last_message: { conversation_id: selectedId, content: sentContent, role: 'assistant', created_at: sentAt } }
          : c
      ))
      void fetchConversations(false, null)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() }
  }

  const selected = conversations.find(c => c.id === selectedId)
  const isVoice = selected?.channel === 'voice'
  const isReactivation = selected?.channel === 'reactivation'

  // ─── Create appointment from inbox ──────────────────────────────────────
  const openApptModal = useCallback(() => {
    const contactName = selected?.contact?.full_name || ''
    setApptForm({
      title: contactName ? `${contactName} ${lang === 'tr' ? 'Randevusu' : 'Appointment'}` : '',
      date: new Date().toISOString().slice(0, 10),
      startTime: '10:00',
      endTime: '11:00',
      notes: '',
    })
    setApptError('')
    setShowApptModal(true)
  }, [selected, lang])

  const createInboxAppointment = useCallback(async () => {
    if (!apptForm.date || !apptForm.startTime) {
      setApptError(lang === 'tr' ? 'Tarih ve başlangıç saati zorunlu' : 'Date and start time required')
      return
    }
    setApptSaving(true)
    setApptError('')
    try {
      const scheduledAt = new Date(`${apptForm.date}T${apptForm.startTime}:00`).toISOString()
      const endAt = new Date(`${apptForm.date}T${apptForm.endTime}:00`)
      const startAt = new Date(`${apptForm.date}T${apptForm.startTime}:00`)
      const durationMinutes = Math.max(15, Math.round((endAt.getTime() - startAt.getTime()) / 60000))

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_at: scheduledAt,
          duration_minutes: durationMinutes,
          contact_id: selected?.contact?.id ?? null,
          lead_id: selected?.lead?.id ?? null,
          conversation_id: selected?.id ?? null,
          title: apptForm.title || null,
          notes: apptForm.notes || null,
          appointment_type: 'consultation',
          source: 'platform',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      setShowApptModal(false)
    } catch (err: any) {
      setApptError(err.message || 'Error')
    } finally {
      setApptSaving(false)
    }
  }, [apptForm, selected, lang])

  // ─── Qualification fields for lead detail panel ─────────────────────────
  const DETAIL_FIELDS = ['interest', 'budget', 'timeline', 'source', 'city', 'age', 'full_name', 'phone', 'email']
  const leadDetails = selected?.lead?.collected_data
    ? Object.entries(selected.lead.collected_data).filter(([k, v]) => v && DETAIL_FIELDS.includes(k))
    : []

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-slate-50">

      {/* ── Panel 1: Thread List (320px) ──────────────────────────────── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">

        {/* Header + filters */}
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">
              {lang === 'tr' ? 'Gelen Kutusu' : 'Inbox'}
            </h2>
            <button
              onClick={() => fetchConversations(false, null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={lang === 'tr' ? 'Yenile' : 'Refresh'}
            >
              <RefreshCw size={14} className={loadingConvs ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search input */}
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder={lang === 'tr' ? 'İsim veya numara ara...' : 'Search name or phone...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 placeholder:text-slate-400"
            />
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
              {searchQuery
                ? (lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found')
                : (lang === 'tr' ? 'Konuşma yok' : 'No conversations')}
            </div>
          ) : (
            <>
              {conversations.map(conv => {
                const name = conv.contact?.full_name ?? conv.contact?.phone ?? '—'
                const isActive = selectedId === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      isActive ? 'bg-white border-l-2 border-l-brand-500 shadow-sm' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <Avatar name={name} size={36} />
                        <ChannelOverlay channel={conv.channel} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {timeAgo(conv.started_at, lang)}
                          </span>
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-slate-400 truncate mb-1">
                            {conv.last_message.role === 'assistant' ? '↑ ' : ''}
                            {conv.last_message.content}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5">
                          {conv.lead && <ScoreBadge score={conv.lead.qualification_score} />}
                          {conv.lead && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {sl[conv.lead.status] ?? conv.lead.status}
                            </span>
                          )}
                          {conv.mode === 'human' && (
                            <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
                              Human
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}

              {/* Load More button */}
              {hasMore && (
                <div className="p-3 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 rounded-lg transition-colors"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        {lang === 'tr' ? 'Yükleniyor…' : 'Loading…'}
                      </>
                    ) : (
                      lang === 'tr' ? 'Daha Fazla Göster' : 'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Panel 2: Conversation (flex-1) ────────────────────────────── */}
      {selectedId && selected ? (
        <>
          <div className="flex-1 flex flex-col min-w-0">

            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {selected.contact?.full_name ?? selected.contact?.phone ?? '—'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <ChannelBadge channel={selected.channel} size="sm" />
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
              {/* Handoff / Release button */}
              {canTakeover && !isVoice && (
                selected.mode === 'ai' ? (
                  <button
                    onClick={handleTakeover}
                    disabled={handoffLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                  >
                    <User size={12} />
                    {handoffLoading ? '...' : (lang === 'tr' ? 'Devral' : 'Take Over')}
                  </button>
                ) : (
                  <button
                    onClick={handleRelease}
                    disabled={handoffLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                  >
                    <Bot size={12} />
                    {handoffLoading ? '...' : (lang === 'tr' ? "AI'a Bırak" : 'Release to AI')}
                  </button>
                )
              )}
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
                    const hasImage = msg.content_type === 'image' && msg.media_url
                    return (
                      <div key={msg.id} className="text-center space-y-1">
                        {hasImage && (
                          <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                            <img
                              src={msg.media_url}
                              alt="Gönderilen görsel"
                              className="max-w-[200px] max-h-[200px] rounded-lg border border-slate-200 object-cover hover:opacity-90 transition-opacity"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </a>
                        )}
                        <span className="text-[11px] italic text-slate-400 block">{msg.content}</span>
                      </div>
                    )
                  }
                  const isUser = msg.role === 'user'
                  const hasImage = msg.content_type === 'image' && msg.media_url
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                          : 'bg-gradient-to-r from-brand-500 to-sky-400 text-white rounded-tr-sm shadow-sm'
                      }`}>
                        {!isUser && (
                          <div className="flex items-center gap-1 mb-1 opacity-80">
                            <Sparkles size={10} />
                            <span className="text-[10px] font-medium">stoaix · AI</span>
                          </div>
                        )}
                        {hasImage && (
                          <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                            <img
                              src={msg.media_url}
                              alt="Gönderilen görsel"
                              className="max-w-full max-h-[240px] rounded-lg object-cover hover:opacity-90 transition-opacity"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </a>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isUser ? 'text-slate-400' : 'text-white/60'}`}>
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
            {!isDemo && (
            <div className="border-t border-slate-200 bg-white px-4 py-3">
              {isVoice || isReactivation ? (
                <p className="text-sm text-slate-400 text-center py-2">
                  {isReactivation
                    ? (lang === 'tr' ? 'Reactivation mesajları otomatik gönderilir, yanıt yazılamaz.' : 'Reactivation messages are sent automatically.')
                    : (lang === 'tr' ? 'Ses konuşmalarına yazılı yanıt gönderilemez.' : 'Text replies are not available for voice calls.')}
                </p>
              ) : (
                <div className="flex gap-2 items-end bg-slate-50 rounded-2xl px-3 py-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang === 'tr' ? 'Yanıt yaz… (Enter = gönder)' : 'Reply… (Enter = send)'}
                    rows={2}
                    className="flex-1 resize-none text-sm bg-transparent px-1 py-1.5 focus:outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!replyText.trim() || sending}
                    className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-brand-500 to-sky-400 hover:from-brand-600 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
              {sendError && (
                <p className="text-xs text-red-500 mt-1.5">{sendError}</p>
              )}
            </div>
            )}
          </div>

          {/* ── Panel 3: Lead Details (288px, hidden <lg) ────────────── */}
          <div className="hidden lg:flex w-72 flex-shrink-0 flex-col border-l border-slate-200 bg-white overflow-y-auto">
            <div className="p-5 border-b border-slate-100">
              <div className="flex flex-col items-center text-center">
                <Avatar name={selected.contact?.full_name || selected.contact?.phone || '?'} size={56} />
                <p className="text-sm font-semibold text-slate-800 mt-3">
                  {selected.contact?.full_name || lang === 'tr' ? 'İsimsiz' : 'Unknown'}
                </p>
                {selected.contact?.phone && (
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{selected.contact.phone}</p>
                )}
                {selected.lead && (
                  <div className="mt-2">
                    <ScoreBadge score={selected.lead.qualification_score} />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={openApptModal}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-500 to-sky-400 hover:from-brand-600 hover:to-sky-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
                  <CalendarPlus size={13} />
                  {lang === 'tr' ? 'Randevu' : 'Book Slot'}
                </button>
              </div>
            </div>

            {/* Qualification fields */}
            {leadDetails.length > 0 && (
              <div className="p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {lang === 'tr' ? 'Toplanan Bilgiler' : 'Collected Data'}
                </h3>
                <div className="space-y-2.5">
                  {leadDetails.map(([key, value]) => (
                    <div key={key}>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-700 font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lead status info */}
            {selected.lead && (
              <div className="p-5 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {lang === 'tr' ? 'Lead Durumu' : 'Lead Status'}
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Durum' : 'Status'}</p>
                    <p className="text-sm text-slate-700 font-medium">{sl[selected.lead.status] ?? selected.lead.status}</p>
                  </div>
                  {selected.lead.source_channel && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{lang === 'tr' ? 'Kanal' : 'Channel'}</p>
                      <ChannelBadge channel={selected.lead.source_channel} size="sm" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{lang === 'tr' ? 'Bir konuşma seç' : 'Select a conversation'}</p>
          </div>
        </div>
      )}

      {/* ── Appointment Modal ── */}
      {showApptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800">{lang === 'tr' ? 'Yeni Randevu' : 'New Appointment'}</h2>
              <button onClick={() => setShowApptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{lang === 'tr' ? 'Başlık' : 'Title'}</label>
                <input value={apptForm.title}
                  onChange={e => setApptForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={lang === 'tr' ? 'Randevu başlığı' : 'Appointment title'}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{lang === 'tr' ? 'Tarih *' : 'Date *'}</label>
                <input type="date" value={apptForm.date}
                  onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{lang === 'tr' ? 'Başlangıç *' : 'Start *'}</label>
                  <input type="time" value={apptForm.startTime}
                    onChange={e => setApptForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{lang === 'tr' ? 'Bitiş' : 'End'}</label>
                  <input type="time" value={apptForm.endTime}
                    onChange={e => setApptForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{lang === 'tr' ? 'Notlar' : 'Notes'}</label>
                <textarea value={apptForm.notes} onChange={e => setApptForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder={lang === 'tr' ? 'İsteğe bağlı not...' : 'Optional notes...'} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            {apptError && <p className="text-sm text-red-500 mt-3">{apptError}</p>}

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowApptModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                {lang === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button onClick={createInboxAppointment} disabled={apptSaving}
                className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {apptSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {lang === 'tr' ? 'Oluştur' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
