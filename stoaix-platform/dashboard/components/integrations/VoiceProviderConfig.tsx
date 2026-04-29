'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, X, ExternalLink, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ProviderDef } from '@/lib/voice-providers'

interface Props {
  provider: ProviderDef
  onStatusChange?: (connected: boolean) => void
}

export function VoiceProviderConfig({ provider, onStatusChange }: Props) {
  const [voiceState, setVoiceState] = useState<{
    connected: boolean
    activeProvider?: string
    phone?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [connecting, setConnecting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')
  const [validationResult, setValidationResult] = useState<{ valid: boolean; note?: string } | null>(null)

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
      const vi = (org?.channel_config as any)?.voice_inbound
      const connected = !!(vi?.active && vi?.provider === provider.id)
      setVoiceState({
        connected,
        activeProvider: vi?.active ? vi?.provider : undefined,
        phone: vi?.inbound_number,
      })
      onStatusChange?.(connected)
      setLoading(false)
    })
  }, [provider.id])

  async function validate() {
    setValidating(true)
    setError('')
    setValidationResult(null)
    try {
      const res = await fetch('/api/voice/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: provider.id, credentials }),
      })
      const data = await res.json()
      setValidationResult({ valid: data.valid, note: data.note })
      if (!data.valid) setError(data.error ?? 'Dogrulama basarisiz')
    } catch {
      setError('Sunucuya baglanilamadi')
    } finally {
      setValidating(false)
    }
  }

  async function connect() {
    setConnecting(true)
    setError('')
    try {
      const res = await fetch('/api/voice/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: provider.id, credentials }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Baglanti basarisiz')
      setVoiceState({ connected: true, activeProvider: provider.id, phone: data.phone_number })
      onStatusChange?.(true)
    } catch (e: any) {
      setError(e.message ?? 'Baglanti basarisiz')
    } finally {
      setConnecting(false)
    }
  }

  async function disconnect() {
    if (!confirm(`${provider.name} baglantisini kesmek istediginize emin misiniz?`)) return
    setDisconnecting(true)
    try {
      await fetch('/api/voice/disconnect', { method: 'DELETE' })
      setVoiceState({ connected: false })
      onStatusChange?.(false)
    } catch {
      setError('Baglanti kesilemedi')
    } finally {
      setDisconnecting(false)
    }
  }

  const allFieldsFilled = provider.fields
    .filter((f) => f.required)
    .every((f) => credentials[f.key]?.trim())

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 size={14} className="animate-spin" /> Yukleniyor...
      </div>
    )
  }

  // Another provider is already connected
  if (voiceState?.activeProvider && voiceState.activeProvider !== provider.id && voiceState?.connected !== false) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          <span>
            Baska bir ses saglayicisi (<strong>{voiceState.activeProvider}</strong>) zaten bagli.
            Yeni baglanti kurmak icin once mevcut baglantiyi kesin.
          </span>
        </div>
      </div>
    )
  }

  if (voiceState?.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} />
          <span className="font-medium">
            Bagli{voiceState.phone ? ` — ${voiceState.phone}` : ''}
          </span>
        </div>
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
      <p className="text-sm text-slate-500">{provider.description}</p>

      {provider.fields.map((field) => (
        <div key={field.key}>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type={field.type === 'password' ? 'password' : 'text'}
            value={credentials[field.key] ?? ''}
            onChange={(e) => setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {validationResult?.valid && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle2 size={14} />
          Dogrulama basarili{validationResult.note ? ` — ${validationResult.note}` : ''}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={validate}
          disabled={!allFieldsFilled || validating}
          className="flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {validating && <Loader2 size={14} className="animate-spin" />}
          Baglantiyi Test Et
        </button>
        <button
          onClick={connect}
          disabled={!allFieldsFilled || connecting}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {connecting && <Loader2 size={14} className="animate-spin" />}
          Baglan
        </button>
      </div>

      {provider.helpUrl && (
        <a
          href={provider.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ExternalLink size={12} />
          {provider.name} ayarlarini ac
        </a>
      )}
    </div>
  )
}
