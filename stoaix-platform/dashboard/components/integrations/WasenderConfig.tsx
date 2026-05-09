'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, X, CheckCircle2, QrCode } from 'lucide-react'
import QRCode from 'react-qr-code'
import { createClient } from '@/lib/supabase/client'

type Phase = 'loading' | 'idle' | 'creating' | 'connecting' | 'scanning' | 'connected' | 'error'

interface Props {
  onStatusChange?: (connected: boolean, phone?: string) => void
  onCloudDisconnect?: () => void  // called when we need to disconnect Cloud API first
}

export function WasenderConfig({ onStatusChange, onCloudDisconnect }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [error, setError] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)

  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qrRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearPolling() {
    if (statusPollRef.current) clearInterval(statusPollRef.current)
    if (qrRefreshRef.current) clearInterval(qrRefreshRef.current)
  }

  useEffect(() => {
    // Load initial state
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setPhase('idle'); return }
      const { data: orgUser } = await supabase
        .from('org_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!orgUser) { setPhase('idle'); return }
      const { data: org } = await supabase
        .from('organizations')
        .select('channel_config')
        .eq('id', orgUser.organization_id)
        .single()
      const wa = (org?.channel_config as any)?.whatsapp
      const creds = wa?.credentials
      if (wa?.provider === 'wasender' && wa?.active && creds?.status === 'connected') {
        setPhone(creds.phone_number ?? null)
        setPhase('connected')
        onStatusChange?.(true, creds.phone_number)
      } else if (wa?.provider === 'wasender' && creds?.session_id) {
        // Session exists but not connected — resume scanning
        setPhase('scanning')
        startPolling()
      } else {
        setPhase('idle')
        onStatusChange?.(false)
      }
    })

    return () => clearPolling()
  }, [])

  function startPolling() {
    clearPolling()

    // Poll status every 3s
    statusPollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/wasender/session-status')
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'connected') {
          clearPolling()
          const statusRes = await fetch('/api/wasender/session-status')
          const statusData = await statusRes.json()
          const connectedPhone = statusData.phone ?? null
          setPhone(connectedPhone)
          setPhase('connected')
          onStatusChange?.(true, connectedPhone)
        }
      } catch { /* ignore */ }
    }, 3000)

    // Refresh QR every 20s
    qrRefreshRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/wasender/qrcode')
        if (!res.ok) return
        const data = await res.json()
        if (data.qrCode) setQrCode(data.qrCode)
      } catch { /* ignore */ }
    }, 20000)
  }

  async function handleConnect() {
    if (!phoneInput.trim()) {
      setError('Telefon numarası giriniz')
      return
    }
    setError('')
    setPhase('creating')

    // Step 1: Create session
    const createRes = await fetch('/api/wasender/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneInput.trim() }),
    })
    if (!createRes.ok) {
      const d = await createRes.json()
      setError(d.error ?? 'Session oluşturulamadı')
      setPhase('error')
      return
    }

    setPhase('connecting')

    // Step 2: Connect — response includes initial QR code directly
    const connectRes = await fetch('/api/wasender/connect', { method: 'POST' })
    if (!connectRes.ok) {
      const d = await connectRes.json()
      setError(d.error ?? 'Bağlantı başlatılamadı')
      setPhase('error')
      return
    }

    const connectData = await connectRes.json()
    setQrCode(connectData.qrCode ?? null)
    setPhase('scanning')
    startPolling()
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    clearPolling()
    try {
      await fetch('/api/wasender/disconnect', { method: 'DELETE' })
      setPhase('idle')
      setQrCode(null)
      setPhone(null)
      onStatusChange?.(false)
    } finally {
      setDisconnecting(false)
    }
  }

  // ── Loading ──
  if (phase === 'loading') {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 size={14} className="animate-spin" /> Yükleniyor...
      </div>
    )
  }

  // ── Connected ──
  if (phase === 'connected') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} />
          <span className="font-medium">
            Bağlı{phone ? ` — ${phone}` : ''}
          </span>
        </div>
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Bağlantıyı Kes
          </button>
        </div>
      </div>
    )
  }

  // ── Scanning (QR shown) ──
  if (phase === 'scanning') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs">
          <span>📱 WhatsApp uygulamasını açın → <strong>Bağlı Cihazlar</strong> → <strong>Cihaz Ekle</strong> → QR kodu okutun</span>
        </div>

        <div className="flex justify-center p-4 bg-white border border-slate-200 rounded-xl">
          {qrCode ? (
            <QRCode value={qrCode} size={220} />
          ) : (
            <div className="w-[220px] h-[220px] flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-xs">QR kod yükleniyor...</span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center">
          QR kod 20 saniyede bir otomatik yenilenir. Bağlantı bekleniyor...
        </p>

        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} /> İptal
          </button>
        </div>
      </div>
    )
  }

  // ── Creating / Connecting ──
  if (phase === 'creating' || phase === 'connecting') {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
        <Loader2 size={14} className="animate-spin" />
        {phase === 'creating' ? 'Session oluşturuluyor...' : 'Bağlantı başlatılıyor...'}
      </div>
    )
  }

  // ── Idle / Error ──
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Telefonunuzda WhatsApp uygulamasına giriş yapın, QR kodu okutun ve WhatsApp hattınızı platforma bağlayın.
      </p>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          WhatsApp Numarası <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          placeholder="+905551234567"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <p className="text-xs text-slate-400 mt-1">Uluslararası format: +90 ile başlayın</p>
      </div>

      <button
        onClick={handleConnect}
        disabled={!phoneInput.trim()}
        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
      >
        <QrCode size={14} />
        QR ile Bağlan
      </button>
    </div>
  )
}
