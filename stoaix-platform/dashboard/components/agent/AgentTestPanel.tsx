'use client'

import { useState, useRef, useEffect, useCallback, Component, type ReactNode, type ErrorInfo } from 'react'
import {
  Send, Trash2, PhoneOff, Phone,
  MessageSquare, Bot, AlertCircle, BookOpen, FileText, Clock,
  ChevronDown,
} from 'lucide-react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useConnectionState,
} from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import {
  AgentAudioVisualizerGrid,
  type GridVisualState,
} from '@/components/agents-ui/agent-audio-visualizer-grid'

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_KB_ITEMS   = 3
const MIN_PROMPT_LEN = 50
const VOICE_MAX_SECS = 180  // 3 dakika

// ─── Model Config ─────────────────────────────────────────────────────────────

const MODELS = [
  { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6',  costPerMin: 0.0082 },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5',   costPerMin: 0.0056 },
  { id: 'gpt-4o-mini',               label: 'GPT-4o Mini',         costPerMin: 0.0045 },
  { id: 'gpt-4o',                    label: 'GPT-4o',              costPerMin: 0.0070 },
]

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

// ─── Model Selector ───────────────────────────────────────────────────────────

function ModelSelector({ model, onChange }: { model: string; onChange: (m: string) => void }) {
  const current = MODELS.find(m => m.id === model) ?? MODELS[0]
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs text-slate-500 shrink-0">Model:</span>
      <div className="relative">
        <select
          value={model}
          onChange={e => onChange(e.target.value)}
          className="appearance-none text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 pl-2.5 pr-7 py-1.5 rounded-lg border-0 outline-none cursor-pointer transition-colors"
        >
          {MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      <span className="text-xs text-slate-400">${current.costPerMin.toFixed(4)}/dk</span>
    </div>
  )
}

// ─── Chat Test ────────────────────────────────────────────────────────────────

function ChatTest({ orgId, channel, model }: { orgId: string; channel: 'voice' | 'whatsapp'; model: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalCost, setTotalCost] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset cost when model changes
  useEffect(() => {
    setTotalCost(0)
    setTotalTokens(0)
  }, [model])

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
          model,
        }),
      })
      if (!res.ok) throw new Error('API hatası')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (data.usage) {
        setTotalCost(prev => prev + (data.usage.cost ?? 0))
        setTotalTokens(prev => prev + (data.usage.inputTokens ?? 0) + (data.usage.outputTokens ?? 0))
      }
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

      {/* Maliyet göstergesi */}
      {totalTokens > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 px-1">
          <span>Toplam: ${totalCost.toFixed(4)}</span>
          <span className="text-slate-200">·</span>
          <span>{totalTokens.toLocaleString()} token</span>
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
          onClick={() => { setMessages([]); setTotalCost(0); setTotalTokens(0) }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mt-2 self-start transition-colors"
        >
          <Trash2 size={12} />
          Sohbeti temizle
        </button>
      )}
    </div>
  )
}

// ─── Error Boundary (LiveKit crash catcher) ──────────────────────────────

class LiveKitErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LiveKit Error]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-[520px] gap-4 text-center">
          <AlertCircle size={32} className="text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-600">Ses bağlantısı hatası</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm break-all">
              {this.state.error.message}
            </p>
          </div>
          <button
            onClick={() => { this.setState({ error: null }); this.props.onReset() }}
            className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Voice Test ───────────────────────────────────────────────────────────────

// Agent state → grid visual state mapping
function toGridState(
  lkConnected: boolean,
  agentState: string,
): GridVisualState {
  if (!lkConnected) return 'initializing'
  if (agentState === 'speaking')  return 'speaking'
  if (agentState === 'thinking')  return 'thinking'
  if (agentState === 'listening' || agentState === 'idle') return 'listening'
  return 'initializing'
}

// Agent state labels (Turkish)
const AGENT_STATE_LABELS: Record<string, string> = {
  initializing:          'Başlatılıyor...',
  idle:                  'Hazır',
  listening:             'Dinliyor',
  thinking:              'Düşünüyor...',
  speaking:              'Konuşuyor',
  connecting:            'Bağlanıyor...',
  'pre-connect-buffering': 'Hazırlanıyor...',
  failed:                'Bağlantı hatası',
  disconnected:          'Bağlantı kesildi',
}

// Inner component — uses LiveKit React hooks (must be inside LiveKitRoom)
function VoiceTestInner({
  onEnd,
  onConnected,
  elapsed,
  remaining,
  modelConfig,
}: {
  onEnd: () => void
  onConnected: () => void
  elapsed: number
  remaining: number
  modelConfig: (typeof MODELS)[0]
}) {
  const { state: agentState, audioTrack } = useVoiceAssistant()
  const connectionState = useConnectionState()
  const lkConnected     = connectionState === ConnectionState.Connected
  const gridState    = toGridState(lkConnected, agentState)
  const isLow        = remaining <= 30
  const formatTime   = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const estimatedCost = (elapsed / 60) * modelConfig.costPerMin

  // Start timer once LK room is connected
  const connectedRef = useRef(false)
  useEffect(() => {
    if (lkConnected && !connectedRef.current) {
      connectedRef.current = true
      onConnected()
    }
  }, [lkConnected, onConnected])

  const stateLabel = AGENT_STATE_LABELS[agentState] ?? 'Bağlandı'

  // Color based on state
  const gridColor =
    gridState === 'speaking'  ? '#6366f1' :
    gridState === 'thinking'  ? '#f59e0b' :
    gridState === 'listening' ? '#22c55e' :
    '#94a3b8'

  return (
    <>
      {/* Grid Visualizer */}
      <div className="flex flex-col items-center gap-3">
        <AgentAudioVisualizerGrid
          state={gridState}
          audioTrack={audioTrack}
          size="lg"
          color={gridColor}
        />

        {/* State label */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            gridState === 'speaking'  ? 'bg-brand-500 animate-pulse' :
            gridState === 'thinking'  ? 'bg-amber-400 animate-pulse' :
            gridState === 'listening' ? 'bg-green-500' :
            'bg-slate-300 animate-pulse'
          }`} />
          <span className={`text-xs font-medium ${
            gridState === 'speaking'  ? 'text-brand-600' :
            gridState === 'thinking'  ? 'text-amber-600' :
            gridState === 'listening' ? 'text-green-700' :
            'text-slate-500'
          }`}>
            {stateLabel}
          </span>
        </div>
      </div>

      {/* Timer & cost */}
      <div className="text-center">
        {isLow ? (
          <p className="text-sm font-semibold text-red-600">
            ⚠ {formatTime(remaining)} kaldı
          </p>
        ) : (
          <p className="text-sm font-medium text-slate-600">
            {formatTime(remaining)} kalan
          </p>
        )}
        {elapsed > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">
            ~${modelConfig.costPerMin.toFixed(4)}/dk · {formatTime(elapsed)} geçti · ~${estimatedCost.toFixed(4)}
          </p>
        )}
      </div>

      {/* End call button */}
      <button
        onClick={onEnd}
        className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-sm"
      >
        <PhoneOff size={16} />
        Aramayı Sonlandır
      </button>
    </>
  )
}

function VoiceTest({ orgId, model }: { orgId: string; model: string }) {
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle')
  const [error, setError]   = useState('')
  const [connDetails, setConnDetails] = useState<{ token: string; url: string } | null>(null)
  const [elapsed, setElapsed]     = useState(0)
  const [remaining, setRemaining] = useState(VOICE_MAX_SECS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const endCall = useCallback(() => {
    stopTimer()
    setConnDetails(null)
    setPhase('idle')
    setElapsed(0)
    setRemaining(VOICE_MAX_SECS)
  }, [stopTimer])

  const handleConnected = useCallback(() => {
    stopTimer()
    let secs = VOICE_MAX_SECS
    let elapsed = 0
    timerRef.current = setInterval(() => {
      secs--; elapsed++
      setRemaining(secs)
      setElapsed(elapsed)
      if (secs <= 0) endCall()
    }, 1000)
  }, [stopTimer, endCall])

  const startCall = useCallback(async () => {
    setPhase('connecting')
    setError('')
    setElapsed(0)
    setRemaining(VOICE_MAX_SECS)
    try {
      const res = await fetch('/api/agent/voice-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, model }),
      })
      if (!res.ok) throw new Error('Token alınamadı')
      const { token, url } = await res.json()
      setConnDetails({ token, url })
      setPhase('active')
    } catch (e: any) {
      setPhase('error')
      setError(e?.message || 'Bağlantı hatası')
    }
  }, [orgId, model])

  useEffect(() => () => stopTimer(), [stopTimer])

  const modelConfig = MODELS.find(m => m.id === model) ?? MODELS[0]

  // ── Active: LiveKitRoom wrapper ──────────────────────────────────────────────
  if (phase === 'active' && connDetails) {
    return (
      <LiveKitErrorBoundary onReset={endCall}>
        <LiveKitRoom
          serverUrl={connDetails.url}
          token={connDetails.token}
          audio={true}
          video={false}
          onDisconnected={endCall}
          onError={(err) => { console.error('[LiveKitRoom]', err); endCall() }}
          options={{ audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true } }}
          className="flex flex-col items-center justify-center h-[520px] gap-6"
        >
          <RoomAudioRenderer />
          <VoiceTestInner
            onEnd={endCall}
            onConnected={handleConnected}
            elapsed={elapsed}
            remaining={remaining}
            modelConfig={modelConfig}
          />
        </LiveKitRoom>
      </LiveKitErrorBoundary>
    )
  }

  // ── Idle / Connecting / Error ────────────────────────────────────────────────
  const gridState: GridVisualState =
    phase === 'connecting' ? 'initializing' : 'idle'

  return (
    <div className="flex flex-col items-center justify-center h-[520px] gap-6">
      {/* Grid visualizer (static for idle/connecting) */}
      <AgentAudioVisualizerGrid
        state={gridState}
        size="lg"
        color="#94a3b8"
      />

      {/* Status text */}
      <div className="text-center">
        {phase === 'connecting' ? (
          <>
            <p className="text-sm font-medium text-slate-700">Bağlanıyor...</p>
            <p className="text-xs text-slate-400 mt-1">Agent odaya katılıyor</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700">Sesli Test</p>
            <p className="text-xs text-slate-400 mt-1">Asistanınızla gerçek sesli görüşme yapın</p>
          </>
        )}
        {phase === 'error' && (
          <div className="flex items-center gap-1.5 text-sm text-red-600 mt-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Start button */}
      {phase !== 'connecting' && (
        <button
          onClick={startCall}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <Phone size={16} />
          Aramayı Başlat
        </button>
      )}

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
  const [model, setModel] = useState('claude-sonnet-4-6')

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
      <ModelSelector model={model} onChange={setModel} />
      {showChat  && <ChatTest  orgId={orgId} channel="whatsapp" model={model} />}
      {showVoice && <VoiceTest orgId={orgId} model={model} />}
    </ReadinessGate>
  )
}
