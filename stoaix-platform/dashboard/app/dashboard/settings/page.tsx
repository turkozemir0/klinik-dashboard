'use client'

import { useState, useEffect, Suspense } from 'react'
import {
  Settings, Loader2, Lock, ToggleLeft, ToggleRight, CreditCard,
  Check, X, Zap, Star, Building2, Rocket,
  Plus, ChevronDown, LifeBuoy,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/lang-context'
import DunningBanner from '@/components/billing/DunningBanner'
import TrialBanner from '@/components/billing/TrialBanner'

// ─── Module labels ────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  whatsapp:       'WhatsApp',
  inbox:          'Gelen Kutusu',
  voice:          'Ses Agent',
  knowledge_base: 'Bilgi Bankası',
  leads:          'Lead Yönetimi',
  proposals:      'Teklifler',
  calendar:       'Takvim',
  followup:       'Takip',
  instagram:      'Instagram DM',
  analytics:      'Analitik',
  api:            'API / Webhook',
  crm:            'CRM Entegrasyonu',
  support:        'Destek',
  team:           'Ekip',
}

interface ModuleFeature {
  key: string
  module: string
  name: string
  plan_enabled: boolean
  plan_limit: number | null
  user_disabled: boolean
  effective_enabled: boolean
}

function ModulesSection() {
  const [features, setFeatures] = useState<ModuleFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/modules')
      .then(r => (r.ok ? r.json() : []))
      .then(d => setFeatures(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function toggle(featureKey: string, newEnabled: boolean) {
    setToggling(featureKey)
    try {
      await fetch('/api/settings/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_key: featureKey, enabled: newEnabled }),
      })
      setFeatures(prev => prev.map(f =>
        f.key === featureKey
          ? { ...f, user_disabled: !newEnabled, effective_enabled: f.plan_enabled && newEnabled }
          : f
      ))
    } finally {
      setToggling(null)
    }
  }

  const grouped: Record<string, ModuleFeature[]> = {}
  for (const f of features) {
    if (!grouped[f.module]) grouped[f.module] = []
    grouped[f.module].push(f)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            {[1, 2].map(j => (
              <div key={j} className="flex items-center justify-between py-2">
                <div className="h-3 w-40 bg-slate-100 rounded" />
                <div className="h-5 w-10 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (features.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        Özellik listesi yüklenemedi.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Planınızda açık olan modülleri kapatabilirsiniz. Planınızda olmayan modüller için{' '}
        <Link href="/dashboard/settings?tab=billing" className="text-brand-600 underline hover:text-brand-700">
          plan yükseltme
        </Link>{' '}
        gereklidir.
      </p>
      {Object.entries(grouped).map(([module, moduleFeatures]) => (
        <div key={module} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {MODULE_LABELS[module] ?? module}
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {moduleFeatures.map(f => {
              const isToggling = toggling === f.key
              return (
                <div key={f.key} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {!f.plan_enabled ? (
                      <Lock size={14} className="shrink-0 text-slate-300" />
                    ) : f.effective_enabled ? (
                      <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    ) : (
                      <div className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${!f.plan_enabled ? 'text-slate-400' : 'text-slate-700'}`}>
                        {f.name}
                      </p>
                      {f.plan_limit !== null && (
                        <p className="text-xs text-slate-400">{f.plan_limit.toLocaleString('tr-TR')}/ay limit</p>
                      )}
                    </div>
                  </div>

                  {!f.plan_enabled ? (
                    <Link
                      href="/dashboard/settings?tab=billing"
                      className="shrink-0 text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1"
                    >
                      <CreditCard size={12} />
                      Yükselt
                    </Link>
                  ) : (
                    <button
                      onClick={() => toggle(f.key, !f.effective_enabled)}
                      disabled={isToggling}
                      title={f.effective_enabled ? 'Kapat' : 'Aç'}
                      className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                      {isToggling ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : f.effective_enabled ? (
                        <ToggleRight size={24} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={24} className="text-slate-300" />
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Billing ──────────────────────────────────────────────────────────────────

type Interval = 'monthly' | 'annual'

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  annualPrice: number
  icon: React.ReactNode
  color: string
  features: { label: string; value: string | boolean }[]
}

const PLANS: Plan[] = [
  {
    id: 'lite',
    name: 'Lite',
    monthlyPrice: 79,
    annualPrice: 63,
    icon: <Zap size={18} />,
    color: 'text-slate-600',
    features: [
      { label: 'WhatsApp mesajı', value: '500/ay' },
      { label: 'Voice agent', value: false },
      { label: 'Kanban board', value: true },
      { label: 'CSV import', value: false },
      { label: 'Instagram DM', value: false },
      { label: 'Gelismis analitik', value: false },
      { label: 'Outbound webhook', value: false },
      { label: 'Ekip üyesi', value: '1' },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    monthlyPrice: 149,
    annualPrice: 119,
    icon: <Star size={18} />,
    color: 'text-brand-500',
    features: [
      { label: 'WhatsApp mesajı', value: '2.000/ay' },
      { label: 'Voice agent', value: '60 dk/ay' },
      { label: 'Kanban board', value: true },
      { label: 'CSV import', value: true },
      { label: 'Instagram DM', value: true },
      { label: 'Gelismis analitik', value: false },
      { label: 'Outbound webhook', value: false },
      { label: 'Ekip üyesi', value: '3' },
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    monthlyPrice: 299,
    annualPrice: 239,
    icon: <Rocket size={18} />,
    color: 'text-purple-500',
    features: [
      { label: 'WhatsApp mesajı', value: '5.000/ay' },
      { label: 'Voice agent', value: '200 dk/ay' },
      { label: 'Kanban board', value: true },
      { label: 'CSV import', value: true },
      { label: 'Instagram DM', value: true },
      { label: 'Gelismis analitik', value: true },
      { label: 'Outbound webhook', value: true },
      { label: 'Ekip üyesi', value: '10' },
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 499,
    annualPrice: 399,
    icon: <Building2 size={18} />,
    color: 'text-emerald-500',
    features: [
      { label: 'WhatsApp mesajı', value: 'Sınırsız' },
      { label: 'Voice agent', value: 'Sınırsız' },
      { label: 'Kanban board', value: true },
      { label: 'CSV import', value: true },
      { label: 'Instagram DM', value: true },
      { label: 'Gelismis analitik', value: true },
      { label: 'Outbound webhook', value: true },
      { label: 'Ekip üyesi', value: 'Sınırsız' },
    ],
  },
]

function BillingSection() {
  const [interval, setInterval] = useState<Interval>('monthly')
  const [limitsData, setLimitsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const currentPlanId: string | null = limitsData?.plan_id ?? null
  const status: string = limitsData?.status ?? ''
  const trialEndsAt: string | null = limitsData?.trial_ends_at ?? null
  const isLegacy = currentPlanId === 'legacy'
  const hasNoPlan = currentPlanId === null

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/billing/limits')
        if (res.ok) {
          const data = await res.json()
          setLimitsData(data)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSelect(planId: string) {
    setSelectingPlan(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url) window.location.href = data.url
      }
    } catch {
      // ignore
    } finally {
      setSelectingPlan(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.url) window.location.href = data.url
      }
    } catch {
      // ignore
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!loading && (
        <div className="space-y-3">
          <DunningBanner status={status} />
          <TrialBanner trialEndsAt={trialEndsAt} planId={currentPlanId} />
        </div>
      )}

      {isLegacy && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-sm font-semibold text-slate-700">Mevcut müşteri — Özel fiyatlandırma</p>
          <p className="mt-1 text-sm text-slate-500">
            Özel fiyatlandırmadan yararlanıyorsunuz. Planınızı güncellemek için bizimle iletişime geçin.
          </p>
          <a
            href="mailto:destek@stoaix.com"
            className="mt-3 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            İletişime Geç
          </a>
        </div>
      )}

      {(!isLegacy || hasNoPlan) && (
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                interval === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setInterval('annual')}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                interval === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Yıllık
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                %20 indirim
              </span>
            </button>
          </div>
        </div>
      )}

      {(!isLegacy || hasNoPlan) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlanId
            const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice
            const isBusy = selectingPlan === plan.id

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${
                  isCurrent ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-slate-200'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-semibold text-white shadow">
                      Aktif Plan
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <span className={plan.color}>{plan.icon}</span>
                  <h3 className="text-base font-semibold text-slate-800">{plan.name}</h3>
                </div>
                <div className="mb-5">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-slate-900">${price}</span>
                    <span className="mb-1 text-sm text-slate-400">/ay</span>
                  </div>
                  {interval === 'annual' && (
                    <p className="mt-0.5 text-xs text-slate-400">Yıllık ödeme (${price * 12}/yıl)</p>
                  )}
                </div>
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      {f.value === false ? (
                        <X size={13} className="mt-0.5 shrink-0 text-slate-300" />
                      ) : (
                        <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                      )}
                      <span className={f.value === false ? 'text-slate-400' : 'text-slate-700'}>
                        <span className="font-medium">{f.label}</span>
                        {typeof f.value === 'string' && (
                          <span className="text-slate-500"> — {f.value}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-center text-sm font-medium text-emerald-700">
                    Mevcut Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelect(plan.id)}
                    disabled={isBusy || !!selectingPlan}
                    className="w-full rounded-lg bg-brand-500 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
                  >
                    {isBusy ? 'Yükleniyor...' : 'Seç'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && currentPlanId && !isLegacy && !hasNoPlan && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-sm font-semibold text-slate-800">Mevcut aboneliği yönet</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Fatura bilgileri, ödeme yöntemi ve abonelik detayları.
            </p>
          </div>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {portalLoading ? 'Yükleniyor...' : 'Abonelik Portalı'}
          </button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="h-5 w-24 bg-slate-100 rounded" />
              <div className="h-8 w-20 bg-slate-100 rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map(j => <div key={j} className="h-3 bg-slate-100 rounded" />)}
              </div>
              <div className="h-9 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Support ──────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
}

const priorityLabels: Record<string, string> = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
  urgent: 'Acil',
}

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  admin_notes: string | null
  created_at: string
}

function SupportSection() {
  const t = useT()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [orgId, setOrgId] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('org_users')
        .select('organization_id')
        .eq('user_id', data.user.id)
        .maybeSingle()
        .then(({ data: ou }) => {
          if (!ou) { setLoading(false); return }
          setOrgId(ou.organization_id)
          supabase
            .from('support_tickets')
            .select('id, subject, message, status, priority, admin_notes, created_at')
            .eq('organization_id', ou.organization_id)
            .order('created_at', { ascending: false })
            .then(({ data: rows }) => {
              setTickets(rows ?? [])
              setLoading(false)
            })
        })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim() || !orgId) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('support_tickets')
      .insert({ organization_id: orgId, subject: subject.trim(), message: message.trim(), priority })
      .select('id, subject, message, status, priority, admin_notes, created_at')
      .single()

    if (err) {
      setError('Talep gönderilemedi. Lütfen tekrar deneyin.')
    } else if (data) {
      setTickets(prev => [data, ...prev])
      setSubject('')
      setMessage('')
      setPriority('normal')
      setShowForm(false)
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">{t.ticketsTitle}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Sorun ve taleplerinizi buradan iletebilirsiniz.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Yeni Talep
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-brand-100 shadow-sm p-5 mb-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Yeni Destek Talebi</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Konu</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Kısaca konuyu belirtin"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mesaj</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="Sorununuzu veya talebinizi detaylı açıklayın..."
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="low">Düşük</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {submitting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">{t.loading}</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-12 text-center">
          <LifeBuoy size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">Henüz destek talebiniz yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div
                className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status] || 'bg-slate-100 text-slate-600'}`}>
                      {t[ticket.status as keyof typeof t] as string || ticket.status}
                    </span>
                    <span className="text-xs text-slate-400">{priorityLabels[ticket.priority] || ticket.priority}</span>
                  </div>
                  <p className="font-medium text-slate-800">{ticket.subject}</p>
                  <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{ticket.message}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400">
                    {new Date(ticket.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-slate-400 transition-transform ${expanded === ticket.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {expanded === ticket.id && (
                <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{t.message}</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.message}</p>
                  </div>
                  {ticket.admin_notes && (
                    <div className="bg-brand-50 border border-brand-100 rounded-lg p-3">
                      <p className="text-xs font-medium text-brand-700 mb-1">stoaix yanıtı</p>
                      <p className="text-sm text-slate-700">{ticket.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

type SettingsTab = 'moduller' | 'billing' | 'support'

function SettingsPageInner() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as SettingsTab) ?? 'moduller'
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    ['moduller', 'billing', 'support'].includes(initialTab) ? initialTab : 'moduller'
  )

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'moduller', label: 'Modüller' },
    { key: 'billing',  label: 'Plan & Fatura' },
    { key: 'support',  label: 'Destek Talebi' },
  ]

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={22} className="text-brand-600" />
        <h1 className="text-xl font-semibold text-slate-800">Hesap Ayarları</h1>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'moduller' && <ModulesSection />}
      {activeTab === 'billing'  && <BillingSection />}
      {activeTab === 'support'  && <SupportSection />}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  )
}
