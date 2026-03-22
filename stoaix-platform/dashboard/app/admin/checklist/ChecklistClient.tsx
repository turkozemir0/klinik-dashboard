'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Org {
  id: string
  name: string
  slug: string
  sector: string
  status: string
}

interface CheckItem {
  id: string
  label: string
  note?: string
  code?: string
  voiceOnly?: boolean
}

interface Phase {
  title: string
  items: CheckItem[]
}

// ─── Checklist Definition ─────────────────────────────────────────────────────

const PHASES: Phase[] = [
  {
    title: '1 — Platform Kurulumu',
    items: [
      { id: 'p1', label: 'Admin panelinden "Yeni Müşteri Ekle" yapıldı → org + invite token oluşturuldu' },
      { id: 'p2', label: 'Müşteri invite link ile register oldu' },
      { id: 'p3', label: 'Müşteri onboarding\'i tamamladı (işletme bilgileri, hizmetler, SSS, ek bilgiler)' },
      {
        id: 'p4',
        label: 'Agent Playbook kontrol edildi / AI persona güncellendi',
        note: 'Dashboard → AI Asistan → Chat sekmesinden sistem promptu ve persona ayarla',
      },
      {
        id: 'p5',
        label: 'Randevu özelliği açılacaksa: GHL\'de takvim oluşturuldu ve Calendar ID admin paneline girildi',
        note: 'Admin paneli → org ⚙ → CRM sekmesi → Calendar ID\nGHL → Calendars → Takvim seç → Settings → Calendar ID\nArdından Dashboard → AI Asistan → Özellikler → Randevu Alma toggle\'ını aç',
      },
    ],
  },
  {
    title: '2 — GHL Kurulumu',
    items: [
      { id: 'g1', label: 'GHL\'de müşteri için yeni sub-account açıldı' },
      {
        id: 'g2',
        label: 'GHL Snapshot import edildi (7 aşamalı pipeline + inbound webhook workflow)',
        note: 'GHL → Settings → Snapshots → "stoaix Standart" snapshot\'ı import et',
      },
      {
        id: 'g3',
        label: 'WhatsApp Business hesabı GHL sub-account\'a QR ile bağlandı',
        note: 'GHL → Settings → Integrations → WhatsApp → QR kodunu müşteriye gönder',
      },
      { id: 'g4', label: 'Instagram hesabı bağlandı (opsiyonel)' },
      {
        id: 'g5',
        label: 'crm_config Supabase\'e girildi (location_id, pit_token, pipeline_id, stage_mapping)',
        note: 'Admin paneli → /admin → org satırındaki ⚙ butonu → CRM sekmesi\nLocation ID: GHL → Settings → Business Profile\nPIT Token: GHL → Settings → Integrations → Private Integration Token\n\nStage Mapping — GHL\'deki karşılık gelen Stage ID\'leri gir:\n• new → ilk gelen lead aşaması\n• in_progress → görüşme başladı\n• qualified → bilgiler toplandı\n• handed_off → insan danışmana devredildi\n• converted → satış kapandı\n• lost → ilgilenmedi / kaybedildi\nGHL Stage ID: GHL → Pipelines → Aşama üzerine gel → ID\'yi kopyala',
      },
      {
        id: 'g6',
        label: 'GHL Inbound Webhook URL edge function\'a yönlendirildi',
        note: 'GHL Workflow → Trigger: "Customer Replied" → Action: Webhook POST',
        code: `https://ablntzdbsrzbqyrnfwpl.supabase.co/functions/v1/whatsapp-inbound`,
      },
      {
        id: 'g7',
        label: '✓ Test: WhatsApp\'tan mesaj gönderildi → chatbot 3–5 sn içinde yanıtladı',
        note: 'Konuşma Dashboard → Conversations\'ta görünmeli',
      },
    ],
  },
  {
    title: '3 — Follow-up & Re-engagement (n8n)',
    items: [
      {
        id: 'f1',
        label: 'n8n WF_followup_sequence "Active" durumda',
        note: 'Tek workflow tüm org\'lar için çalışıyor — zaten aktifse tekrar ayar gerekmez',
      },
      {
        id: 'f2',
        label: 'GHL Re-engagement Workflow kuruldu',
        note: 'GHL → Automations → New Workflow\nTrigger: "Tag Added" → tag = "reengagement"\nAction: Webhook POST → n8n WF_reengagement_import URL',
        code: `n8n WF_reengagement_import → "GHL Webhook" node → webhook URL'i kopyala`,
      },
      {
        id: 'f3',
        label: '✓ Test: GHL\'de bir contact\'a "reengagement" tag\'i ekle → Supabase follow_up_tasks\'ta re_contact_1 task oluştu mu?',
      },
    ],
  },
  {
    title: '4 — Voice Agent',
    items: [
      {
        id: 'v1',
        label: 'Türk telefon numarası alındı (Netgsm / Verimor / Twilio)',
        note: 'Seçenekler:\n• Netgsm — panel.netgsm.com.tr → Sanal Santral → Yeni Hat\n• Verimor — verimor.com.tr → IP Santral → Hat Ekle\n• Twilio — console.twilio.com → Phone Numbers → Buy (+90 numara)\n\nNot: Müşterinin mevcut numarası taşınacaksa sağlayıcının numara taşıma sürecini başlat.',
        voiceOnly: true,
      },
      {
        id: 'v2',
        label: 'LiveKit Cloud\'da Inbound SIP Trunk oluşturuldu',
        note: 'LiveKit Cloud → SIP → Inbound Trunks → "+ Add Trunk"\n• Name: müşteri adı (örn. "Eurostar Inbound")\n• Allowed Addresses: sağlayıcının SIP sunucu IP\'leri (güvenlik için önerilir)\n  - Netgsm:  212.252.xxx.xxx  (panel → SIP sunucu IP\'si)\n  - Verimor: sip.verimor.com.tr → nslookup ile IP al\n  - Twilio:  54.172.60.0/30 ve 54.244.51.0/30\n• Auth (opsiyonel): Username/Password ile kimlik doğrulama\n\nKaydedince Trunk ID (ST_xxx) oluşur — not al.',
        voiceOnly: true,
      },
      {
        id: 'v2b',
        label: 'Sanal santral → LiveKit SIP yönlendirmesi yapıldı',
        note: 'LiveKit Cloud → Settings → SIP → SIP URI kısmını not al.\nFormat: sip:<numara>@<livekit-sip-endpoint>\n\n── Netgsm ──\nPanel → Sanal Santral → SIP Trunk → Yönlendirme\nHedef SIP Sunucu: <livekit-sip-endpoint>\nPort: 5060   Protokol: UDP\n\n── Verimor ──\nPanel → IP Santral → Trunk Ayarları → Outbound Route\nSIP Server: <livekit-sip-endpoint>:5060\n\n── Twilio ──\nConsole → Elastic SIP Trunking → Trunk → Origination\n"+ Add new Origination URI"\nSIP URI: sip:<livekit-sip-endpoint>;transport=udp\nPriority: 10, Weight: 10\n\n── Genel kural ──\nSağlayıcı numaraya gelen aramayı LiveKit SIP endpoint\'ine INVITE gönderir.\nLiveKit From header\'ından arayan numarayı otomatik okur (+90xxx formatında).',
        voiceOnly: true,
      },
      {
        id: 'v3',
        label: 'LiveKit Dispatch Rule oluşturuldu ve admin paneline girildi',
        note: 'LiveKit Cloud → SIP → Dispatch Rules → "+ Add Rule"\n• Trunk: bir önceki adımda oluşturulan Inbound Trunk\'ı seç\n• Room: Agent Dispatch\n• Metadata: {"organization_id": "ORG_UUID"}   ← org\'un gerçek UUID\'si\nKaydedince Rule ID (SDR_xxx) oluşur.\n\nAdmin paneli → org satırındaki ⚙ → Ses/SIP sekmesi\n• Dispatch Rule ID (SDR_xxx): zorunlu\n• SIP Trunk ID (ST_xxx): opsiyonel — platform geneli shared trunk ise boş bırakılabilir',
        voiceOnly: true,
      },
      {
        id: 'v4',
        label: '✓ Test: Telefon numarasını ara → LiveKit agent yanıtladı, AI konuştu',
        note: 'Konuşma sonrası Dashboard → Çağrılar\'da kayıt görünmeli.\nContact, arayan numarayla eşleşmeli (anonymous DEĞİL).',
        voiceOnly: true,
      },
    ],
  },
]

// ─── Helper: copy to clipboard ────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
      title="Kopyala"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChecklistClient({ orgs }: { orgs: Org[] }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [track, setTrack]                 = useState<'chatbot' | 'voice'>('chatbot')
  const [checked, setChecked]             = useState<Record<string, boolean>>({})
  const [expanded, setExpanded]           = useState<Record<string, boolean>>({ '0': true })

  // Load saved state from localStorage
  useEffect(() => {
    if (!selectedOrgId) return
    const key = `checklist_${selectedOrgId}_${track}`
    const saved = localStorage.getItem(key)
    setChecked(saved ? JSON.parse(saved) : {})
  }, [selectedOrgId, track])

  // Save to localStorage on change
  function toggle(itemId: string) {
    const next = { ...checked, [itemId]: !checked[itemId] }
    setChecked(next)
    if (selectedOrgId) {
      localStorage.setItem(`checklist_${selectedOrgId}_${track}`, JSON.stringify(next))
    }
  }

  function togglePhase(idx: number) {
    setExpanded(p => ({ ...p, [idx]: !p[idx] }))
  }

  // Progress
  const visiblePhases = track === 'voice' ? PHASES : PHASES.slice(0, 3)
  const allItems = visiblePhases.flatMap(ph =>
    ph.items.filter(item => track === 'voice' || !item.voiceOnly)
  )
  const doneCount  = allItems.filter(item => checked[item.id]).length
  const totalCount = allItems.length
  const pct        = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const selectedOrg = orgs.find(o => o.id === selectedOrgId)

  return (
    <div className="p-6 max-w-3xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Yeni Müşteri Kurulum Checklist</h1>
        <p className="text-sm text-slate-500 mt-0.5">Her yeni müşteri için bu adımları sırayla tamamla</p>
      </div>

      {/* Org + Track selector */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Müşteri</label>
          <select
            value={selectedOrgId}
            onChange={e => setSelectedOrgId(e.target.value)}
            className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">— Müşteri seç —</option>
            {orgs.map(org => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.sector})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paket</label>
          <div className="flex gap-2 mt-1.5">
            {(['chatbot', 'voice'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTrack(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  track === t
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {t === 'chatbot' ? '💬 Chatbot' : '💬 Chatbot + 🎙 Voice'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress */}
      {selectedOrgId && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">
              {selectedOrg?.name} — İlerleme
            </span>
            <span className="text-sm font-bold text-brand-600">{doneCount} / {totalCount}</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{pct}% tamamlandı</p>
        </div>
      )}

      {/* Checklist Phases */}
      {visiblePhases.map((phase, phaseIdx) => {
        const phaseItems = phase.items.filter(i => track === 'voice' || !i.voiceOnly)
        const phaseDone  = phaseItems.filter(i => checked[i.id]).length
        const isOpen     = expanded[phaseIdx] !== false

        return (
          <div key={phaseIdx} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Phase header */}
            <button
              onClick={() => togglePhase(phaseIdx)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  phaseDone === phaseItems.length
                    ? 'bg-green-100 text-green-600'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {phaseDone === phaseItems.length ? '✓' : phaseIdx + 1}
                </span>
                <span className="text-sm font-semibold text-slate-800">{phase.title}</span>
                <span className="text-xs text-slate-400">{phaseDone}/{phaseItems.length}</span>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {/* Phase items */}
            {isOpen && (
              <div className="divide-y divide-slate-50 border-t border-slate-50">
                {phaseItems.map(item => (
                  <div
                    key={item.id}
                    className={`px-5 py-4 space-y-2 transition-colors ${checked[item.id] ? 'bg-green-50/40' : ''}`}
                  >
                    <button
                      onClick={() => selectedOrgId && toggle(item.id)}
                      disabled={!selectedOrgId}
                      className="flex items-start gap-3 w-full text-left group"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {checked[item.id]
                          ? <CheckCircle2 size={18} className="text-green-500" />
                          : <Circle size={18} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                        }
                      </div>
                      <span className={`text-sm ${checked[item.id] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {item.label}
                      </span>
                    </button>

                    {item.note && (
                      <p className="ml-7 text-xs text-slate-400 whitespace-pre-line">{item.note}</p>
                    )}

                    {item.code && (
                      <div className="ml-7">
                        <div className="relative bg-slate-900 rounded-lg p-3 pr-8">
                          <pre className="text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap">{item.code}</pre>
                          <div className="absolute top-2 right-2">
                            <CopyButton text={item.code} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Not ready warning */}
      {!selectedOrgId && (
        <div className="text-center py-4 text-sm text-slate-400">
          Üstten bir müşteri seç, checklist ona özel kaydedilir.
        </div>
      )}

      {/* System notes */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-2">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">⚠ Manuel gerektiren adımlar</p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li><strong>crm_config</strong> — Admin paneli → org satırındaki ⚙ butonu → CRM sekmesinden formla doldurulur.</li>
          <li><strong>Voice agent org config</strong> — Admin paneli → ⚙ → Ses/SIP sekmesinden LiveKit Dispatch Rule ID ve Trunk ID girilir.</li>
          <li><strong>GHL Snapshot</strong> — GHL tarafında bir kez manuel import gerekiyor (GHL'nin kendi özelliği).</li>
        </ul>
      </div>

    </div>
  )
}
