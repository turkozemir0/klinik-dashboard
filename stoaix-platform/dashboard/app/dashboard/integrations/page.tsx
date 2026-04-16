'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import {
  Trash2, Plus, Loader2, Calendar, CheckCircle2, ExternalLink, Instagram,
  X, MessageCircle, Plug, LayoutTemplate,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Facebook SDK type shim ───────────────────────────────────────────────────
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
  script.id  = 'facebook-jssdk'
  script.src = 'https://connect.facebook.net/en_US/sdk.js'
  document.body.appendChild(script)
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function CalendarSection() {
  const searchParams = useSearchParams()
  const [calConnected, setCalConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
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
      const cal = (org?.channel_config as any)?.calendar
      setCalConnected(!!(cal?.access_token))
      setLoading(false)
    })
  }, [searchParams.get('calendar_connected')])

  const connected = calConnected || !!searchParams.get('calendar_connected')
  const error = searchParams.get('calendar_error')

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Calendar size={16} className="text-brand-600" />
        <h2 className="font-semibold text-slate-800">Google Takvim</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Randevu oluşturma özelliği için Google Takviminizi bağlayın.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 size={14} className="animate-spin" /> Yükleniyor...
        </div>
      ) : connected ? (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} />
          <span className="font-medium">Google Takvim bağlı</span>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/api/calendar/auth'}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Yeniden bağla
            </button>
            <button
              disabled={disconnecting}
              onClick={async () => {
                if (!confirm('Google Takvim bağlantısını kesmek istediğinize emin misiniz?')) return
                setDisconnecting(true)
                const res = await fetch('/api/calendar/disconnect', { method: 'DELETE' })
                if (res.ok) {
                  setCalConnected(false)
                } else {
                  alert('Bağlantı kesilirken bir hata oluştu.')
                }
                setDisconnecting(false)
              }}
              className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50"
            >
              {disconnecting ? 'Kesiliyor...' : 'Bağlantıyı kes'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <p className="text-sm text-red-500 mb-3">
              Bağlantı başarısız: {error}
            </p>
          )}
          <button
            onClick={() => window.location.href = '/api/calendar/auth'}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Calendar size={14} />
            Google Takvim Bağla
            <ExternalLink size={13} className="opacity-70" />
          </button>
        </>
      )}
    </div>
  )
}

// ─── Instagram ────────────────────────────────────────────────────────────────

function InstagramSection() {
  const searchParams = useSearchParams()
  const [igState, setIgState] = useState<{ connected: boolean; username?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
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
      const ig = (org?.channel_config as any)?.instagram
      const creds = ig?.credentials
      setIgState({
        connected: !!(ig?.active && creds?.page_id),
        username: creds?.username,
      })
      setLoading(false)
    })
  }, [searchParams.get('instagram')])

  const justConnected = searchParams.get('instagram') === 'connected'
  const error = searchParams.get('instagram_error')
  const connected = justConnected || igState?.connected

  async function disconnect() {
    setDisconnecting(true)
    try {
      await fetch('/api/instagram/disconnect', { method: 'DELETE' })
      setIgState({ connected: false })
      window.history.replaceState({}, '', '/dashboard/integrations')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Instagram size={16} className="text-pink-500" />
        <h2 className="font-semibold text-slate-800">Instagram DM</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Instagram hesabınızı bağlayın, gelen DM&apos;ler otomatik yönetilsin.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 size={14} className="animate-spin" /> Yükleniyor...
        </div>
      ) : connected ? (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} />
          <span className="font-medium">
            Bağlı{igState?.username ? ` — @${igState.username}` : ''}
          </span>
          <button
            onClick={disconnect}
            disabled={disconnecting}
            className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
          >
            {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
            Bağlantıyı Kes
          </button>
        </div>
      ) : (
        <>
          {error && (
            <p className="text-sm text-red-500 mb-3">
              Bağlantı başarısız: {error}
            </p>
          )}
          <button
            onClick={() => { window.location.href = '/api/instagram/auth' }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Instagram size={14} />
            Instagram&apos;ı Bağla
            <ExternalLink size={13} className="opacity-70" />
          </button>
        </>
      )}
    </div>
  )
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

type WaConnectMode = 'embedded' | 'manual'

function WhatsAppSection() {
  const [waState, setWaState]       = useState<{ connected: boolean; phone?: string } | null>(null)
  const [loading, setLoading]       = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError]           = useState('')
  const [mode, setMode]             = useState<WaConnectMode>('embedded')

  const [manualPhoneId, setManualPhoneId]   = useState('')
  const [manualToken, setManualToken]       = useState('')
  const [manualWabaId, setManualWabaId]     = useState('')

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
      const wa    = (org?.channel_config as any)?.whatsapp
      const creds = wa?.credentials
      setWaState({
        connected: !!(wa?.active && creds?.phone_number_id),
        phone:     creds?.phone_number,
      })
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
            waba_id:         data.data?.waba_id,
          }
        }
      } catch {}
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  async function connectEmbedded() {
    if (!window.FB) { setError('Facebook SDK yüklenemedi, sayfayı yenileyin.'); return }
    setConnecting(true)
    setError('')
    waSessionInfo.current = null

    window.FB.login(async (response: any) => {
      try {
        if (!response?.authResponse?.code) {
          setError('Bağlantı iptal edildi veya yetki verilmedi.')
          return
        }
        const sessionInfo = waSessionInfo.current ?? {}
        const res = await fetch('/api/whatsapp/callback', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code:            response.authResponse.code,
            phone_number_id: sessionInfo.phone_number_id,
            waba_id:         sessionInfo.waba_id,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Bağlantı başarısız')
        setWaState({ connected: true, phone: data.phone_number })
      } catch (e: any) {
        setError(e.message ?? 'Bağlantı başarısız')
      } finally {
        setConnecting(false)
      }
    }, {
      config_id:                    process.env.NEXT_PUBLIC_META_WA_CONFIG_ID,
      response_type:                'code',
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number_id: manualPhoneId.trim(),
          access_token:    manualToken.trim(),
          waba_id:         manualWabaId.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Bağlantı başarısız')
      setWaState({ connected: true, phone: data.phone_number })
      setManualPhoneId('')
      setManualToken('')
      setManualWabaId('')
    } catch (e: any) {
      setError(e.message ?? 'Bağlantı başarısız')
    } finally {
      setConnecting(false)
    }
  }

  async function disconnect() {
    setDisconnecting(true)
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'DELETE' })
      setWaState({ connected: false })
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle size={16} className="text-green-500" />
        <h2 className="font-semibold text-slate-800">WhatsApp</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        WhatsApp Business hesabınızı bağlayın, gelen mesajlar otomatik yönetilsin.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 size={14} className="animate-spin" /> Yükleniyor...
        </div>
      ) : waState?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
            <CheckCircle2 size={16} />
            <span className="font-medium">
              Bağlı{waState.phone ? ` — ${waState.phone}` : ''}
            </span>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
            >
              {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
              Bağlantıyı Kes
            </button>
          </div>
          <Link
            href="/dashboard/templates"
            className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            <LayoutTemplate size={14} />
            Template Yönet
          </Link>
        </div>
      ) : (
        <>
          {hasEmbeddedSignup && (
            <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
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
                Manuel Bağla
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          {(mode === 'embedded' && hasEmbeddedSignup) && (
            <button
              onClick={connectEmbedded}
              disabled={connecting}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {connecting ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
              WhatsApp Bağla
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
                  WABA ID <span className="text-slate-400 font-normal">(isteğe bağlı)</span>
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
                Bağlan &amp; Doğrula
              </button>
              <p className="text-xs text-slate-400">
                Meta Business Suite → System Users → &quot;Generate Token&quot; ile token alabilirsiniz.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Excluded Phones ──────────────────────────────────────────────────────────

function ExcludedPhonesSection() {
  const [phones, setPhones] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/settings/excluded-phones')
      .then((r) => r.json())
      .then((d) => setPhones(d.phones ?? []))
      .catch(() => setError('Yüklenemedi'))
      .finally(() => setLoading(false))
  }, [])

  async function save(updated: string[]) {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/settings/excluded-phones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones: updated }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPhones(data.phones)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (e: any) {
      setError(e.message ?? 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  function addPhones() {
    if (!input.trim()) return
    const parsed = input.split(/[\s,\n]+/).map((s) => s.trim()).filter(Boolean)
    const merged = Array.from(new Set([...phones, ...parsed]))
    setInput('')
    save(merged)
  }

  function remove(phone: string) {
    save(phones.filter((p) => p !== phone))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-800 mb-1">Hariç Tutulan Numaralar</h2>
      <p className="text-sm text-slate-500 mb-4">
        Bu numaralara gelen mesajlara AI yanıt vermez. Numaraları ülke kodu ile girin (ör.{' '}
        <span className="font-mono">4915123456789</span> veya{' '}
        <span className="font-mono">+4915123456789</span>). Virgülle, boşlukla veya alt alta yapıştırabilirsiniz.
      </p>

      <div className="flex gap-2 mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addPhones() } }}
          placeholder="+4915123456789&#10;4915123456789, +90 555 000 00 00"
          rows={3}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={addPhones}
          disabled={saving || !input.trim()}
          className="self-start flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Ekle
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {success && <p className="text-sm text-green-600 mb-3">Kaydedildi.</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
          <Loader2 size={14} className="animate-spin" /> Yükleniyor...
        </div>
      ) : phones.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">Henüz hariç tutulan numara yok.</p>
      ) : (
        <ul className="space-y-1">
          {phones.map((phone) => (
            <li key={phone} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
              <span className="font-mono text-slate-700">{phone}</span>
              <button
                onClick={() => remove(phone)}
                disabled={saving}
                className="text-slate-400 hover:text-red-500 disabled:opacity-40 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Plug size={22} className="text-brand-600" />
        <h1 className="text-xl font-semibold text-slate-800">Entegrasyonlar</h1>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-400">Yükleniyor...</div>}>
          <WhatsAppSection />
        </Suspense>
        <Suspense fallback={<div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-400">Yükleniyor...</div>}>
          <InstagramSection />
        </Suspense>
        <Suspense fallback={<div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-400">Yükleniyor...</div>}>
          <CalendarSection />
        </Suspense>
        <ExcludedPhonesSection />
      </div>
    </div>
  )
}
