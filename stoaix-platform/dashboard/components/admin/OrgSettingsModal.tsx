'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, Phone, MessageSquare, Instagram } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoiceInboundConfig {
  active: boolean
  inbound_number?: string          // arayanların çevirdiği numara (DID)
  connection_type?: 'direct_sip' | 'twilio_bridge' | 'vonage_bridge' | 'other'
  // direct_sip
  sip_provider?: string            // 'netgsm' | 'verimor' | 'other'
  sip_provider_note?: string       // serbest not
  // twilio / vonage bridge
  bridge_number?: string           // köprü numarası (Twilio'dan alınan)
  bridge_account_sid?: string
  bridge_auth_token?: string
  bridge_twiml_url?: string
  // LiveKit
  livekit_dispatch_rule_id?: string
  livekit_sip_trunk_id?: string
}

interface VoiceOutboundConfig {
  active: boolean
  connection_type?: 'twilio' | 'vonage' | 'livekit_sip' | 'other'
  from_number?: string             // giden aramalar için kaynak numara
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

interface ChannelConfig {
  voice_inbound:  VoiceInboundConfig
  voice_outbound: VoiceOutboundConfig
  whatsapp:       WhatsAppChannelConfig
  instagram:      { active: boolean; provider?: string; credentials?: Record<string, string> }
}

interface CrmConfig {
  provider: string
  location_id?: string
  pit_token?: string
  pipeline_id?: string
  calendar_id?: string
  stage_mapping?: Record<string, string>
  access_token?: string
  hubspot_pipeline_id?: string
  webhook_url?: string
  webhook_secret?: string
}

interface OrgDetail {
  id: string
  name: string
  channel_config: ChannelConfig
  crm_config: CrmConfig
}

interface Props {
  orgId: string
  orgName: string
  onClose: () => void
  onSaved: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WA_PROVIDERS = [
  { value: 'ghl',            label: 'GoHighLevel (WAGHL)',    desc: 'CRM sekmesindeki credentials kullanılır' },
  { value: 'whatsapp_cloud', label: 'WhatsApp Cloud API',     desc: 'Meta resmi API' },
  { value: 'wati',           label: 'WATI',                   desc: 'WATI Business API' },
  { value: 'twilio',         label: 'Twilio WhatsApp',        desc: 'Twilio Messaging' },
]

const CRM_PROVIDERS = [
  { value: 'none',           label: 'Yok (Platform mini-CRM)', desc: 'Sadece stoaix dashboard' },
  { value: 'ghl',            label: 'GoHighLevel',              desc: 'Pipeline + contact sync' },
  { value: 'hubspot',        label: 'HubSpot',                  desc: 'Deal pipeline + contact sync' },
  { value: 'custom_webhook', label: 'Custom Webhook',           desc: 'Kendi CRM\'ine webhook' },
]

const CRM_STAGES = [
  { key: 'new_lead',           label: 'New Lead' },
  { key: 'ai_qualifying',      label: 'AI Qualifying' },
  { key: 'hot_lead',           label: '🔥 Hot Lead / Handoff' },
  { key: 'nurturing',          label: '⏳ Nurturing' },
  { key: 'appointment_booked', label: '📅 Appointment Booked' },
  { key: 'won',                label: '✅ Won' },
  { key: 'lost',               label: '❌ Lost / Archive' },
] as const

const INBOUND_CONNECTION_TYPES = [
  { value: 'direct_sip',    label: 'Direkt SIP',         desc: 'NETGSM/Verimor/başka Sanal Santral → LiveKit doğrudan' },
  { value: 'twilio_bridge', label: 'Twilio Köprüsü',     desc: 'Twilio numarası üzerinden köprüleme' },
  { value: 'vonage_bridge', label: 'Vonage Köprüsü',     desc: 'Vonage (Türk numara desteği var)' },
  { value: 'other',         label: 'Diğer',               desc: 'Başka SIP provider' },
]

const OUTBOUND_CONNECTION_TYPES = [
  { value: 'twilio',          label: 'Twilio',           desc: 'Twilio Programmable Voice' },
  { value: 'vonage',          label: 'Vonage',           desc: 'Vonage Voice API' },
  { value: 'livekit_sip',     label: 'LiveKit SIP',      desc: 'LiveKit outbound SIP trunk' },
  { value: 'other',           label: 'Diğer',            desc: 'Başka provider' },
]

const TABS = [
  { key: 'channels', label: 'Kanallar & Mesajlaşma' },
  { key: 'sip',      label: 'Ses / SIP' },
  { key: 'crm',      label: 'CRM' },
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
  const [activeTab, setActiveTab] = useState<'channels' | 'sip' | 'crm'>('channels')

  // ── Channels state ──
  const [waActive, setWaActive]       = useState(false)
  const [waProvider, setWaProvider]   = useState('ghl')
  const [waCreds, setWaCreds]         = useState<Record<string, string>>({})
  const [igActive, setIgActive]       = useState(false)

  // ── Inbound SIP state ──
  const [inbActive, setInbActive]           = useState(false)
  const [inbNumber, setInbNumber]           = useState('')
  const [inbConnType, setInbConnType]       = useState<string>('direct_sip')
  const [inbSipProvider, setInbSipProvider] = useState('')
  const [inbSipNote, setInbSipNote]         = useState('')
  const [inbBridgeNumber, setInbBridgeNumber] = useState('')
  const [inbBridgeSid, setInbBridgeSid]     = useState('')
  const [inbBridgeToken, setInbBridgeToken] = useState('')
  const [inbBridgeTwiml, setInbBridgeTwiml] = useState('')
  const [inbLkDispatch, setInbLkDispatch]   = useState('')
  const [inbLkTrunk, setInbLkTrunk]         = useState('')

  // ── Outbound SIP state ──
  const [outActive, setOutActive]           = useState(false)
  const [outConnType, setOutConnType]       = useState<string>('twilio')
  const [outFromNumber, setOutFromNumber]   = useState('')
  const [outSid, setOutSid]                 = useState('')
  const [outToken, setOutToken]             = useState('')
  const [outLkTrunk, setOutLkTrunk]         = useState('')
  const [outProviderNote, setOutProviderNote] = useState('')

  // ── CRM state ──
  const [crmProvider, setCrmProvider]       = useState('none')
  const [ghlLocationId, setGhlLocationId]   = useState('')
  const [ghlPitToken, setGhlPitToken]       = useState('')
  const [ghlPipelineId, setGhlPipelineId]   = useState('')
  const [ghlCalendarId, setGhlCalendarId]   = useState('')
  const [ghlStages, setGhlStages]           = useState<Record<string, string>>(
    Object.fromEntries(CRM_STAGES.map(s => [s.key, '']))
  )
  const [hsToken, setHsToken]               = useState('')
  const [hsPipeline, setHsPipeline]         = useState('')
  const [cwUrl, setCwUrl]                   = useState('')
  const [cwSecret, setCwSecret]             = useState('')

  // ── Load ──
  useEffect(() => {
    fetch(`/api/admin/orgs/${orgId}`).then(r => r.json()).then((data: OrgDetail) => {
      const cc = (data.channel_config ?? {}) as Partial<ChannelConfig>

      // channels
      setWaActive(cc.whatsapp?.active ?? false)
      setWaProvider(cc.whatsapp?.provider ?? 'ghl')
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

      // outbound
      const out = cc.voice_outbound as VoiceOutboundConfig | undefined
      setOutActive(out?.active ?? false)
      setOutConnType(out?.connection_type ?? 'twilio')
      setOutFromNumber(out?.from_number ?? '')
      setOutSid(out?.account_sid ?? '')
      setOutToken(out?.auth_token ?? '')
      setOutLkTrunk(out?.livekit_sip_outbound_trunk_id ?? '')
      setOutProviderNote(out?.provider_note ?? '')

      // crm
      const crm = (data.crm_config ?? { provider: 'none' }) as CrmConfig
      setCrmProvider(crm.provider ?? 'none')
      setGhlLocationId(crm.location_id ?? '')
      setGhlPitToken(crm.pit_token ?? '')
      setGhlPipelineId(crm.pipeline_id ?? '')
      setGhlCalendarId(crm.calendar_id ?? '')
      setGhlStages(Object.fromEntries(CRM_STAGES.map(s => [s.key, crm.stage_mapping?.[s.key] ?? ''])))
      setHsToken(crm.access_token ?? '')
      setHsPipeline(crm.hubspot_pipeline_id ?? '')
      setCwUrl(crm.webhook_url ?? '')
      setCwSecret(crm.webhook_secret ?? '')

      setLoading(false)
    }).catch(() => { setError('Org yüklenemedi'); setLoading(false) })
  }, [orgId])

  // ── Save ──
  async function handleSave() {
    setSaving(true); setError('')

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

    const channelConfig: ChannelConfig = {
      voice_inbound: voiceInbound,
      voice_outbound: voiceOutbound,
      whatsapp: waActive ? { active: true, provider: waProvider, credentials: waCreds } : { active: false },
      instagram: { active: igActive },
    }

    let crmConfig: CrmConfig = { provider: crmProvider }
    if (crmProvider === 'ghl') {
      crmConfig = {
        provider: 'ghl',
        location_id: ghlLocationId.trim(),
        pit_token: ghlPitToken.trim(),
        pipeline_id: ghlPipelineId.trim(),
        ...(ghlCalendarId.trim() && { calendar_id: ghlCalendarId.trim() }),
        stage_mapping: Object.fromEntries(
          CRM_STAGES.map(s => [s.key, ghlStages[s.key]?.trim()]).filter(([, v]) => v)
        ),
      }
    } else if (crmProvider === 'hubspot') {
      crmConfig = { provider: 'hubspot', access_token: hsToken.trim(), hubspot_pipeline_id: hsPipeline.trim() }
    } else if (crmProvider === 'custom_webhook') {
      crmConfig = { provider: 'custom_webhook', webhook_url: cwUrl.trim(), webhook_secret: cwSecret.trim() }
    }

    const res = await fetch(`/api/admin/orgs/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_config: channelConfig, crm_config: crmConfig }),
    })

    if (!res.ok) { const d = await res.json(); setError(d.error || 'Kayıt başarısız'); setSaving(false); return }
    setSaving(false); onSaved(); onClose()
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
                          {waProvider === 'ghl' && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
                              GHL kanalı için kimlik bilgileri <strong>CRM</strong> sekmesindeki GHL ayarlarından alınır.
                            </div>
                          )}
                          {waProvider === 'whatsapp_cloud' && (
                            <div className="space-y-3">
                              <Field label="Phone Number ID" value={waCreds.phone_number_id ?? ''} onChange={v => setWaCreds(c => ({ ...c, phone_number_id: v }))} placeholder="123456789012345" />
                              <Field label="Access Token" value={waCreds.access_token ?? ''} onChange={v => setWaCreds(c => ({ ...c, access_token: v }))} placeholder="EAAx..." />
                              <Field label="Webhook Verify Token" value={waCreds.verify_token ?? ''} onChange={v => setWaCreds(c => ({ ...c, verify_token: v }))} placeholder="stoaix_verify_xyz" />
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
                        <p className="text-xs text-slate-400">GHL üzerinden veya Instagram Messaging API</p>
                      </div>
                      <Toggle active={igActive} onToggle={() => setIgActive(v => !v)} />
                    </div>
                    {igActive && (
                      <p className="text-xs text-slate-400 mt-2 px-1">GHL kullanan org'larda Instagram DM otomatik aktif — ayrıca credential gerekmez.</p>
                    )}
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
                  <div>
                    <SectionLabel>CRM Provider</SectionLabel>
                    <RadioGroup options={CRM_PROVIDERS} value={crmProvider} onChange={setCrmProvider} />
                  </div>

                  {crmProvider !== 'none' && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <SectionLabel>Pipeline Stage Eşleştirme</SectionLabel>
                      <p className="text-xs text-slate-400 -mt-2">Stoaix iç aşamalarını CRM'inizdeki ID/değerle eşleştirin.</p>
                      {CRM_STAGES.map(stage => (
                        <Field key={stage.key}
                          label={stage.label}
                          value={ghlStages[stage.key] ?? ''} onChange={v => setGhlStages(s => ({ ...s, [stage.key]: v }))}
                          placeholder={crmProvider === 'ghl' ? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' : 'stage_id veya değer'}
                        />
                      ))}
                    </div>
                  )}

                  {crmProvider === 'ghl' && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <SectionLabel>GHL Sub-Account Bilgileri</SectionLabel>
                      <Field label="Location ID"  value={ghlLocationId}  onChange={setGhlLocationId}  placeholder="X3qwbLZZb54GjqpOplS2" />
                      <Field label="PIT Token"    value={ghlPitToken}    onChange={setGhlPitToken}    placeholder="pit-xxxxxxxx-..." />
                      <Field label="Pipeline ID"  value={ghlPipelineId}  onChange={setGhlPipelineId}  placeholder="9DI3LIUinUSExbsELlhY" />
                      <Field label="Calendar ID (opsiyonel)" value={ghlCalendarId} onChange={setGhlCalendarId} placeholder="xxxxxxxxxxxxxxxx" hint="GHL → Calendars → takvim → Settings → Calendar ID — Randevu özelliği için gerekli" />
                    </div>
                  )}

                  {crmProvider === 'hubspot' && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <SectionLabel>HubSpot Bilgileri</SectionLabel>
                      <Field label="Private App Access Token" value={hsToken} onChange={setHsToken} placeholder="pat-eu1-xxx..." />
                      <Field label="Pipeline ID" value={hsPipeline} onChange={setHsPipeline} placeholder="default" mono={false} />
                    </div>
                  )}

                  {crmProvider === 'custom_webhook' && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <SectionLabel>Webhook Bilgileri</SectionLabel>
                      <Field label="Webhook URL" value={cwUrl} onChange={setCwUrl} placeholder="https://yourcrm.com/webhooks/stoaix" mono={false} />
                      <Field label="Secret (opsiyonel)" value={cwSecret} onChange={setCwSecret} placeholder="whsec_..." />
                    </div>
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
