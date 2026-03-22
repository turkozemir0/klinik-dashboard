'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Trash2, Loader2, Mic, MicOff, PhoneOff, Phone,
  MessageSquare, Bot, AlertCircle, BookOpen, FileText, Clock,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_KB_ITEMS   = 3
const MIN_PROMPT_LEN = 50
const VOICE_MAX_SECS = 180  // 3 dakika

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AgentTestPanelProps {
  orgId: string
  activeChannel: 'voice' | 'whatsapp'
  hasVoice: boolean
  hasChat: boolean
  kbCount: number
  promptLength: number
}

// ─── Chat Test ────────────────────────────────────────────────────────────────

function ChatTest({ orgId, channel }: { orgId: string; channel: 'voice' | 'whatsapp' }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setError('')

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/agent/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          channel,
          orgId,
        }),
      })
      if (!res.ok) throw new Error('API hatası')
      const { reply } = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setError('Yanıt alınamadı. Asistan ayarlarını kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[520px]">
      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 rounded-xl border border-slate-100">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-slate-400">
            <MessageSquare size={28} className="opacity-30" />
            <p className="text-sm">Asistana bir mesaj göndererek testi başlatın.</p>
            <p className="text-xs text-slate-300">Bilgi bankası ve promptunuz kullanılacak.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-brand-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-brand-500 text-white rounded-br-sm'
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center mr-2 flex-shrink-0">
              <Bot size={14} className="text-brand-600" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Hata */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Mesajınızı yazın..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Send size={14} />
        </button>
      </div>

      {/* Clear */}
      {messages.length > 0 && (
        <button
          onClick={() => setMessages([])}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mt-2 self-start transition-colors"
        >
          <Trash2 size={12} />
          Sohbeti temizle
        </button>
      )}
    </div>
  )
}

// ─── Voice Test ───────────────────────────────────────────────────────────────

function VoiceTest({ orgId }: { orgId: string }) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [error, setError]     = useState('')
  const [roomName, setRoomName] = useState('')
  const [remaining, setRemaining] = useState(VOICE_MAX_SECS)
  const roomRef    = useRef<any>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const endCall = useCallback(async () => {
    stopTimer()
    if (roomRef.current) {
      await roomRef.current.disconnect()
      roomRef.current = null
    }
    setStatus('idle')
    setRoomName('')
    setRemaining(VOICE_MAX_SECS)
  }, [stopTimer])

  const startCall = useCallback(async () => {
    setStatus('connecting')
    setError('')
    setRemaining(VOICE_MAX_SECS)

    try {
      const res = await fetch('/api/agent/voice-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })
      if (!res.ok) throw new Error('Token alınamadı')
      const { token, url, roomName: rn } = await res.json()
      setRoomName(rn)

      const { Room, RoomEvent } = await import('livekit-client')

      const room = new Room({
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
        adaptiveStream: true,
        dynacast: true,
      })
      roomRef.current = room

      room.on(RoomEvent.Connected, () => {
        setStatus('connected')
        // 3 dakika geri sayım
        let secs = VOICE_MAX_SECS
        timerRef.current = setInterval(() => {
          secs -= 1
          setRemaining(secs)
          if (secs <= 0) endCall()
        }, 1000)
      })
      room.on(RoomEvent.Disconnected, () => {
        stopTimer()
        setStatus('idle')
        roomRef.current = null
        setRemaining(VOICE_MAX_SECS)
      })

      await room.connect(url, token)
      await room.localParticipant.setMicrophoneEnabled(true)
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || 'Bağlantı hatası')
    }
  }, [orgId, endCall, stopTimer])

  useEffect(() => { return () => { endCall() } }, [endCall])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const pct        = ((VOICE_MAX_SECS - remaining) / VOICE_MAX_SECS) * 100
  const isLow      = remaining <= 30

  return (
    <div className="flex flex-col items-center justify-center h-[520px] gap-6">
      {/* Durum göstergesi */}
      <div className="relative">
        {status === 'connected' && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="58" fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle
              cx="64" cy="64" r="58" fill="none"
              stroke={isLow ? '#ef4444' : '#22c55e'}
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
        )}
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
          status === 'connected'
            ? isLow ? 'bg-red-50' : 'bg-green-100'
            : status === 'connecting' ? 'bg-brand-100'
            : status === 'error'    ? 'bg-red-100'
            : 'bg-slate-100'
        }`}>
          {status === 'connecting' ? (
            <Loader2 size={40} className="text-brand-500 animate-spin" />
          ) : status === 'connected' ? (
            <div className="flex flex-col items-center gap-1">
              <Mic size={28} className={isLow ? 'text-red-500' : 'text-green-600'} />
              <span className={`text-sm font-mono font-bold ${isLow ? 'text-red-500' : 'text-green-700'}`}>
                {formatTime(remaining)}
              </span>
            </div>
          ) : status === 'error' ? (
            <MicOff size={40} className="text-red-500" />
          ) : (
            <Phone size={40} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Durum metni */}
      <div className="text-center">
        {status === 'idle' && (
          <>
            <p className="text-sm font-medium text-slate-700">Sesli Test</p>
            <p className="text-xs text-slate-400 mt-1">Asistanınızla gerçek sesli görüşme yapın</p>
          </>
        )}
        {status === 'connecting' && (
          <>
            <p className="text-sm font-medium text-slate-700">Bağlanıyor...</p>
            <p className="text-xs text-slate-400 mt-1">Agent odaya katılıyor</p>
          </>
        )}
        {status === 'connected' && (
          <>
            <p className={`text-sm font-medium ${isLow ? 'text-red-600' : 'text-green-700'}`}>
              {isLow ? `⚠ ${formatTime(remaining)} kaldı` : 'Bağlandı — Konuşabilirsiniz'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Test süresi: maks. {VOICE_MAX_SECS / 60} dakika
            </p>
          </>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Buton */}
      {(status === 'idle' || status === 'error') ? (
        <button
          onClick={startCall}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <Phone size={16} />
          Aramayı Başlat
        </button>
      ) : status === 'connected' ? (
        <button
          onClick={endCall}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <PhoneOff size={16} />
          Aramayı Sonlandır
        </button>
      ) : null}

      <p className="text-xs text-slate-400 text-center max-w-xs">
        Tarayıcı mikrofon izni istenecek. Test görüşmesi kaydedilmez.
      </p>
    </div>
  )
}

// ─── Readiness Check ─────────────────────────────────────────────────────────

function ReadinessGate({
  kbCount, promptLength, children,
}: {
  kbCount: number
  promptLength: number
  children: React.ReactNode
}) {
  const kbOk     = kbCount >= MIN_KB_ITEMS
  const promptOk = promptLength >= MIN_PROMPT_LEN

  if (kbOk && promptOk) return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
        <AlertCircle size={26} className="text-amber-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">Test başlatılamıyor</p>
        <p className="text-xs text-slate-400 mt-1">
          Asistanın anlamlı yanıt verebilmesi için aşağıdakileri tamamlayın:
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2.5 text-left">
        {/* Bilgi Bankası */}
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${
          kbOk ? 'border-green-100 bg-green-50' : 'border-amber-100 bg-amber-50'
        }`}>
          <BookOpen size={16} className={kbOk ? 'text-green-600' : 'text-amber-500'} />
          <div className="flex-1">
            <p className={`text-xs font-medium ${kbOk ? 'text-green-700' : 'text-amber-700'}`}>
              Bilgi Bankası
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {kbOk
                ? `✓ ${kbCount} item mevcut`
                : `${kbCount} / ${MIN_KB_ITEMS} item — ${MIN_KB_ITEMS - kbCount} tane daha ekleyin`}
            </p>
          </div>
        </div>

        {/* Prompt */}
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${
          promptOk ? 'border-green-100 bg-green-50' : 'border-amber-100 bg-amber-50'
        }`}>
          <FileText size={16} className={promptOk ? 'text-green-600' : 'text-amber-500'} />
          <div className="flex-1">
            <p className={`text-xs font-medium ${promptOk ? 'text-green-700' : 'text-amber-700'}`}>
              Asistan Talimatları
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {promptOk
                ? `✓ ${promptLength} karakter`
                : `${promptLength} / ${MIN_PROMPT_LEN} karakter — Ayarlar sekmesinden doldurun`}
            </p>
          </div>
        </div>

        {/* Süre bilgisi */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
          <Clock size={16} className="text-slate-400" />
          <p className="text-xs text-slate-500">
            Sesli test: maks. {VOICE_MAX_SECS / 60} dakika / session
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function AgentTestPanel({
  orgId, activeChannel, hasVoice, hasChat, kbCount, promptLength,
}: AgentTestPanelProps) {
  const showVoice = activeChannel === 'voice' && hasVoice
  const showChat  = activeChannel === 'whatsapp' && hasChat

  if (!showVoice && !showChat) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 text-center">
        <AlertCircle size={28} className="opacity-40" />
        <p className="text-sm">Bu kanal için henüz asistan yapılandırılmamış.</p>
        <p className="text-xs text-slate-300">
          Ayarlar sekmesinden sistem talimatları ve bilgi bankasını doldurun.
        </p>
      </div>
    )
  }

  return (
    <ReadinessGate kbCount={kbCount} promptLength={promptLength}>
      {showChat  && <ChatTest  orgId={orgId} channel="whatsapp" />}
      {showVoice && <VoiceTest orgId={orgId} />}
    </ReadinessGate>
  )
}
