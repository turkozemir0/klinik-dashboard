'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, Unplug, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onStatusChange?: (connected: boolean) => void
}

interface Doctor {
  id: string
  name: string
  nearest_day?: string
}

export function DentSoftConfig({ onStatusChange }: Props) {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [clinicName, setClinicName] = useState('')
  const [defaultDoctor, setDefaultDoctor] = useState('')

  // Form state
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [clinicId, setClinicId] = useState('')

  // Test state
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState('')
  const [testOk, setTestOk] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')

  // Save state
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Health check state
  const [healthStatus, setHealthStatus] = useState<'checking' | 'ok' | 'error' | null>(null)
  const [healthError, setHealthError] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

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
    if (cal?.provider === 'dentsoft' && cal?.api_url && cal?.api_key && cal?.clinic_id) {
      setConnected(true)
      setClinicName(cal.clinic_name ?? '')
      setDefaultDoctor(cal.default_doctor_id ?? '')
      setApiUrl(cal.api_url)
      setApiKey(cal.api_key)
      setClinicId(cal.clinic_id)
      if (cal.doctors) setDoctors(cal.doctors)
      onStatusChange?.(true)
      // Background health check
      runHealthCheck(cal.api_url, cal.api_key, cal.clinic_id)
    }
    setLoading(false)
  }

  async function runHealthCheck(url: string, key: string, clinic: string) {
    setHealthStatus('checking')
    setHealthError('')
    try {
      const res = await fetch('/api/dentsoft/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_url: url, api_key: key, clinic_id: clinic }),
      })
      const data = await res.json()
      if (data.valid) {
        setHealthStatus('ok')
      } else {
        setHealthStatus('error')
        setHealthError(data.error || 'DentSoft API yanit vermiyor')
      }
    } catch {
      setHealthStatus('error')
      setHealthError('DentSoft API\'ye ulasilamadi')
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestError('')
    setTestOk(false)
    setDoctors([])

    try {
      const res = await fetch('/api/dentsoft/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_url: apiUrl, api_key: apiKey, clinic_id: clinicId }),
      })
      const data = await res.json()

      if (data.valid) {
        setTestOk(true)
        setClinicName(data.clinic_name ?? '')
        setDoctors(data.doctors ?? [])
        if (data.doctors?.length === 1) {
          setSelectedDoctor(data.doctors[0].id)
        }
      } else {
        setTestError(data.error || 'Baglanti basarisiz')
      }
    } catch {
      setTestError('Sunucu hatasi')
    }
    setTesting(false)
  }

  async function handleSave() {
    if (!testOk) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: orgUser } = await supabase
      .from('org_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!orgUser) { setSaving(false); return }

    // Fetch existing config to merge
    const { data: org } = await supabase
      .from('organizations')
      .select('channel_config')
      .eq('id', orgUser.organization_id)
      .single()

    const existing = (org?.channel_config as any) ?? {}
    const selectedDoc = doctors.find(d => d.id === selectedDoctor)

    const newConfig = {
      ...existing,
      calendar: {
        provider: 'dentsoft',
        api_url: apiUrl,
        api_key: apiKey,
        clinic_id: clinicId,
        clinic_name: clinicName,
        default_doctor_id: selectedDoctor || undefined,
        doctors: doctors.map(d => ({ id: d.id, name: d.name })),
      },
    }

    await supabase
      .from('organizations')
      .update({ channel_config: newConfig })
      .eq('id', orgUser.organization_id)

    setConnected(true)
    setDefaultDoctor(selectedDoctor)
    onStatusChange?.(true)
    setSaving(false)
  }

  async function handleDisconnect() {
    if (!confirm('DentSoft baglantisini kesmek istediginize emin misiniz?')) return
    setDisconnecting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setDisconnecting(false); return }

    const { data: orgUser } = await supabase
      .from('org_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!orgUser) { setDisconnecting(false); return }

    const { data: org } = await supabase
      .from('organizations')
      .select('channel_config')
      .eq('id', orgUser.organization_id)
      .single()

    const existing = (org?.channel_config as any) ?? {}
    const { calendar, ...rest } = existing

    await supabase
      .from('organizations')
      .update({ channel_config: rest })
      .eq('id', orgUser.organization_id)

    setConnected(false)
    setTestOk(false)
    setDoctors([])
    setSelectedDoctor('')
    setApiUrl('')
    setApiKey('')
    setClinicId('')
    setClinicName('')
    onStatusChange?.(false)
    setDisconnecting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 size={14} className="animate-spin" /> Yukleniyor...
      </div>
    )
  }

  if (connected) {
    const docName = doctors.find(d => d.id === defaultDoctor)?.name
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} />
          <div className="flex-1">
            <span className="font-medium">DentSoft bagli</span>
            {clinicName && <span className="text-green-600 ml-1">— {clinicName}</span>}
          </div>
          {healthStatus === 'checking' && (
            <Loader2 size={13} className="animate-spin text-green-400" />
          )}
        </div>

        {healthStatus === 'error' && (
          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Baglanti sorunu</p>
              <p className="text-amber-600 mt-0.5">{healthError}</p>
              <p className="text-amber-500 mt-1">Veriler DentSoft'a iletilemeyebilir. API bilgilerinizi kontrol edin.</p>
            </div>
            <button
              onClick={() => runHealthCheck(apiUrl, apiKey, clinicId)}
              className="text-amber-500 hover:text-amber-700 p-0.5 shrink-0"
              title="Tekrar dene"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        )}

        {defaultDoctor && (
          <p className="text-xs text-slate-500">
            Varsayilan hekim: <span className="font-medium text-slate-700">{docName || defaultDoctor}</span>
          </p>
        )}
        <button
          disabled={disconnecting}
          onClick={handleDisconnect}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          <Unplug size={12} />
          {disconnecting ? 'Kesiliyor...' : 'Baglantiyi kes'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">API URL</label>
        <input
          value={apiUrl}
          onChange={e => { setApiUrl(e.target.value); setTestOk(false) }}
          placeholder="https://clinicadi.dentsoft.com.tr"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">API Key (Bearer Token)</label>
        <input
          type="password"
          value={apiKey}
          onChange={e => { setApiKey(e.target.value); setTestOk(false) }}
          placeholder="Bearer token..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Klinik ID</label>
        <input
          value={clinicId}
          onChange={e => { setClinicId(e.target.value); setTestOk(false) }}
          placeholder="12345"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {testError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm">
          <AlertCircle size={14} />
          {testError}
        </div>
      )}

      {testOk && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-sm">
            <CheckCircle2 size={14} />
            Baglanti basarili{clinicName ? ` — ${clinicName}` : ''}
          </div>

          {doctors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Varsayilan Hekim</label>
              <select
                value={selectedDoctor}
                onChange={e => setSelectedDoctor(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Hekim secin...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.nearest_day ? ` (ilk musait: ${d.nearest_day})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                AI asistan randevulari bu hekime olusturacak
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors w-full justify-center"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Kaydet
          </button>
        </div>
      )}

      {!testOk && (
        <button
          onClick={handleTest}
          disabled={testing || !apiUrl || !apiKey || !clinicId}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors w-full justify-center"
        >
          {testing ? <Loader2 size={14} className="animate-spin" /> : null}
          {testing ? 'Test ediliyor...' : 'Test & Bagla'}
        </button>
      )}
    </div>
  )
}
