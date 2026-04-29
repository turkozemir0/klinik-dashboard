'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, Send, CheckCircle2, Calendar, Copy, Check, Eye, EyeOff, Globe } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoiceInboundConfig {
  active: boolean
  inbound_number?: string
  connection_type?: 'direct_sip' | 'twilio_bridge' | 'vonage_bridge' | 'other'
  sip_provider?: string
  sip_provider_note?: string
  bridge_number?: string
  bridge_account_sid?: string
  bridge_auth_token?: string
  bridge_twiml_url?: string
  livekit_dispatch_rule_id?: string
  livekit_sip_trunk_id?: string
}

interface VoiceOutboundConfig {
  active: boolean
  connection_type?: 'twilio' | 'vonage' | 'livekit_sip' | 'other'
  from_number?: string
  account_sid?: string
  auth_token?: string
  livekit_sip_outbound_trunk_id?: string
  provider_note?: string
}

interface WhatsAppChannelConfig {
  active: boolean
  provider?: string
  credentials?: Record<string, string>
}

interface CalendarConfig {
  provider: 'none' | 'google' | 'dentsoft'
  calendar_id?: string
  access_token?: string
  refresh_token?: string
  token_expiry?: string
  api_url?: string
  api_key?: string
  clinic_id?: string
}

interface VoiceLanguageConfig {
  language?: string
}

interface WebsiteFormsConfig {
  active: boolean
  api_key?: string
  default_country_code?: string
  field_mapping?: Record<string, string>
}

interface ChannelConfig {
  voice_inbound:  VoiceInboundConfig
  voice_outbound: VoiceOutboundConfig
  voice?:         VoiceLanguageConfig
  whatsapp:       WhatsAppChannelConfig
  instagram:      { active: boolean; provider?: string; credentials?: Record<string, string> }
  calendar?:      CalendarConfig
  website_forms?: WebsiteFormsConfig
}

interface CrmConfig {
  provider: 'none' | 'webhook' | 'dentsoft'
  webhook_url?: string
  webhook_secret?: string
  events?: string[]
  api_url?: string
  api_key?: string
  clinic_id?: string
}

interface OrgDetail {
  id: string
  name: string
  channel_config: ChannelConfig
  crm_config: CrmConfig
  default_language?: string
  timezone?: string
  _plan?: string
}

interface Props {
  orgId: string
  orgName: string
  onClose: () => void
  onSaved: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WA_PROVIDERS = [
  { value: '360dialog',      label: '360dialog (Meta BSP)',   desc: 'Meta resmi BSP — doğrudan WhatsApp Business API' },
  { value: 'whatsapp_cloud', label: 'WhatsApp Cloud API',     desc: 'Meta resmi API (self-managed)' },
  { value: 'wati',           label: 'WATI',                   desc: 'WATI Business API' },
  { value: 'twilio',         label: 'Twilio WhatsApp',        desc: 'Twilio Messaging' },
]

const CRM_PROVIDERS = [
  { value: 'none',     label: 'Yok (Sadece stoaix CRM)', desc: 'Dış CRM entegrasyonu yok' },
  { value: 'webhook',  label: 'Outbound Webhook',         desc: 'Her event\'te kendi CRM\'ine JSON gönder' },
  { value: 'dentsoft', label: 'Dentsoft',                  desc: 'Dentsoft klinik yönetim sistemi — native adapter' },
]

const CRM_EVENTS = [
  { key: 'new_lead',           label: 'new_lead — İlk mesaj geldiğinde' },
  { key: 'lead_status_change', label: 'lead_status_change — Kualifikasyon / handoff' },
  { key: 'appointment_booked', label: 'appointment_booked — Randevu onaylandığında' },
]

const CALENDAR_PROVIDERS = [
  { value: 'none',     label: 'Kapalı',            desc: 'Randevu özelliği pasif' },
  { value: 'google',   label: 'Google Takvim',      desc: 'OAuth ile bağlan, Google Calendar\'da randevu aç' },
  { value: 'dentsoft', label: 'Dentsoft Takvim',    desc: 'Dentsoft CRM üzerinden müsaitlik + randevu' },
]

const INBOUND_CONNECTION_TYPES = [
  { value: 'direct_sip',    label: 'Direkt SIP',     desc: 'NETGSM/Verimor/başka Sanal Santral → LiveKit doğrudan' },
  { value: 'twilio_bridge', label: 'Twilio Köprüsü', desc: 'Twilio numarası üzerinden köprüleme' },
  { value: 'vonage_bridge', label: 'Vonage Köprüsü', desc: 'Vonage (Türk numara desteği var)' },
  { value: 'other',         label: 'Diğer',           desc: 'Başka SIP provider' },
]

const OUTBOUND_CONNECTION_TYPES = [
  { value: 'twilio',      label: 'Twilio',      desc: 'Twilio Programmable Voice' },
  { value: 'vonage',      label: 'Vonage',      desc: 'Vonage Voice API' },
  { value: 'livekit_sip', label: 'LiveKit SIP', desc: 'LiveKit outbound SIP trunk' },
  { value: 'other',       label: 'Diğer',       desc: 'Başka provider' },
]

const VOICE_LANGUAGES_BASE = [
  { value: 'tr', label: 'Türkçe (TR)' },
  { value: 'en', label: 'İngilizce (EN)' },
]

const VOICE_LANGUAGES_ADVANCED = [
  ...VOICE_LANGUAGES_BASE,
  { value: 'ar', label: 'Arapça (AR)' },
  { value: 'de', label: 'Almanca (DE)' },
  { value: 'ru', label: 'Rusça (RU)' },
  { value: 'fr', label: 'Fransızca (FR)' },
  { value: 'es', label: 'İspanyolca (ES)' },
  { value: 'it', label: 'İtalyanca (IT)' },
  { value: 'pt', label: 'Portekizce (PT)' },
  { value: 'zh', label: 'Çince (ZH)' },
]

const MULTILANG_PLANS = new Set(['business', 'custom', 'legacy'])

const FORM_MAPPING_TARGETS = [
  { value: '', label: '— Seç —' },
  { value: 'full_name', label: 'Ad Soyad' },
  { value: 'phone', label: 'Telefon' },
  { value: 'email', label: 'E-posta' },
  { value: 'city', label: 'Şehir' },
  { value: 'country', label: 'Ülke' },
]

const FORM_CC_OPTIONS = [
  { code: '90',  label: 'TR (+90)' },
  { code: '49',  label: 'DE (+49)' },
  { code: '1',   label: 'US/CA (+1)' },
  { code: '44',  label: 'UK (+44)' },
  { code: '971', label: 'AE (+971)' },
]

const ORG_LANGUAGE_OPTIONS = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'nl', label: 'Nederlands' },
]

const ORG_TIMEZONE_OPTIONS = [
  { group: 'Avrupa', zones: ['Europe/Istanbul', 'Europe/Berlin', 'Europe/London', 'Europe/Paris', 'Europe/Moscow'] },
  { group: 'Orta Doğu', zones: ['Asia/Dubai', 'Asia/Riyadh', 'Asia/Baghdad'] },
  { group: 'Amerika', zones: ['America/New_York', 'America/Chicago', 'America/Los_Angeles'] },
]

const TABS = [
  { key: 'general',   label: 'Genel' },
  { key: 'channels',  label: 'Kanallar & Mesajlaşma' },
  { key: 'sip',       label: 'Ses / SIP' },
  { key: 'crm',       label: 'Dış CRM' },
  { key: 'calendar',  label: 'Randevu / Takvim' },
  { key: 'forms',     label: 'Web Formları' },
] as const

// ─── Small components ─────────────────────────────────────────────────────────

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0 ${active ? 'bg-brand-500' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Field({ label, value, onChange, placeholder, mono = true, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; mono?: boolean; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${mono ? 'font-mono' : ''}`} />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function RadioGroup({ options, value, onChange }: {
  options: { value: string; label: string; desc: string }[]
  value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
            value === opt.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
          <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${value === opt.value ? 'border-brand-500' : 'border-slate-300'}`}>
            {value === opt.value && <div className="w-2 h-2 rounded-full bg-brand-500" />}
          </div>
          <div>
            <p className={`text-sm font-medium ${value === opt.value ? 'text-brand-700' : 'text-slate-700'}`}>{opt.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{children}</p>
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OrgSettingsModal({ orgId, orgName, onClose, onSaved }: Props) {
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [activeTab, setActiveTab] = useState<'general' | 'channels' | 'sip' | 'crm' | 'calendar' | 'forms'>('general')

  // ── Channels state ──
  const [waActive, setWaActive]       = useState(false)
  const [waProvider, setWaProvider]   = useState('360dialog')
  const [waCreds, setWaCreds]         = useState<Record<string, string>>({})
  const [igActive, setIgActive]       = useState(false)

  // ── Inbound SIP state ──
  const [inbActive, setInbActive]             = useState(false)
  const [inbNumber, setInbNumber]             = useState('')
  const [inbConnType, setInbConnType]         = useState<string>('direct_sip')
  const [inbSipProvider, setInbSipProvider]   = useState('')
  const [inbSipNote, setInbSipNote]           = useState('')
  const [inbBridgeNumber, setInbBridgeNumber] = useState('')
  const [inbBridgeSid, setInbBridgeSid]       = useState('')
  const [inbBridgeToken, setInbBridgeToken]   = useState('')
  const [inbBridgeTwiml, setInbBridgeTwiml]   = useState('')
  const [inbLkDispatch, setInbLkDispatch]     = useState('')
  const [inbLkTrunk, setInbLkTrunk]           = useState('')

  // ── Outbound SIP state ──
  const [outActive, setOutActive]               = useState(false)
  const [outConnType, setOutConnType]           = useState<string>('twilio')
  const [outFromNumber, setOutFromNumber]       = useState('')
  const [outSid, setOutSid]                     = useState('')
  const [outToken, setOutToken]                 = useState('')
  const [outLkTrunk, setOutLkTrunk]             = useState('')
  const [outProviderNote, setOutProviderNote]   = useState('')

  // ── CRM state ──
  const [crmProvider, setCrmProvider]           = useState<CrmConfig['provider']>('none')
  const [crmWebhookUrl, setCrmWebhookUrl]       = useState('')
  const [crmWebhookSecret, setCrmWebhookSecret] = useState('')
  const [crmEvents, setCrmEvents]               = useState<string[]>(['new_lead', 'lead_status_change', 'appointment_booked'])
  const [dsApiUrl, setDsApiUrl]                 = useState('')
  const [dsApiKey, setDsApiKey]                 = useState('')
  const [dsClinicId, setDsClinicId]             = useState('')
  const [webhookTesting, setWebhookTesting]     = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<'ok' | 'fail' | null>(null)

  // ── Voice language state ──
  const [voiceLang, setVoiceLang]         = useState('tr')
  const [orgPlan, setOrgPlan]             = useState<string>('legacy')

  // ── Calendar state ──
  const [calProvider, setCalProvider]     = useState<CalendarConfig['provider']>('none')
  const [calGoogleConnected, setCalGoogleConnected] = useState(false)
  const [calGoogleExpiry, setCalGoogleExpiry]       = useState('')
  const [calCalendarId, setCalCalendarId]           = useState('primary')
  const [calDsApiUrl, setCalDsApiUrl]               = useState('')
  const [calDsApiKey, setCalDsApiKey]               = useState('')
  const [calDsClinicId, setCalDsClinicId]           = useState('')

  // ── General org state ──
  const [orgLang, setOrgLang]       = useState('tr')
  const [orgTimezone, setOrgTimezone] = useState('Europe/Berlin')

  // ── Web Forms state ──
  const [formsActive, setFormsActive]           = useState(false)
  const [formsApiKey, setFormsApiKey]           = useState('')
  const [formsDefaultCC, setFormsDefaultCC]     = useState('90')
  const [formsMapping, setFormsMapping]         = useState<{ formField: string; target: string }[]>([{ formField: '', target: '' }])
  const [formsShowKey, setFormsShowKey]         = useState(false)
  const [formsCopied, setFormsCopied]           = useState(false)

  // ── Load ──
  useEffect(() => {
    fetch(`/api/admin/orgs/${orgId}`).then(r => r.json()).then((data: OrgDetail) => {
      // general
      setOrgLang(data.default_language ?? 'tr')
      setOrgTimezone(data.timezone ?? 'Europe/Berlin')

      const cc = (data.channel_config ?? {}) as Partial<ChannelConfig>

      // channels
      setWaActive(cc.whatsapp?.active ?? false)
      setWaProvider(cc.whatsapp?.provider ?? '360dialog')
      setWaCreds(cc.whatsapp?.credentials ?? {})
      setIgActive(cc.instagram?.active ?? false)

      // inbound
      const inb = cc.voice_inbound as VoiceInboundConfig | undefined
      setInbActive(inb?.active ?? false)
      setInbNumber(inb?.inbound_number ?? '')
      setInbConnType(inb?.connection_type ?? 'direct_sip')
      setInbSipProvider(inb?.sip_provider ?? '')
      setInbSipNote(inb?.sip_provider_note ?? '')
      setInbBridgeNumber(inb?.bridge_number ?? '')
      setInbBridgeSid(inb?.bridge_account_sid ?? '')
      setInbBridgeToken(inb?.bridge_auth_token ?? '')
      setInbBridgeTwiml(inb?.bridge_twiml_url ?? '')
      setInbLkDispatch(inb?.livekit_dispatch_rule_id ?? '')
      setInbLkTrunk(inb?.livekit_sip_trunk_id ?? '')

      // voice language
      setVoiceLang(cc.voice?.language ?? 'tr')
      setOrgPlan((data as OrgDetail)._plan ?? 'legacy')

      // outbound
      const out = cc.voice_outbound as VoiceOutboundConfig | undefined
      setOutActive(out?.active ?? false)
      setOutConnType(out?.connection_type ?? 'twilio')
      setOutFromNumber(out?.from_number ?? '')
      setOutSid(out?.account_sid ?? '')
      setOutToken(out?.auth_token ?? '')
      setOutLkTrunk(out?.livekit_sip_outbound_trunk_id ?? '')
      setOutProviderNote(out?.provider_note ?? '')

      // calendar
      const cal = cc.calendar as CalendarConfig | undefined
      setCalProvider(cal?.provider ?? 'none')
      setCalGoogleConnected(!!(cal?.access_token))
      setCalGoogleExpiry(cal?.token_expiry ?? '')
      setCalCalendarId(cal?.calendar_id ?? 'primary')
      setCalDsApiUrl(cal?.api_url ?? '')
      setCalDsApiKey(cal?.api_key ?? '')
      setCalDsClinicId(cal?.clinic_id ?? '')

      // website forms
      const wf = cc.website_forms as WebsiteFormsConfig | undefined
      setFormsActive(wf?.active ?? false)
      setFormsApiKey(wf?.api_key ?? '')
      setFormsDefaultCC(wf?.default_country_code ?? '90')
      const fmRows = Object.entries(wf?.field_mapping ?? {}).map(([formField, target]) => ({ formField, target }))
      setFormsMapping(fmRows.length > 0 ? fmRows : [{ formField: '', target: '' }])

      // crm
      const crm = (data.crm_config ?? { provider: 'none' }) as CrmConfig
      const rawProvider = (crm as any).provider as string
      const provider = rawProvider === 'ghl' ? 'none' : (rawProvider ?? 'none')
      setCrmProvider(provider as CrmConfig['provider'])
      setCrmWebhookUrl(crm.webhook_url ?? '')
      setCrmWebhookSecret(crm.webhook_secret ?? '')
      setCrmEvents(crm.events ?? ['new_lead', 'lead_status_change', 'appointment_booked'])
      setDsApiUrl(crm.api_url ?? '')
      setDsApiKey(crm.api_key ?? '')
      setDsClinicId(crm.clinic_id ?? '')

      setLoading(false)
    }).catch(() => { setError('Org yüklenemedi'); setLoading(false) })
  }, [orgId])

  // ── Webhook test ──
  async function handleTestWebhook() {
    if (!crmWebhookUrl) return
    setWebhookTesting(true)
    setWebhookTestResult(null)
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: crmWebhookUrl, webhook_secret: crmWebhookSecret }),
      })
      setWebhookTestResult(res.ok ? 'ok' : 'fail')
    } catch {
      setWebhookTestResult('fail')
    } finally {
      setWebhookTesting(false)
    }
  }

  // ── Google OAuth ──
  function handleGoogleConnect() {
    window.location.href = `/api/calendar/auth?org_id=${orgId}`
  }

  // ── Save ──
  async function handleSave() {
    setSaving(true); setError('')
    try {

    const voiceInbound: VoiceInboundConfig = {
      active: inbActive,
      ...(inbActive && {
        inbound_number: inbNumber.trim(),
        connection_type: inbConnType as VoiceInboundConfig['connection_type'],
        ...(inbConnType === 'direct_sip' && {
          sip_provider: inbSipProvider.trim(),
          sip_provider_note: inbSipNote.trim(),
        }),
        ...(['twilio_bridge', 'vonage_bridge', 'other'].includes(inbConnType) && {
          bridge_number: inbBridgeNumber.trim(),
          bridge_account_sid: inbBridgeSid.trim(),
          bridge_auth_token: inbBridgeToken.trim(),
          bridge_twiml_url: inbBridgeTwiml.trim(),
        }),
        livekit_dispatch_rule_id: inbLkDispatch.trim(),
        livekit_sip_trunk_id: inbLkTrunk.trim(),
      }),
    }

    const voiceOutbound: VoiceOutboundConfig = {
      active: outActive,
      ...(outActive && {
        connection_type: outConnType as VoiceOutboundConfig['connection_type'],
        from_number: outFromNumber.trim(),
        ...(['twilio', 'vonage'].includes(outConnType) && {
          account_sid: outSid.trim(),
          auth_token: outToken.trim(),
        }),
        ...(outConnType === 'livekit_sip' && {
          livekit_sip_outbound_trunk_id: outLkTrunk.trim(),
        }),
        provider_note: outProviderNote.trim(),
      }),
    }

    // Build calendar config — preserve tokens (don't overwrite from UI, OAuth flow handles them)
    let calendarConfig: CalendarConfig = { provider: calProvider }
    if (calProvider === 'google') {
      calendarConfig = {
        provider: 'google',
        calendar_id: calCalendarId.trim() || 'primary',
      }
    } else if (calProvider === 'dentsoft') {
      calendarConfig = {
        provider: 'dentsoft',
        api_url: calDsApiUrl.trim(),
        api_key: calDsApiKey.trim(),
        clinic_id: calDsClinicId.trim(),
      }
    }

    // Fetch current channel_config to preserve OAuth tokens (Instagram credentials, Google Calendar tokens)
    // that are set via separate OAuth flows and not managed by this modal.
    const currentRes = await fetch(`/api/admin/orgs/${orgId}`)
    if (!currentRes.ok) {
      setError('Mevcut ayarlar alınamadı, lütfen tekrar deneyin.')
      setSaving(false)
      return
    }
    const currentData = await currentRes.json()
    const existingCC = (currentData.channel_config ?? {}) as any

    // Build website_forms config — preserve api_key from existing
    const formsFieldMapping: Record<string, string> = {}
    for (const m of formsMapping) {
      if (m.formField.trim() && m.target) formsFieldMapping[m.formField.trim()] = m.target
    }
    const websiteFormsConfig: WebsiteFormsConfig = {
      active: formsActive,
      api_key: formsApiKey || existingCC.website_forms?.api_key || undefined,
      default_country_code: formsDefaultCC,
      field_mapping: Object.keys(formsFieldMapping).length > 0 ? formsFieldMapping : (existingCC.website_forms?.field_mapping ?? {}),
    }

    const channelConfig: ChannelConfig = {
      voice_inbound:  voiceInbound,
      voice_outbound: voiceOutbound,
      voice: { language: voiceLang },
      whatsapp: waActive ? { active: true, provider: waProvider, credentials: waCreds } : { active: false },
      // Preserve Instagram OAuth credentials — only toggle active flag here
      instagram: { ...existingCC.instagram, active: igActive },
      // Preserve Google Calendar OAuth tokens — UI only changes provider/calendar_id
      calendar: calProvider === 'google'
        ? {
            ...existingCC.calendar,
            provider:    'google',
            calendar_id: calCalendarId.trim() || 'primary',
          }
        : calendarConfig,
      website_forms: websiteFormsConfig,
    }

    let crmConfig: CrmConfig = { provider: 'none' }
    if (crmProvider === 'webhook') {
      crmConfig = {
        provider: 'webhook',
        webhook_url: crmWebhookUrl.trim(),
        webhook_secret: crmWebhookSecret.trim(),
        events: crmEvents,
      }
    } else if (crmProvider === 'dentsoft') {
      crmConfig = {
        provider: 'dentsoft',
        api_url: dsApiUrl.trim(),
        api_key: dsApiKey.trim(),
        clinic_id: dsClinicId.trim(),
      }
    }

    const res = await fetch(`/api/admin/orgs/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_config: channelConfig, crm_config: crmConfig, default_language: orgLang, timezone: orgTimezone }),
    })

      if (!res.ok) { const d = await res.json(); setError(d.error || 'Kayıt başarısız'); return }
      onSaved(); onClose()
    } catch (e: any) {
      setError(e.message ?? 'Beklenmeyen hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Entegrasyon Ayarları</h2>
            <p className="text-xs text-slate-500 mt-0.5">{orgName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 flex-shrink-0 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ── GENERAL TAB ── */}
              {activeTab === 'general' && (
                <div className="space-y-5">
                  <SectionLabel>Genel Ayarlar</SectionLabel>

                  {/* Language */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Varsayılan Dil</label>
                    <select
                      value={orgLang}
                      onChange={e => setOrgLang(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {ORG_LANGUAGE_OPTIONS.map(l => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">AI asistanın ve sistem mesajlarının varsayılan dili</p>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Saat Dilimi</label>
                    <select
                      value={orgTimezone}
                      onChange={e => setOrgTimezone(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {ORG_TIMEZONE_OPTIONS.map(g => (
                        <optgroup key={g.group} label={g.group}>
                          {g.zones.map(z => (
                            <option key={z} value={z}>{z}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">İş akışları ve randevu zamanlaması için kullanılır</p>
                  </div>
                </div>
              )}

              {/* ── CHANNELS TAB ── */}
              {activeTab === 'channels' && (
                <div className="space-y-5">
                  {/* WhatsApp */}
                  <div>
                    <SectionLabel>WhatsApp</SectionLabel>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-3.5">
                        <div>
                          <p className="text-sm font-medium text-slate-800">WhatsApp</p>
                          <p className="text-xs text-slate-400">Gelen/giden mesajlar</p>
                        </div>
                        <Toggle active={waActive} onToggle={() => setWaActive(v => !v)} />
                      </div>
                      {waActive && (
                        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">Mesajlaşma Provider</p>
                            <RadioGroup options={WA_PROVIDERS} value={waProvider}
                              onChange={p => { setWaProvider(p); setWaCreds({}) }} />
                          </div>
                          {waProvider === '360dialog' && (
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 text-xs text-green-700">
                                <strong>Webhook URL:</strong>{' '}
                                <code className="font-mono break-all">https://ablntzdbsrzbqyrnfwpl.supabase.co/functions/v1/dialog-inbound</code>
                              </div>
                              <Field label="Client Token (D360-API-KEY)" value={waCreds.client_token ?? ''} onChange={v => setWaCreds(c => ({ ...c, client_token: v }))} placeholder="xxx..." />
                              <Field label="Phone Number ID" value={waCreds.phone_number_id ?? ''} onChange={v => setWaCreds(c => ({ ...c, phone_number_id: v }))} placeholder="123456789012345" />
                              <Field label="WABA ID" value={waCreds.waba_id ?? ''} onChange={v => setWaCreds(c => ({ ...c, waba_id: v }))} placeholder="123456789012345" />
                              <Field label="Webhook Verify Token" value={waCreds.webhook_verify_token ?? ''} onChange={v => setWaCreds(c => ({ ...c, webhook_verify_token: v }))} placeholder="stoaix_verify_xyz" hint="360dialog webhook doğrulaması için — rastgele bir string" />
                            </div>
                          )}
                          {waProvider === 'whatsapp_cloud' && (
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 text-xs text-green-700">
                                <strong>Webhook URL:</strong>{' '}
                                <code className="font-mono break-all">https://ablntzdbsrzbqyrnfwpl.supabase.co/functions/v1/meta-whatsapp-inbound</code>
                                <p className="mt-1 text-green-600">Meta App Dashboard → WhatsApp → Configuration → Webhook URL olarak girin. Verify Token: Supabase Edge Function env <code>META_WEBHOOK_VERIFY_TOKEN</code> değeri.</p>
                              </div>
                              <Field label="Phone Number ID" value={waCreds.phone_number_id ?? ''} onChange={v => setWaCreds(c => ({ ...c, phone_number_id: v }))} placeholder="123456789012345" hint="Meta App → WhatsApp → Phone Numbers'dan alın" />
                              <Field label="Access Token (System User Token)" value={waCreds.access_token ?? ''} onChange={v => setWaCreds(c => ({ ...c, access_token: v }))} placeholder="EAAx..." hint="Meta Business Suite → System Users → Generate Token" />
                            </div>
                          )}
                          {waProvider === 'wati' && (
                            <div className="space-y-3">
                              <Field label="API Endpoint" value={waCreds.api_endpoint ?? ''} onChange={v => setWaCreds(c => ({ ...c, api_endpoint: v }))} placeholder="https://live-server-12345.wati.io" mono={false} />
                              <Field label="API Token" value={waCreds.api_token ?? ''} onChange={v => setWaCreds(c => ({ ...c, api_token: v }))} placeholder="eyJhbGci..." />
                            </div>
                          )}
                          {waProvider === 'twilio' && (
                            <div className="space-y-3">
                              <Field label="Account SID" value={waCreds.account_sid ?? ''} onChange={v => setWaCreds(c => ({ ...c, account_sid: v }))} placeholder="ACxxx..." />
                              <Field label="Auth Token" value={waCreds.auth_token ?? ''} onChange={v => setWaCreds(c => ({ ...c, auth_token: v }))} placeholder="xxx..." />
                              <Field label="WhatsApp From Number" value={waCreds.from_number ?? ''} onChange={v => setWaCreds(c => ({ ...c, from_number: v }))} placeholder="whatsapp:+14155238886" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instagram */}
                  <div>
                    <SectionLabel>Instagram DM</SectionLabel>
                    <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Instagram DM</p>
                        <p className="text-xs text-slate-400">Instagram Messaging API</p>
                      </div>
                      <Toggle active={igActive} onToggle={() => setIgActive(v => !v)} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── SIP TAB ── */}
              {activeTab === 'sip' && (
                <div className="space-y-6">

                  {/* Inbound */}
                  <div>
                    <SectionLabel>Inbound — Gelen Aramalar</SectionLabel>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-3.5">
                        <div>
                          <p className="text-sm font-medium text-slate-800">Voice Inbound</p>
                          <p className="text-xs text-slate-400">Gelen aramaları AI agent'a yönlendir</p>
                        </div>
                        <Toggle active={inbActive} onToggle={() => setInbActive(v => !v)} />
                      </div>

                      {inbActive && (
                        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
                          <Field
                            label="Arayanların çevirdiği numara (DID)"
                            value={inbNumber} onChange={setInbNumber}
                            placeholder="+905xxxxxxxxx veya 0850xxxxxxx"
                            hint="Müşterinin mevcut telefon numarası"
                          />

                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">Bağlantı Tipi</p>
                            <RadioGroup options={INBOUND_CONNECTION_TYPES} value={inbConnType} onChange={setInbConnType} />
                          </div>

                          {inbConnType === 'direct_sip' && (
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 text-xs text-green-700">
                                <strong>Kurulum:</strong> Müşterinin Sanal Santral'ına harici SIP trunk olarak şu URI eklenir:<br />
                                <code className="font-mono mt-1 block">sip:stoaix-ai-infra-wgd3xles.sip.livekit.cloud</code>
                              </div>
                              <Field label="SIP Provider (netgsm / verimor / diğer)" value={inbSipProvider} onChange={setInbSipProvider} placeholder="netgsm" mono={false} />
                              <Field label="Not (opsiyonel)" value={inbSipNote} onChange={setInbSipNote} placeholder="Hesap no, bitiş tarihi vb." mono={false} />
                            </div>
                          )}

                          {['twilio_bridge', 'vonage_bridge', 'other'].includes(inbConnType) && (
                            <div className="space-y-3">
                              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                                Müşteri, mevcut numarasından bu köprü numarasına <strong>çağrı yönlendirmesi</strong> açar. Köprü aramaları LiveKit'e iletir.
                              </div>
                              <Field label={`${inbConnType === 'twilio_bridge' ? 'Twilio' : inbConnType === 'vonage_bridge' ? 'Vonage' : 'Köprü'} Numarası`} value={inbBridgeNumber} onChange={setInbBridgeNumber} placeholder="+1415xxxxxxx" />
                              <Field label="Account SID / API Key" value={inbBridgeSid} onChange={setInbBridgeSid} placeholder="ACxxx..." />
                              <Field label="Auth Token / API Secret" value={inbBridgeToken} onChange={setInbBridgeToken} placeholder="xxx..." />
                              <Field label="TwiML Bin URL (opsiyonel)" value={inbBridgeTwiml} onChange={setInbBridgeTwiml} placeholder="https://handler.twilio.com/twiml/xxx" mono={false} />
                            </div>
                          )}

                          <div className="space-y-3 pt-1 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 pt-1">LiveKit</p>
                            <Field label="Dispatch Rule ID" value={inbLkDispatch} onChange={setInbLkDispatch} placeholder="SDR_xxxxxxxxxxxxxxxxxx" hint="Bu org için oluşturulan LiveKit dispatch rule" />
                            <Field label="SIP Trunk ID" value={inbLkTrunk} onChange={setInbLkTrunk} placeholder="ST_xxxxxxxxxxxxxxxxxx" hint="Platform geneli shared trunk (boş bırakılabilir)" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voice Language */}
                  <div>
                    <SectionLabel>Konuşma Dili</SectionLabel>
                    <div className="border border-slate-100 rounded-xl p-4 space-y-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">AI Agent Dili</label>
                        <select
                          value={voiceLang}
                          onChange={e => setVoiceLang(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          {(MULTILANG_PLANS.has(orgPlan) ? VOICE_LANGUAGES_ADVANCED : VOICE_LANGUAGES_BASE).map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                      </div>
                      {!MULTILANG_PLANS.has(orgPlan) && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                          TR/EN dışı diller Business veya Custom plan gerektirir. Mevcut plan: <strong>{orgPlan || 'essential/professional'}</strong>
                        </p>
                      )}
                      <p className="text-xs text-slate-400">
                        Ses ID'leri Vercel'de <code className="font-mono">CARTESIA_VOICE_ID_XX</code> env var ile ayarlanır.
                      </p>
                    </div>
                  </div>

                  {/* Outbound */}
                  <div>
                    <SectionLabel>Outbound — Giden Aramalar</SectionLabel>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-3.5">
                        <div>
                          <p className="text-sm font-medium text-slate-800">Voice Outbound</p>
                          <p className="text-xs text-slate-400">Otomatik arama, takip çağrısı, randevu hatırlatma</p>
                        </div>
                        <Toggle active={outActive} onToggle={() => setOutActive(v => !v)} />
                      </div>

                      {outActive && (
                        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">Provider</p>
                            <RadioGroup options={OUTBOUND_CONNECTION_TYPES} value={outConnType}
                              onChange={t => { setOutConnType(t); setOutSid(''); setOutToken(''); setOutLkTrunk('') }} />
                          </div>

                          <Field label="Giden arama numarası (From)" value={outFromNumber} onChange={setOutFromNumber} placeholder="+1415xxxxxxx" />

                          {['twilio', 'vonage'].includes(outConnType) && (
                            <div className="space-y-3">
                              <Field label="Account SID / API Key" value={outSid} onChange={setOutSid} placeholder="ACxxx..." />
                              <Field label="Auth Token / API Secret" value={outToken} onChange={setOutToken} placeholder="xxx..." />
                            </div>
                          )}

                          {outConnType === 'livekit_sip' && (
                            <Field label="LiveKit Outbound SIP Trunk ID" value={outLkTrunk} onChange={setOutLkTrunk} placeholder="ST_xxxxxxxxxxxxxxxxxx" />
                          )}

                          <Field label="Not (opsiyonel)" value={outProviderNote} onChange={setOutProviderNote} placeholder="Hesap bilgileri, notlar..." mono={false} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── CRM TAB ── */}
              {activeTab === 'crm' && (
                <div className="space-y-5">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-500">
                    stoaix CRM her zaman aktif. Dış CRM entegrasyonu opsiyoneldir — seçilirse stoaix belirli eventlerde dış sisteme bildirim gönderir.
                  </div>

                  <div>
                    <SectionLabel>Dış CRM Provider</SectionLabel>
                    <RadioGroup options={CRM_PROVIDERS} value={crmProvider} onChange={v => setCrmProvider(v as CrmConfig['provider'])} />
                  </div>

                  {crmProvider === 'webhook' && (
                    <div className="space-y-4 pt-1 border-t border-slate-100">
                      <SectionLabel>Webhook Ayarları</SectionLabel>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Tetiklenecek Eventler</p>
                        <div className="space-y-2">
                          {CRM_EVENTS.map(ev => (
                            <label key={ev.key} className="flex items-center gap-2.5 cursor-pointer">
                              <input type="checkbox"
                                checked={crmEvents.includes(ev.key)}
                                onChange={e => setCrmEvents(prev =>
                                  e.target.checked ? [...prev, ev.key] : prev.filter(k => k !== ev.key)
                                )}
                                className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                              />
                              <span className="text-sm text-slate-700 font-mono text-xs">{ev.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <Field label="Webhook URL" value={crmWebhookUrl} onChange={setCrmWebhookUrl}
                        placeholder="https://yourcrm.com/webhooks/stoaix" mono={false} />
                      <Field label="Secret (opsiyonel)" value={crmWebhookSecret} onChange={setCrmWebhookSecret}
                        placeholder="whsec_..." hint="HMAC-SHA256 imza doğrulaması için. Header: X-Stoaix-Signature" />

                      <div className="flex items-center gap-3">
                        <button type="button" onClick={handleTestWebhook} disabled={!crmWebhookUrl || webhookTesting}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">
                          {webhookTesting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          Test Gönder
                        </button>
                        {webhookTestResult === 'ok' && (
                          <span className="flex items-center gap-1.5 text-xs text-green-600">
                            <CheckCircle2 size={13} /> Webhook ulaştı
                          </span>
                        )}
                        {webhookTestResult === 'fail' && (
                          <span className="text-xs text-red-500">Webhook ulaşamadı — URL ve firewall'ı kontrol edin</span>
                        )}
                      </div>
                    </div>
                  )}

                  {crmProvider === 'dentsoft' && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <SectionLabel>Dentsoft API Bilgileri</SectionLabel>
                      <Field label="API URL" value={dsApiUrl} onChange={setDsApiUrl} placeholder="https://clinicadi.dentsoft.com.tr" mono={false} />
                      <Field label="API Key" value={dsApiKey} onChange={setDsApiKey} placeholder="Bearer token..." />
                      <Field label="Klinik ID" value={dsClinicId} onChange={setDsClinicId} placeholder="klinik_id" />
                    </div>
                  )}
                </div>
              )}

              {/* ── CALENDAR TAB ── */}
              {activeTab === 'calendar' && (
                <div className="space-y-5">
                  <div>
                    <SectionLabel>Randevu / Takvim Provider</SectionLabel>
                    <RadioGroup options={CALENDAR_PROVIDERS} value={calProvider} onChange={v => setCalProvider(v as CalendarConfig['provider'])} />
                  </div>

                  {calProvider === 'google' && (
                    <div className="space-y-4 pt-1 border-t border-slate-100">
                      <SectionLabel>Google Takvim</SectionLabel>

                      {calGoogleConnected ? (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                          <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Google Takvim bağlı</p>
                            {calGoogleExpiry && (
                              <p className="text-xs text-green-600 mt-0.5">Token geçerliliği: {new Date(calGoogleExpiry).toLocaleDateString('tr-TR')}</p>
                            )}
                          </div>
                          <button type="button" onClick={handleGoogleConnect}
                            className="ml-auto text-xs text-green-700 underline hover:text-green-900">
                            Yeniden bağla
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-slate-500">Google Takvim'i bağlamak için OAuth akışını başlatın.</p>
                          <button type="button" onClick={handleGoogleConnect}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                            <Calendar size={15} className="text-brand-500" />
                            Google Takvim Bağla
                          </button>
                        </div>
                      )}

                      <Field label="Takvim ID (opsiyonel)" value={calCalendarId} onChange={setCalCalendarId}
                        placeholder="primary" hint="Boş bırakılırsa varsayılan takvim kullanılır" />
                    </div>
                  )}

                  {calProvider === 'dentsoft' && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <SectionLabel>Dentsoft Takvim Bilgileri</SectionLabel>
                      <p className="text-xs text-slate-500">
                        Dentsoft takvim entegrasyonu Bearer Token ile calisiyor. Musteriler Entegrasyonlar sayfasindan da baglayabilir.
                      </p>
                      <Field label="API URL" value={calDsApiUrl} onChange={setCalDsApiUrl} placeholder="https://clinicadi.dentsoft.com.tr" mono={false} />
                      <Field label="API Key" value={calDsApiKey} onChange={setCalDsApiKey} placeholder="Bearer token..." />
                      <Field label="Klinik ID" value={calDsClinicId} onChange={setCalDsClinicId} placeholder="klinik_id" />
                    </div>
                  )}
                </div>
              )}

              {/* ── FORMS TAB ── */}
              {activeTab === 'forms' && (
                <div className="space-y-5">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-500">
                    Website form webhook ile müşteri web sitesindeki formlar platforma bağlanır. Form gönderildiğinde otomatik lead oluşturulur.
                  </div>

                  {/* Active toggle */}
                  <div>
                    <SectionLabel>Durum</SectionLabel>
                    <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Web Form Webhook</p>
                        <p className="text-xs text-slate-400">Form gönderimlerini otomatik lead'e dönüştür</p>
                      </div>
                      <Toggle active={formsActive} onToggle={() => setFormsActive(v => !v)} />
                    </div>
                  </div>

                  {formsActive && (
                    <>
                      {/* API Key */}
                      <div>
                        <SectionLabel>API Anahtarı</SectionLabel>
                        {formsApiKey ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 truncate">
                                {formsShowKey ? formsApiKey : formsApiKey.slice(0, 8) + '••••••••' + formsApiKey.slice(-4)}
                              </code>
                              <button type="button" onClick={() => setFormsShowKey(v => !v)} className="p-1.5 text-slate-400 hover:text-slate-600">
                                {formsShowKey ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button type="button" onClick={() => { navigator.clipboard.writeText(formsApiKey); setFormsCopied(true); setTimeout(() => setFormsCopied(false), 2000) }}
                                className="p-1.5 text-slate-400 hover:text-slate-600">
                                {formsCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              </button>
                            </div>
                            <p className="text-xs text-slate-400">
                              Webhook URL: <code className="font-mono">https://platform.stoaix.com/api/public/form-submit</code>
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            API anahtarı henüz oluşturulmamış. Müşteri Dashboard → Ayarlar → Form Webhook sekmesinden oluşturabilir.
                          </p>
                        )}
                      </div>

                      {/* Default Country Code */}
                      <div>
                        <SectionLabel>Varsayılan Ülke Kodu</SectionLabel>
                        <select value={formsDefaultCC} onChange={e => setFormsDefaultCC(e.target.value)}
                          className="w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                          {FORM_CC_OPTIONS.map(cc => (
                            <option key={cc.code} value={cc.code}>{cc.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Field Mapping */}
                      <div>
                        <SectionLabel>Alan Eşleştirme</SectionLabel>
                        <div className="space-y-2">
                          {formsMapping.map((m, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input value={m.formField} onChange={e => setFormsMapping(prev => prev.map((r, j) => j === i ? { ...r, formField: e.target.value } : r))}
                                placeholder="Form alan adı"
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                              <span className="text-slate-300 text-sm">→</span>
                              <select value={m.target} onChange={e => setFormsMapping(prev => prev.map((r, j) => j === i ? { ...r, target: e.target.value } : r))}
                                className="w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                                {FORM_MAPPING_TARGETS.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                              {formsMapping.length > 1 && (
                                <button type="button" onClick={() => setFormsMapping(prev => prev.filter((_, j) => j !== i))}
                                  className="p-1 text-slate-400 hover:text-red-500">
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => setFormsMapping(prev => [...prev, { formField: '', target: '' }])}
                          className="text-xs text-brand-600 hover:text-brand-700 mt-2 font-medium">
                          + Eşleştirme Ekle
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              {error ? <p className="text-sm text-red-600">{error}</p> : <span />}
              <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">İptal</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Kaydet
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
