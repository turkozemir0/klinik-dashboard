'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Phone, MessageSquare, ArrowLeftRight, Zap,
  ToggleLeft, ToggleRight, Settings2, Clock, Lock,
  CreditCard, Loader2, RefreshCw, Play, AlertTriangle, Plug,
  CheckCircle2, TrendingUp, CalendarClock,
} from 'lucide-react'
import Link from 'next/link'
import type { TemplateWithStatus } from '@/lib/workflow-types'
import type { WorkflowCategory } from '@/lib/workflow-types'
import ActivateModal from './ActivateModal'
import RunHistoryDrawer from './RunHistoryDrawer'
import { useIsDemo } from '@/lib/demo-context'
import { useLang } from '@/lib/lang-context'
import TopBar from '@/components/TopBar'
import StatCard from '@/components/StatCard'

// ── i18n ─────────────────────────────────────────────────────────────────────

const L = {
  title:        { tr: 'İş Akışları', en: 'Workflows' },
  subtitle:     { tr: 'Otomatikleştirilmiş senaryolar — hangi durumda hangi ajanın devreye gireceğini belirle', en: 'Automated scenarios — define which agent activates in which situation' },
  searchPh:     { tr: 'İş akışı ara...', en: 'Search workflows...' },
  refresh:      { tr: 'Yenile', en: 'Refresh' },
  all:          { tr: 'Tümü', en: 'All' },
  outVoice:     { tr: 'Sesli Giden', en: 'Outbound Voice' },
  chatbot:      { tr: 'Chatbot', en: 'Chatbot' },
  sync:         { tr: 'Senkron (V+C)', en: 'Sync (V+C)' },
  activeOnly:   { tr: 'Sadece aktif', en: 'Active only' },
  active:       { tr: 'Aktif', en: 'Active' },
  comingSoon:   { tr: 'Yakında', en: 'Coming Soon' },
  integMissing: { tr: 'Entegrasyon eksik', en: 'Integration missing' },
  upgrade:      { tr: 'Yükselt', en: 'Upgrade' },
  readOnly:     { tr: 'Salt okunur', en: 'Read only' },
  deactivate:   { tr: 'Pasife al', en: 'Deactivate' },
  activate:     { tr: 'Aktif et', en: 'Activate' },
  edit:         { tr: 'Düzenle', en: 'Edit' },
  setup:        { tr: 'Kur & Aktif Et', en: 'Setup & Activate' },
  history:      { tr: 'Geçmiş', en: 'History' },
  manualRun:    { tr: 'Manuel Çalıştır', en: 'Run Manually' },
  integReq:     { tr: 'entegrasyonu gerekli', en: 'integration required' },
  goInteg:      { tr: 'Entegrasyonlara Git', en: 'Go to Integrations' },
  setupFirst:   { tr: 'Önce gerekli entegrasyonları tamamlayın', en: 'Complete required integrations first' },
  noResults:    { tr: 'Sonuç bulunamadı.', en: 'No results found.' },
  // stat cards
  statActive:   { tr: 'Aktif İş Akışı', en: 'Active Workflows' },
  statOfTotal:  { tr: 'şablondan', en: 'of templates' },
  statToday:    { tr: 'Bugün Çalıştırılan', en: 'Runs Today' },
  statSuccess:  { tr: 'Başarı Oranı', en: 'Success Rate' },
  statLastRun:  { tr: 'Son Çalışma', en: 'Last Run' },
  // mini stats
  miniToday:    { tr: 'BUGÜN', en: 'TODAY' },
  miniSuccess:  { tr: 'BAŞARI', en: 'SUCCESS' },
  miniLastRun:  { tr: 'SON ÇALIŞMA', en: 'LAST RUN' },
  // manual run modal
  modalTitle:   { tr: 'Manuel Çalıştır', en: 'Run Manually' },
  phoneLabel:   { tr: 'Telefon Numarası', en: 'Phone Number' },
  phoneReq:     { tr: 'Telefon numarası zorunlu', en: 'Phone number is required' },
  triggered:    { tr: 'Tetiklendi!', en: 'Triggered!' },
  cancel:       { tr: 'İptal', en: 'Cancel' },
  run:          { tr: 'Çalıştır', en: 'Run' },
  runFail:      { tr: 'Çalıştırılamadı', en: 'Failed to run' },
  never:        { tr: 'Henüz yok', en: 'Never' },
} as const

type LKey = keyof typeof L

function useL() {
  const { lang } = useLang()
  return (key: LKey) => L[key][lang]
}

// ── Category config ──────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<WorkflowCategory, React.FC<any>> = {
  outbound_voice: Phone,
  chatbot:        MessageSquare,
  sync:           ArrowLeftRight,
}

const CATEGORY_EMOJI: Record<WorkflowCategory, string> = {
  outbound_voice: '',
  chatbot:        '',
  sync:           '',
}

// ── Time ago helper ──────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null | undefined, isTr: boolean): string {
  if (!dateStr) return isTr ? 'Henüz yok' : 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return isTr ? 'Az önce' : 'Just now'
  if (mins < 60) return `${mins} ${isTr ? 'dk önce' : 'min ago'}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ${isTr ? 'sa önce' : 'hr ago'}`
  const days = Math.floor(hours / 24)
  return `${days} ${isTr ? 'gün önce' : 'days ago'}`
}

// ── WorkflowCard ─────────────────────────────────────────────────────────────

function WorkflowCard({
  template,
  onEdit,
  onToggle,
  onRunHistory,
  onManualRun,
  toggling,
  isDemo,
  l,
  isTr,
}: {
  template: TemplateWithStatus
  onEdit: (t: TemplateWithStatus) => void
  onToggle: (id: string, current: boolean) => void
  onRunHistory: (id: string, name: string) => void
  onManualRun: (t: TemplateWithStatus) => void
  toggling: string | null
  isDemo?: boolean
  l: (key: LKey) => string
  isTr: boolean
}) {
  const Icon = CATEGORY_ICONS[template.category] ?? Zap
  const comingSoon = !!template.comingSoon
  const locked = !template.plan_allowed
  const channelMissing = !locked && !comingSoon && !template.channel_ready
  const workflowId = template.active_workflow_id
  const disabled = locked || comingSoon

  const iconBg = disabled ? 'bg-slate-50' : channelMissing ? 'bg-amber-50' : template.is_active ? 'bg-emerald-50' : 'bg-brand-50'
  const iconColor = disabled ? 'text-slate-300' : channelMissing ? 'text-amber-500' : template.is_active ? 'text-emerald-600' : 'text-brand-600'
  const borderColor = disabled ? 'border-slate-100' : channelMissing ? 'border-amber-200' : template.is_active ? 'border-emerald-100' : 'border-slate-200'

  return (
    <div className={`bg-white rounded-xl border ${borderColor} p-5 hover:shadow-md transition-shadow`}>
      {/* Top: Icon + Title + Badge + Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon size={20} className={iconColor} />
          </div>
          <div className="min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold text-sm ${disabled ? 'text-slate-400' : 'text-slate-800'}`}>
                {template.name}
              </h3>
              {comingSoon && (
                <span className="inline-flex items-center text-[10px] bg-slate-100 text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 font-medium uppercase tracking-wide">
                  {l('comingSoon')}
                </span>
              )}
              {!disabled && template.is_active && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {l('active')}
                </span>
              )}
              {channelMissing && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
                  <AlertTriangle size={10} />
                  {l('integMissing')}
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${disabled ? 'text-slate-300' : 'text-slate-500'}`}>
              {template.description}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 pt-1">
          {comingSoon ? null : isDemo ? (
            <span className="text-xs text-slate-400">{l('readOnly')}</span>
          ) : locked ? (
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-1 text-xs text-brand-600 font-medium hover:text-brand-700"
            >
              <Lock size={12} />
              <CreditCard size={12} />
              {l('upgrade')}
            </Link>
          ) : workflowId && !channelMissing ? (
            <button
              onClick={() => onToggle(workflowId, template.is_active)}
              disabled={toggling === workflowId}
              title={template.is_active ? l('deactivate') : l('activate')}
              className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              {toggling === workflowId ? (
                <Loader2 size={24} className="animate-spin" />
              ) : template.is_active ? (
                <ToggleRight size={28} className="text-emerald-500" />
              ) : (
                <ToggleLeft size={28} className="text-slate-300" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Mini stats (active workflows only) */}
      {!disabled && template.is_active && !channelMissing && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{l('miniToday')}</p>
            <p className="text-lg font-bold text-slate-800 leading-tight">{template.today_runs ?? 0}</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{l('miniSuccess')}</p>
            <p className={`text-lg font-bold leading-tight ${
              (template.success_rate ?? 0) >= 70 ? 'text-emerald-600' :
              (template.success_rate ?? 0) < 40 ? 'text-red-500' : 'text-amber-600'
            }`}>
              {template.success_rate ?? 0}%
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{l('miniLastRun')}</p>
            <p className="text-sm font-semibold text-slate-600 leading-tight mt-0.5">
              {timeAgo(template.last_run_at, isTr)}
            </p>
          </div>
        </div>
      )}

      {/* Channel missing warning */}
      {channelMissing && (
        <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <Plug size={12} className="text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700">
            {template.missing_channels.join(', ')} {l('integReq')}
          </span>
          <Link
            href="/dashboard/integrations"
            className="ml-auto text-xs text-amber-700 hover:text-amber-800 font-medium whitespace-nowrap"
          >
            {l('goInteg')} &rarr;
          </Link>
        </div>
      )}

      {/* Action buttons */}
      {!disabled && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {channelMissing ? (
            <span
              className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 cursor-not-allowed"
              title={l('setupFirst')}
            >
              <Settings2 size={12} />
              {l('setup')}
            </span>
          ) : (
            <button
              onClick={() => onEdit(template)}
              disabled={isDemo}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings2 size={12} />
              {workflowId ? l('edit') : l('setup')}
            </button>
          )}

          {workflowId && (
            <button
              onClick={() => onRunHistory(workflowId, template.name)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Clock size={12} />
              {l('history')}
            </button>
          )}

          {workflowId && template.is_active && !channelMissing && (
            <button
              onClick={() => onManualRun(template)}
              disabled={isDemo}
              className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={12} />
              {l('manualRun')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── ManualRunModal ───────────────────────────────────────────────────────────

function ManualRunModal({
  template,
  onClose,
  l,
}: {
  template: TemplateWithStatus
  onClose: () => void
  l: (key: LKey) => string
}) {
  const [phone, setPhone]     = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  async function run() {
    if (!phone.trim()) { setError(l('phoneReq')); return }
    setRunning(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/trigger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: template.active_workflow_id, phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? l('runFail'))
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-1">{l('modalTitle')}</h3>
        <p className="text-sm text-slate-500 mb-4">{template.name}</p>

        {success ? (
          <div className="text-center py-4 text-emerald-600 text-sm font-medium">{l('triggered')}</div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {l('phoneLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+905551234567"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm hover:bg-slate-50"
              >
                {l('cancel')}
              </button>
              <button
                onClick={run}
                disabled={running}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {l('run')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function WorkflowsClient() {
  const isDemo = useIsDemo()
  const { lang } = useLang()
  const isTr = lang === 'tr'
  const l = useL()

  const [templates, setTemplates]     = useState<TemplateWithStatus[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeCategory, setActiveCategory] = useState<WorkflowCategory | 'all'>('all')
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithStatus | null>(null)
  const [manualRunTemplate, setManualRunTemplate] = useState<TemplateWithStatus | null>(null)
  const [historyWorkflow, setHistoryWorkflow]     = useState<{ id: string; name: string } | null>(null)
  const [toggling, setToggling]       = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [orgSector, setOrgSector]     = useState('general')
  const [orgLang, setOrgLang]         = useState('tr')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly]   = useState(false)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workflows/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates)
        if (data.org_sector) setOrgSector(data.org_sector)
        if (data.org_lang) setOrgLang(data.org_lang)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  async function handleToggle(workflowId: string, current: boolean) {
    if (isDemo) return
    setToggling(workflowId)
    setToggleError(null)
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_active: !current }),
      })
      if (!res.ok) {
        const data = await res.json()
        if (data.error === 'channel_not_ready') {
          setToggleError(data.message)
          return
        }
      }
      await fetchTemplates()
    } finally {
      setToggling(null)
    }
  }

  // ── Computed stats ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const activeCount = templates.filter(t => t.is_active).length
    const totalCount = templates.length
    const todayTotal = templates.reduce((sum, t) => sum + (t.today_runs ?? 0), 0)

    const activeTemplates = templates.filter(t => t.is_active && (t.success_rate ?? 0) > 0)
    const weightedSuccess = activeTemplates.length > 0
      ? Math.round(activeTemplates.reduce((sum, t) => sum + (t.success_rate ?? 0), 0) / activeTemplates.length)
      : 0

    const lastRunDates = templates
      .filter(t => t.last_run_at)
      .map(t => t.last_run_at!)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    return { activeCount, totalCount, todayTotal, weightedSuccess, lastRunAt: lastRunDates[0] ?? null }
  }, [templates])

  // ── Category counts ──────────────────────────────────────────────────────────

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length }
    for (const t of templates) {
      counts[t.category] = (counts[t.category] ?? 0) + 1
    }
    return counts
  }, [templates])

  const CATEGORY_LABELS_I18N: Record<WorkflowCategory | 'all', string> = {
    all:            l('all'),
    outbound_voice: l('outVoice'),
    chatbot:        l('chatbot'),
    sync:           l('sync'),
  }

  // ── Filtering ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = templates
    if (activeCategory !== 'all') list = list.filter(t => t.category === activeCategory)
    if (activeOnly) list = list.filter(t => t.is_active)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [templates, activeCategory, activeOnly, searchQuery])

  const categories: Array<WorkflowCategory | 'all'> = ['all', 'outbound_voice', 'chatbot', 'sync']

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* TopBar */}
      <TopBar
        title={l('title')}
        subtitle={l('subtitle')}
        searchPlaceholder={l('searchPh')}
        onSearch={setSearchQuery}
        primaryCta={
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {l('refresh')}
          </button>
        }
      />

      {/* 4 Stat Cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            title={l('statActive')}
            value={stats.activeCount}
            icon={Zap}
            color="blue"
            subtitle={`/ ${stats.totalCount} ${l('statOfTotal')}`}
          />
          <StatCard
            title={l('statToday')}
            value={stats.todayTotal}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title={l('statSuccess')}
            value={`${stats.weightedSuccess}%`}
            icon={CheckCircle2}
            color={stats.weightedSuccess >= 70 ? 'green' : stats.weightedSuccess < 40 ? 'red' : 'amber'}
          />
          <StatCard
            title={l('statLastRun')}
            value={stats.lastRunAt ? timeAgo(stats.lastRunAt, isTr) : '—'}
            icon={CalendarClock}
            color="slate"
          />
        </div>
      )}

      {/* Category chips + filters */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {CATEGORY_LABELS_I18N[cat]}
              <span className={`text-[10px] font-bold ${
                activeCategory === cat ? 'text-white/70' : 'text-slate-400'
              }`}>
                {categoryCounts[cat] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={e => setActiveOnly(e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-8 h-4.5 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-transform peer-checked:after:translate-x-3.5" />
          <span className="text-xs text-slate-600 font-medium">{l('activeOnly')}</span>
        </label>
      </div>

      {/* Toggle error */}
      {toggleError && (
        <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-700">{toggleError}</p>
            <Link
              href="/dashboard/integrations"
              className="text-xs text-amber-700 hover:text-amber-800 font-medium mt-1 inline-block"
            >
              {l('goInteg')} &rarr;
            </Link>
          </div>
          <button onClick={() => setToggleError(null)} className="text-amber-400 hover:text-amber-600 text-sm">&times;</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-100 p-5 h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {l('noResults')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(template => (
            <WorkflowCard
              key={template.id}
              template={template}
              onEdit={isDemo ? () => {} : setEditingTemplate}
              onToggle={handleToggle}
              onRunHistory={(id, name) => setHistoryWorkflow({ id, name })}
              onManualRun={isDemo ? () => {} : setManualRunTemplate}
              toggling={toggling}
              isDemo={isDemo}
              l={l}
              isTr={isTr}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {editingTemplate && (
        <ActivateModal
          template={editingTemplate}
          orgSector={orgSector}
          orgLang={orgLang}
          onClose={() => setEditingTemplate(null)}
          onSaved={() => { setEditingTemplate(null); fetchTemplates() }}
        />
      )}

      {manualRunTemplate && (
        <ManualRunModal
          template={manualRunTemplate}
          onClose={() => setManualRunTemplate(null)}
          l={l}
        />
      )}

      {historyWorkflow && (
        <RunHistoryDrawer
          workflowId={historyWorkflow.id}
          workflowName={historyWorkflow.name}
          onClose={() => setHistoryWorkflow(null)}
        />
      )}
    </div>
  )
}
