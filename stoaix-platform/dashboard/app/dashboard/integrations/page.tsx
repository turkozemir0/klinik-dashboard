'use client'

import { useState, Suspense } from 'react'
import {
  Instagram, Plug, Ban,
} from 'lucide-react'
import TopBar from '@/components/TopBar'
import { IntegrationCard } from '@/components/integrations/IntegrationCard'
import { ConfigDrawer } from '@/components/integrations/ConfigDrawer'
import { WhatsAppConfig } from '@/components/integrations/WhatsAppConfig'
import { InstagramConfig } from '@/components/integrations/InstagramConfig'
import { CalendarConfig } from '@/components/integrations/CalendarConfig'
import { DentSoftConfig } from '@/components/integrations/DentSoftConfig'
import { ExcludedPhonesConfig } from '@/components/integrations/ExcludedPhonesConfig'
import { VoiceProviderConfig } from '@/components/integrations/VoiceProviderConfig'
import { VOICE_PROVIDERS, PROVIDER_LIST } from '@/lib/voice-providers'
import { useIsDemo } from '@/lib/demo-context'
import { useLang } from '@/lib/lang-context'
import {
  WhatsAppIcon,
  NetgsmIcon,
  VerimorIcon,
  TwilioIcon,
  TelnyxIcon,
  GoogleCalendarIcon,
  DentSoftIcon,
  HubSpotIcon,
  SalesforceIcon,
  PipedriveIcon,
  ZapierIcon,
  CalendlyIcon,
} from '@/components/integrations/ProviderIcons'

type DrawerId =
  | 'whatsapp'
  | 'instagram'
  | 'calendar'
  | 'dentsoft'
  | 'excluded-phones'
  | 'netgsm'
  | 'verimor'
  | 'twilio'
  | 'telnyx'
  | null

const VOICE_ICON_MAP: Record<string, React.ReactNode> = {
  netgsm: <NetgsmIcon size={24} />,
  verimor: <VerimorIcon size={24} />,
  twilio: <TwilioIcon size={24} />,
  telnyx: <TelnyxIcon size={24} />,
}

type CategoryKey = 'all' | 'channels' | 'calendar' | 'crm' | 'clinic_pms' | 'automation'

const SECTION_LABELS: Record<string, { tr: string; en: string }> = {
  channels: { tr: 'Kanallar', en: 'Channels' },
  voice: { tr: 'Ses / Sanal Santral', en: 'Voice / PBX' },
  calendar: { tr: 'Takvim', en: 'Calendar' },
  clinic_pms: { tr: 'Klinik PMS', en: 'Clinic PMS' },
  crm: { tr: 'CRM', en: 'CRM' },
  automation: { tr: 'Otomasyon', en: 'Automation' },
  other: { tr: 'Diğer', en: 'Other' },
}

export default function IntegrationsPage() {
  const isDemo = useIsDemo()
  const { lang } = useLang()
  const isTr = lang === 'tr'
  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null)

  function openDrawer(id: DrawerId) {
    if (isDemo) return
    setActiveDrawer(id)
  }

  // Status tracking for cards
  const [waStatus, setWaStatus] = useState<{ connected: boolean; label?: string }>({ connected: false })
  const [igStatus, setIgStatus] = useState<{ connected: boolean; label?: string }>({ connected: false })
  const [calStatus, setCalStatus] = useState<{ connected: boolean }>({ connected: false })
  const [dsStatus, setDsStatus] = useState<{ connected: boolean }>({ connected: false })
  const [voiceStatus, setVoiceStatus] = useState<Record<string, boolean>>({})
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')

  const categories: { key: CategoryKey; label: string }[] = [
    { key: 'all', label: isTr ? 'Tümü' : 'All' },
    { key: 'channels', label: isTr ? 'Kanallar' : 'Channels' },
    { key: 'calendar', label: isTr ? 'Takvim' : 'Calendar' },
    { key: 'crm', label: 'CRM' },
    { key: 'clinic_pms', label: isTr ? 'Klinik PMS' : 'Clinic PMS' },
    { key: 'automation', label: isTr ? 'Otomasyon' : 'Automation' },
  ]

  function sectionTitle(key: string) {
    return SECTION_LABELS[key]?.[lang] ?? key
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <TopBar
        title={isTr ? 'Entegrasyonlar' : 'Integrations'}
        subtitle={isTr ? 'Üçüncü parti bağlantılar' : 'Third-party connections'}
      />

      {/* Category filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Channels — Messaging ─────────────────────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'channels') && <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {sectionTitle('channels')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Suspense fallback={<CardSkeleton />}>
            <IntegrationCard
              icon={<WhatsAppIcon size={24} />}
              name="WhatsApp API"
              description={isTr ? 'Sadece API üzerinden bağlantı (Manuel)' : 'API-only connection (Manual)'}
              helperText={isTr ? 'Meta Business Suite\'ten Phone Number ID ve Access Token ile bağlanın.' : 'Connect with Phone Number ID and Access Token from Meta Business Suite.'}
              category="channels"
              status={waStatus.connected ? 'connected' : 'disconnected'}
              statusLabel={waStatus.label}
              onClick={() => openDrawer('whatsapp')}
            />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <IntegrationCard
              icon={<WhatsAppIcon size={24} />}
              name="WhatsApp Business"
              description={isTr ? 'Telefonunuzda ve platform üzerinde tam kontrol' : 'Full control on your phone and platform'}
              helperText={isTr ? 'Meta Embedded Signup ile tek tıkla bağlantı.' : 'One-click connection via Meta Embedded Signup.'}
              badge={isTr ? '1 hafta sonra' : 'In 1 week'}
              category="channels"
              status="coming_soon"
            />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <IntegrationCard
              icon={<Instagram size={24} className="text-pink-500" />}
              name="Instagram DM"
              description={isTr ? 'Instagram Direct mesajları' : 'Instagram Direct messages'}
              category="channels"
              status={igStatus.connected ? 'connected' : 'disconnected'}
              statusLabel={igStatus.label}
              onClick={() => openDrawer('instagram')}
            />
          </Suspense>
        </div>
      </section>}

      {/* ── Channels — Voice / PBX ──────────────────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'channels') && <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {sectionTitle('voice')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROVIDER_LIST.map((p) => (
            <IntegrationCard
              key={p.id}
              icon={VOICE_ICON_MAP[p.id]}
              name={p.name}
              description={p.description}
              category="channels"
              status={voiceStatus[p.id] ? 'connected' : 'disconnected'}
              onClick={() => openDrawer(p.id)}
            />
          ))}
        </div>
      </section>}

      {/* ── Calendar ─────────────────────────────────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'calendar') && <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {sectionTitle('calendar')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Suspense fallback={<CardSkeleton />}>
            <IntegrationCard
              icon={<GoogleCalendarIcon size={24} />}
              name="Google Takvim"
              description={isTr ? 'Randevu yönetimi' : 'Appointment management'}
              category="calendar"
              status={calStatus.connected ? 'connected' : 'disconnected'}
              onClick={() => openDrawer('calendar')}
            />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <IntegrationCard
              icon={<CalendlyIcon size={24} />}
              name="Calendly"
              description={isTr ? 'Online randevu planlama' : 'Online appointment scheduling'}
              category="calendar"
              status="coming_soon"
            />
          </Suspense>
        </div>
      </section>}

      {/* ── Clinic PMS ───────────────────────────────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'clinic_pms') && <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {sectionTitle('clinic_pms')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Suspense fallback={<CardSkeleton />}>
            <IntegrationCard
              icon={<DentSoftIcon size={24} />}
              name="DentSoft"
              description={isTr ? 'Diş kliniği takvim entegrasyonu' : 'Dental clinic calendar integration'}
              category="clinic_pms"
              status={dsStatus.connected ? 'connected' : 'disconnected'}
              onClick={() => openDrawer('dentsoft')}
            />
          </Suspense>
        </div>
      </section>}

      {/* ── CRM ──────────────────────────────────────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'crm') && <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          CRM
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard
            icon={<HubSpotIcon size={24} />}
            name="HubSpot"
            description={isTr ? 'CRM, pazarlama ve satış otomasyonu' : 'CRM, marketing & sales automation'}
            category="crm"
            status="coming_soon"
          />
          <IntegrationCard
            icon={<SalesforceIcon size={24} />}
            name="Salesforce"
            description={isTr ? 'Kurumsal CRM ve müşteri yönetimi' : 'Enterprise CRM & customer management'}
            category="crm"
            status="coming_soon"
          />
          <IntegrationCard
            icon={<PipedriveIcon size={24} />}
            name="Pipedrive"
            description={isTr ? 'Satış pipeline ve anlaşma yönetimi' : 'Sales pipeline & deal management'}
            category="crm"
            status="coming_soon"
          />
        </div>
      </section>}

      {/* ── Automation ───────────────────────────────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'automation') && <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {sectionTitle('automation')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard
            icon={<ZapierIcon size={24} />}
            name="Zapier"
            description={isTr ? '5.000+ uygulama ile otomasyon bağlantısı' : 'Automation with 5,000+ apps'}
            category="automation"
            status="coming_soon"
          />
        </div>
      </section>}

      {/* ── Other ────────────────────────────────────────────────── */}
      {activeCategory === 'all' && <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {sectionTitle('other')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard
            icon={<Ban size={24} className="text-slate-500" />}
            name={isTr ? 'Hariç Numaralar' : 'Excluded Numbers'}
            description={isTr ? 'AI yanıt vermesin istediğiniz numaralar' : 'Numbers you want the AI to skip'}
            category="other"
            status="disconnected"
            onClick={() => openDrawer('excluded-phones')}
          />
        </div>
      </section>}

      {/* ── Drawer'lar ────────────────────────────────────────────── */}

      <ConfigDrawer
        open={activeDrawer === 'whatsapp'}
        onClose={() => setActiveDrawer(null)}
        title="WhatsApp API"
        icon={<WhatsAppIcon size={18} />}
      >
        <Suspense fallback={<DrawerSkeleton />}>
          <WhatsAppConfig
            onStatusChange={(c, phone) => setWaStatus({ connected: c, label: phone ? `${isTr ? 'Bağlı' : 'Connected'} — ${phone}` : undefined })}
          />
        </Suspense>
      </ConfigDrawer>

      <ConfigDrawer
        open={activeDrawer === 'instagram'}
        onClose={() => setActiveDrawer(null)}
        title="Instagram DM"
        icon={<Instagram size={18} className="text-pink-500" />}
      >
        <Suspense fallback={<DrawerSkeleton />}>
          <InstagramConfig
            onStatusChange={(c, username) => setIgStatus({ connected: c, label: username ? `@${username}` : undefined })}
          />
        </Suspense>
      </ConfigDrawer>

      <ConfigDrawer
        open={activeDrawer === 'calendar'}
        onClose={() => setActiveDrawer(null)}
        title="Google Takvim"
        icon={<GoogleCalendarIcon size={18} />}
      >
        <Suspense fallback={<DrawerSkeleton />}>
          <CalendarConfig
            onStatusChange={(c) => setCalStatus({ connected: c })}
          />
        </Suspense>
      </ConfigDrawer>

      <ConfigDrawer
        open={activeDrawer === 'dentsoft'}
        onClose={() => setActiveDrawer(null)}
        title="DentSoft"
        icon={<DentSoftIcon size={18} />}
      >
        <Suspense fallback={<DrawerSkeleton />}>
          <DentSoftConfig
            onStatusChange={(c) => setDsStatus({ connected: c })}
          />
        </Suspense>
      </ConfigDrawer>

      <ConfigDrawer
        open={activeDrawer === 'excluded-phones'}
        onClose={() => setActiveDrawer(null)}
        title={isTr ? 'Hariç Numaralar' : 'Excluded Numbers'}
        icon={<Ban size={18} className="text-slate-500" />}
      >
        <ExcludedPhonesConfig />
      </ConfigDrawer>

      {PROVIDER_LIST.map((p) => (
        <ConfigDrawer
          key={p.id}
          open={activeDrawer === p.id}
          onClose={() => setActiveDrawer(null)}
          title={p.name}
          icon={VOICE_ICON_MAP[p.id]}
        >
          <VoiceProviderConfig
            provider={p}
            onStatusChange={(c) => setVoiceStatus((prev) => ({ ...prev, [p.id]: c }))}
          />
        </ConfigDrawer>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-slate-100" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 bg-slate-100 rounded w-24" />
          <div className="h-2.5 bg-slate-50 rounded w-36" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="h-2.5 bg-slate-50 rounded w-16" />
      </div>
    </div>
  )
}

function DrawerSkeleton() {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
      <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
      {/* Always Turkish here since it's a quick loading state */}
      Yükleniyor...
    </div>
  )
}
