'use client'

import { useState, useEffect } from 'react'
import {
  Rocket, ChevronDown, ChevronUp, Settings, ArrowRight, Clock,
  MessageCircle, Instagram, Phone, PhoneOutgoing, Calendar,
  AlertTriangle, CheckCircle2, Plug, Check,
} from 'lucide-react'
import Link from 'next/link'
import SetupStep from './SetupStep'

/* ── Types ──────────────────────────────────────────────── */

interface SetupStatus {
  business_info_complete: boolean
  has_kb_items: boolean
  has_channel: boolean
  has_playbook: boolean
  has_conversation: boolean
  kb_count: number
}

type ChannelStatus = 'connected' | 'missing_config' | 'not_configured' | 'token_expired'

interface ChannelHealth {
  status: ChannelStatus
  detail: string | null
}

interface HealthData {
  channels: Record<string, ChannelHealth>
  active_workflow_count: number
  blocked_workflow_count: number
  blocked_workflows: Array<{ name: string; missing: string[] }>
}

/* ── Constants ──────────────────────────────────────────── */

const STORAGE_KEY = 'setup_banner_v2'
const CONTENT_ID = 'dashboard-main-content'

const CHANNEL_META: Record<string, { label: string; shortLabel: string; icon: React.ReactNode }> = {
  whatsapp:       { label: 'WhatsApp',     shortLabel: 'WA',    icon: <MessageCircle size={14} className="text-green-500" /> },
  instagram:      { label: 'Instagram',    shortLabel: 'IG',    icon: <Instagram size={14} className="text-pink-500" /> },
  voice_inbound:  { label: 'Ses (Gelen)',  shortLabel: 'Ses(G)', icon: <Phone size={14} className="text-blue-500" /> },
  voice_outbound: { label: 'Ses (Giden)',  shortLabel: 'Ses(Ç)', icon: <PhoneOutgoing size={14} className="text-indigo-500" /> },
  calendar:       { label: 'Takvim',       shortLabel: 'Takvim', icon: <Calendar size={14} className="text-brand-600" /> },
}

const STATUS_DOT: Record<ChannelStatus, string> = {
  connected:      'bg-emerald-500',
  missing_config: 'bg-amber-400',
  not_configured: 'bg-slate-300',
  token_expired:  'bg-red-400',
}

const STATUS_LABEL: Record<ChannelStatus, string> = {
  connected:      'Bağlı',
  missing_config: 'Eksik yapılandırma',
  not_configured: 'Yapılandırılmamış',
  token_expired:  'Token süresi dolmuş',
}

/* ── Component ──────────────────────────────────────────── */

export default function SetupCommandCenter() {
  const [activeTab, setActiveTab] = useState<'setup' | 'integrations'>('setup')
  const [collapsed, setCollapsed] = useState(false)
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loaded, setLoaded] = useState(false)

  const completedCount = setupStatus
    ? [setupStatus.business_info_complete, setupStatus.has_kb_items, setupStatus.has_channel, setupStatus.has_playbook, setupStatus.has_conversation].filter(Boolean).length
    : 0
  const isSetupComplete = completedCount === 5
  const isIncomplete = completedCount < 5
  const percent = Math.round((completedCount / 5) * 100)

  const activeChannelCount = healthData
    ? Object.values(healthData.channels).filter(c => c.status === 'connected').length
    : 0

  /* ── Fetch ── */
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'collapsed') setCollapsed(true)

    Promise.all([
      fetch('/api/setup-status').then(r => (r.ok ? r.json() : null)),
      fetch('/api/integration-health').then(r => (r.ok ? r.json() : null)),
    ])
      .then(([setup, health]) => {
        setSetupStatus(setup)
        setHealthData(health)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  /* ── Blur effect ── */
  useEffect(() => {
    if (!loaded || !setupStatus) return
    const el = document.getElementById(CONTENT_ID)
    if (!el) return

    const shouldBlur = isIncomplete && !collapsed
    el.classList.toggle('blur-sm', shouldBlur)
    el.classList.toggle('opacity-60', shouldBlur)
    el.classList.toggle('pointer-events-none', shouldBlur)
    el.classList.toggle('select-none', shouldBlur)

    return () => {
      el.classList.remove('blur-sm', 'opacity-60', 'pointer-events-none', 'select-none')
    }
  }, [loaded, isIncomplete, collapsed, setupStatus])

  /* ── Loading skeleton ── */
  if (!loaded) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100" />
          <div className="h-4 bg-slate-100 rounded w-40" />
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-3/4" />
        </div>
      </div>
    )
  }

  if (!setupStatus || !healthData) return null

  /* ── Helpers ── */
  const handleCollapse = () => {
    setCollapsed(true)
    localStorage.setItem(STORAGE_KEY, 'collapsed')
  }

  const handleExpand = () => {
    setCollapsed(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  const channelEntries = Object.entries(CHANNEL_META).map(([key, meta]) => ({
    key,
    ...meta,
    health: healthData.channels[key] ?? { status: 'not_configured' as ChannelStatus, detail: null },
  }))

  const workflowSummary = healthData.blocked_workflow_count > 0
    ? `${healthData.blocked_workflow_count} iş akışı bekliyor`
    : healthData.active_workflow_count > 0
    ? `${healthData.active_workflow_count} iş akışı aktif`
    : null

  /* ── Durum B: Setup tamamlandı → compact health card ── */
  if (isSetupComplete) {
    const hasIssues = healthData.blocked_workflow_count > 0

    return (
      <div className={`bg-white rounded-xl border ${hasIssues ? 'border-amber-200' : 'border-slate-200'} shadow-sm overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900">Sistem Durumu</h3>
          </div>
          <Link
            href="/dashboard/settings"
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Ayarlar
          </Link>
        </div>

        <div className="px-5 pb-4">
          {/* Channel status row */}
          <div className="flex flex-wrap gap-3 mb-3">
            {channelEntries.map(({ key, shortLabel, icon, health }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[health.status]}`} />
                {icon}
                <span className="text-xs text-slate-600 font-medium">{shortLabel}</span>
              </div>
            ))}
          </div>

          {/* Workflow summary */}
          {hasIssues ? (
            <div className="pt-3 border-t border-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-amber-700 font-medium">
                    {healthData.blocked_workflow_count} iş akışı eksik entegrasyon nedeniyle çalışamaz
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {healthData.blocked_workflows.map((bw, i) => (
                      <li key={i} className="text-xs text-amber-600">
                        {bw.name} — {bw.missing.join(', ')} gerekli
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard/workflows"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-amber-700 hover:text-amber-800 font-medium"
                  >
                    İş akışlarını gör
                  </Link>
                </div>
              </div>
            </div>
          ) : healthData.active_workflow_count > 0 ? (
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-xs text-slate-500">
                {healthData.active_workflow_count} aktif iş akışı sorunsuz çalışıyor
              </span>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  /* ── Collapsed mini banner ── */
  if (collapsed) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Komuta Merkezi — {completedCount}/5 adım tamamlandı
          </span>
          {healthData && (
            <span className="text-xs text-amber-600 ml-1">
              · {activeChannelCount}/5 kanal aktif
            </span>
          )}
        </div>
        <button
          onClick={handleExpand}
          className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Göster
        </button>
      </div>
    )
  }

  /* ── Durum A: Setup tamamlanmamış → gradient banner ── */

  // Estimate remaining time (~2 min per incomplete step)
  const remainingSteps = 5 - completedCount
  const remainingMin = remainingSteps * 2

  // Next incomplete step → CTA link
  const nextStep = [
    { key: 'business', done: setupStatus.business_info_complete, href: '/dashboard/settings', desc: 'İşletme profilinizi tamamlayın' },
    { key: 'kb', done: setupStatus.has_kb_items, href: '/dashboard/knowledge', desc: 'Bilgi bankası oluşturun' },
    { key: 'channel', done: setupStatus.has_channel, href: '/dashboard/integrations', desc: 'Kanal bağlayın' },
    { key: 'playbook', done: setupStatus.has_playbook, href: '/dashboard/agent', desc: 'AI asistanınızı kurun' },
    { key: 'conversation', done: setupStatus.has_conversation, href: '/dashboard/inbox', desc: 'İlk konuşmayı bekleyin' },
  ].find(s => !s.done)

  // Build summary of what's left
  const todoSummary = [
    !setupStatus.has_channel && 'kanalları bağlayın',
    !setupStatus.has_kb_items && 'bilgi bankasını doldurun',
    !setupStatus.has_playbook && 'AI asistanını onaylayın',
  ].filter(Boolean).join(', ')

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500">
      {/* Subtle mesh/noise overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_70%)]" />

      <div className="relative flex items-center justify-between px-6 py-5 gap-6">
        {/* Left: text content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-sm">
              SETUP · {completedCount} / 5
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-white/70">
              <Clock size={11} />
              ~{remainingMin} dk kaldı
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-1">
            Kurulumu tamamlayın
          </h3>
          <p className="text-sm text-white/70 max-w-md">
            {todoSummary
              ? `${todoSummary.charAt(0).toUpperCase() + todoSummary.slice(1)}.`
              : 'AI asistanınızı aktif etmek için adımları tamamlayın.'}
          </p>

          {/* Progress bar */}
          <div className="mt-3 w-full max-w-xs">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: CTA with glow + dismiss */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCollapse}
            className="text-xs text-white/50 hover:text-white/80 transition-colors hidden sm:block"
          >
            Daha sonra
          </button>

          {nextStep && (
            <div className="relative">
              {/* Glow effect behind button */}
              <div className="absolute inset-0 rounded-xl bg-white/30 blur-xl scale-110" />
              <Link
                href={nextStep.href}
                className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-white text-teal-700 font-semibold text-sm rounded-xl hover:bg-white/90 transition-all shadow-lg shadow-teal-900/20"
              >
                Kuruluma devam et
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
