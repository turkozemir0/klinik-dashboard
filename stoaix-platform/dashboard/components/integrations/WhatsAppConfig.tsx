'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, MessageCircle, ExternalLink, X, CheckCircle2, LayoutTemplate } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

function loadFbSdk(appId: string) {
  if (document.getElementById('facebook-jssdk')) return
  window.fbAsyncInit = function () {
    window.FB.init({ appId, cookie: true, xfbml: false, version: 'v19.0' })
  }
  const script = document.createElement('script')
  script.id = 'facebook-jssdk'
  script.src = 'https://connect.facebook.net/en_US/sdk.js'
  document.body.appendChild(script)
}

type WaConnectMode = 'embedded' | 'manual'

interface Props {
  onStatusChange?: (connected: boolean, phone?: string) => void
}

export function WhatsAppConfig({ onStatusChange }: Props) {
  const [waState, setWaState] = useState<{ connected: boolean; phone?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<WaConnectMode>('embedded')

  const [manualPhoneId, setManualPhoneId] = useState('')
  const [manualToken, setManualToken] = useState('')
  const [manualWabaId, setManualWabaId] = useState('')

  const waSessionInfo = useRef<{ phone_number_id?: string; waba_id?: string } | null>(null)
  const hasEmbeddedSignup = !!process.env.NEXT_PUBLIC_META_WA_CONFIG_ID

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    if (appId) loadFbSdk(appId)

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: orgUser } = await supabase
        .from('org_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!orgUser) { setLoading(false); return }
      const { data: org } = await supabase
        .from('organizations')
        .select('channel_config')
        .eq('id', orgUser.organization_id)
        .single()
      const wa = (org?.channel_config as any)?.whatsapp
      const creds = wa?.credentials
      const connected = !!(wa?.active && creds?.phone_number_id)
      setWaState({ connected, phone: creds?.phone_number })
      onStatusChange?.(connected, creds?.phone_number)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== 'https://www.facebook.com') return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'WA_EMBEDDED_SIGNUP' && data.event === 'FINISH') {
          waSessionInfo.current = {
            phone_number_id: data.data?.phone_number_id,
            waba_id: data.data?.waba_id,
          }
        }
      } catch {}
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  async function connectEmbedded() {
    if (!window.FB) { setError('Facebook SDK yuklenemedi, sayfayi yenileyin.'); return }
    setConnecting(true)
    setError('')
    waSessionInfo.current = null

    window.FB.login(async (response: any) => {
      try {
        if (!response?.authResponse?.code) {
          setError('Baglanti iptal edildi veya yetki verilmedi.')
          return
        }
        const sessionInfo = waSessionInfo.current ?? {}
        const res = await fetch('/api/whatsapp/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: response.authResponse.code,
            phone_number_id: sessionInfo.phone_number_id,
            waba_id: sessionInfo.waba_id,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Baglanti basarisiz')
        setWaState({ connected: true, phone: data.phone_number })
        onStatusChange?.(true, data.phone_number)
      } catch (e: any) {
        setError(e.message ?? 'Baglanti basarisiz')
      } finally {
        setConnecting(false)
      }
    }, {
      config_id: process.env.NEXT_PUBLIC_META_WA_CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
      extras: { sessionInfoVersion: '3' },
    })
  }

  async function connectManual() {
    if (!manualPhoneId.trim() || !manualToken.trim()) {
      setError('Phone Number ID ve Access Token zorunlu.')
      return
    }
    setConnecting(true)
    setError('')
    try {
      const res = await fetch('/api/whatsapp/manual-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number_id: manualPhoneId.trim(),
          access_token: manualToken.trim(),
          waba_id: manualWabaId.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Baglanti basarisiz')
      setWaState({ connected: true, phone: data.phone_number })
      onStatusChange?.(true, data.phone_number)
      setManualPhoneId('')
      setManualToken('')
      setManualWabaId('')
    } catch (e: any) {
      setError(e.message ?? 'Baglanti basarisiz')
    } finally {
      setConnecting(false)
    }
  }

  async function disconnect() {
    setDisconnecting(true)
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'DELETE' })
      setWaState({ connected: false })
      onStatusChange?.(false)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 size={14} className="animate-spin" /> Yukleniyor...
      </div>
    )
  }

  if (waState?.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} />
          <span className="font-medium">
            Bagli{waState.phone ? ` — ${waState.phone}` : ''}
          </span>
        </div>
        <Link
          href="/dashboard/templates"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          <LayoutTemplate size={14} />
          Template Yonet
        </Link>
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={disconnect}
            disabled={disconnecting}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Baglantiyi Kes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hasEmbeddedSignup && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => { setMode('embedded'); setError('') }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === 'embedded' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Embedded Signup
          </button>
          <button
            onClick={() => { setMode('manual'); setError('') }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Manuel Bagla
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {(mode === 'embedded' && hasEmbeddedSignup) && (
        <button
          onClick={connectEmbedded}
          disabled={connecting}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {connecting ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
          WhatsApp Bagla
          <ExternalLink size={13} className="opacity-70" />
        </button>
      )}

      {(mode === 'manual' || !hasEmbeddedSignup) && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Phone Number ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manualPhoneId}
              onChange={(e) => setManualPhoneId(e.target.value)}
              placeholder="Meta App → WhatsApp → Phone Numbers"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              System User Access Token <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="EAAx..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              WABA ID <span className="text-slate-400 font-normal">(istege bagli)</span>
            </label>
            <input
              type="text"
              value={manualWabaId}
              onChange={(e) => setManualWabaId(e.target.value)}
              placeholder="WhatsApp Business Account ID"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={connectManual}
            disabled={connecting || !manualPhoneId.trim() || !manualToken.trim()}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {connecting ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
            Baglan &amp; Dogrula
          </button>
          <p className="text-xs text-slate-400">
            Meta Business Suite → System Users → &quot;Generate Token&quot; ile token alabilirsiniz.
          </p>
        </div>
      )}
    </div>
  )
}
