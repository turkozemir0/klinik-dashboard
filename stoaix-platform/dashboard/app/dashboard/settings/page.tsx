'use client'

import { useState, useEffect, Suspense } from 'react'
import {
  Settings, Loader2, Lock, ToggleLeft, ToggleRight, CreditCard,
  Check, X, Zap, Star, Building2, Rocket,
  Plus, ChevronDown, LifeBuoy, Download, RefreshCw,
  XCircle, Calendar, Globe, Copy, Eye, EyeOff, Trash2, TestTube2,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/lang-context'
import { useIsDemo } from '@/lib/demo-context'
import { useOrg } from '@/lib/org-context'
import DunningBanner from '@/components/billing/DunningBanner'
import TrialBanner from '@/components/billing/TrialBanner'
import CancelSubscriptionModal from '@/components/billing/CancelSubscriptionModal'
import PipelineSettings from '@/components/settings/PipelineSettings'

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
  const isDemo = useIsDemo()
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
    if (isDemo) return
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
                      className={`shrink-0 text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1 ${isDemo ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <CreditCard size={12} />
                      Yükselt
                    </Link>
                  ) : (
                    <button
                      onClick={() => toggle(f.key, !f.effective_enabled)}
                      disabled={isToggling || isDemo}
                      title={isDemo ? 'Demo modunda değiştirilemez' : f.effective_enabled ? 'Kapat' : 'Aç'}
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
    id: 'essential',
    name: 'Essential',
    monthlyPrice: 79,
    annualPrice: 63,
    icon: <Zap size={18} />,
    color: 'text-slate-600',
    features: [
      { label: 'Full CRM', value: true },
      { label: 'WhatsApp & Instagram', value: 'Sınırsız' },
      { label: 'Bilgi bankası', value: 'Sınırsız' },
      { label: 'Chat AI & Workflow', value: true },
      { label: 'Voice agent', value: false },
      { label: 'Gelişmiş analitik', value: false },
      { label: 'Ekip üyesi', value: '5' },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 149,
    annualPrice: 119,
    icon: <Star size={18} />,
    color: 'text-brand-500',
    features: [
      { label: 'Essential dahil her şey', value: true },
      { label: 'Voice inbound', value: '150 dk/ay' },
      { label: 'Gelişmiş analitik', value: true },
      { label: 'Multi-pipeline', value: '3 adet' },
      { label: 'Voice outbound', value: false },
      { label: 'Çok dilli ses', value: false },
      { label: 'Ekip üyesi', value: '10' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 299,
    annualPrice: 239,
    icon: <Rocket size={18} />,
    color: 'text-purple-500',
    features: [
      { label: 'Professional dahil her şey', value: true },
      { label: 'Voice in+outbound', value: '300 dk/ay' },
      { label: 'Tüm voice workflow', value: true },
      { label: 'Çok dilli ses (8 dil)', value: true },
      { label: 'Analitik export', value: true },
      { label: 'Multi-pipeline', value: 'Sınırsız' },
      { label: 'Ekip üyesi', value: '20' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    monthlyPrice: 0,
    annualPrice: 0,
    icon: <Building2 size={18} />,
    color: 'text-emerald-500',
    features: [
      { label: 'Business dahil her şey', value: true },
      { label: 'Özel dakika paketleri', value: true },
      { label: 'Sınırsız kullanıcı', value: true },
      { label: 'Birebir destek', value: true },
      { label: 'Özel entegrasyonlar', value: true },
      { label: 'SLA garantisi', value: true },
      { label: 'Fiyat', value: 'Görüşmeli' },
    ],
  },
]

// ─── Card brand icon helper ──────────────────────────────────────────────────
function cardBrandLabel(brand: string) {
  const map: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' }
  return map[brand] || brand
}

// ─── Invoice status badge ────────────────────────────────────────────────────
function InvoiceStatus({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    paid:          { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Ödendi' },
    open:          { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Açık' },
    draft:         { bg: 'bg-slate-100',   text: 'text-slate-500',   label: 'Taslak' },
    void:          { bg: 'bg-slate-100',   text: 'text-slate-400',   label: 'İptal' },
    uncollectible: { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Tahsil edilemez' },
  }
  const cfg = map[status] || { bg: 'bg-slate-100', text: 'text-slate-500', label: status }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function BillingSection() {
  const isDemo = useIsDemo()
  const [interval, setInterval] = useState<Interval>('monthly')
  const [limitsData, setLimitsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null)

  // Subscription management state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<{ brand: string; last4: string; exp_month: number; exp_year: number } | null>(null)
  const [pmLoading, setPmLoading] = useState(false)
  const [pmUpdateLoading, setPmUpdateLoading] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null)
  const [addonLoading, setAddonLoading] = useState(false)

  const currentPlanId: string | null = limitsData?.plan_id ?? null
  const status: string = limitsData?.status ?? ''
  const trialEndsAt: string | null = limitsData?.trial_ends_at ?? null
  const billingInterval: string | null = limitsData?.billing_interval ?? null
  const periodEnd: string | null = limitsData?.current_period_end ?? null
  const cancelAtPeriodEnd: boolean = limitsData?.cancel_at_period_end ?? false
  const isLegacy = currentPlanId === 'legacy'
  const isCustom = currentPlanId === 'custom'
  const hasNoPlan = currentPlanId === null
  const hasSub = currentPlanId && !isLegacy && !hasNoPlan
  const isTrial = status === 'trialing'

  const planLabel = PLANS.find(p => p.id === currentPlanId)?.name ?? currentPlanId ?? ''

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/billing/limits')
        if (res.ok) setLimitsData(await res.json())
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Load payment method + invoices when we have a subscription
  useEffect(() => {
    if (!hasSub || loading) return

    setPmLoading(true)
    fetch('/api/billing/payment-method')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPaymentMethod(d.card) })
      .catch(() => {})
      .finally(() => setPmLoading(false))

    setInvoicesLoading(true)
    fetch('/api/billing/invoices')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setInvoices(d.invoices ?? []) })
      .catch(() => {})
      .finally(() => setInvoicesLoading(false))
  }, [hasSub, loading])

  async function handleSelect(planId: string) {
    if (isDemo) return
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
    } catch { /* ignore */ }
    finally { setSelectingPlan(null) }
  }

  async function handleReactivate() {
    if (isDemo) return
    setReactivating(true)
    try {
      const res = await fetch('/api/billing/reactivate', { method: 'POST' })
      if (res.ok) {
        setLimitsData((prev: any) => prev ? { ...prev, cancel_at_period_end: false } : prev)
      }
    } catch { /* ignore */ }
    finally { setReactivating(false) }
  }

  async function handleUpdatePaymentMethod() {
    if (isDemo) return
    setPmUpdateLoading(true)
    try {
      const res = await fetch('/api/billing/payment-method/update', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.url) window.location.href = data.url
      }
    } catch { /* ignore */ }
    finally { setPmUpdateLoading(false) }
  }

  async function handlePayInvoice(invoiceId: string) {
    if (isDemo) return
    setPayingInvoice(invoiceId)
    try {
      const res = await fetch('/api/billing/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      })
      const data = await res.json()
      if (data.paid) {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'paid' } : inv))
      } else if (data.hosted_url) {
        window.open(data.hosted_url, '_blank')
      }
    } catch { /* ignore */ }
    finally { setPayingInvoice(null) }
  }

  function handleCanceled() {
    setCancelModalOpen(false)
    setLimitsData((prev: any) => prev ? { ...prev, cancel_at_period_end: true } : prev)
  }

  function handleRetained() {
    setCancelModalOpen(false)
    // Refresh limits
    fetch('/api/billing/limits').then(r => r.ok ? r.json() : null).then(d => { if (d) setLimitsData(d) })
  }

  async function handleBuyAddon() {
    if (isDemo) return
    setAddonLoading(true)
    try {
      const res = await fetch('/api/billing/addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addon_id: 'reactivation_10k' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url) window.location.href = data.url
      }
    } catch { /* ignore */ }
    finally { setAddonLoading(false) }
  }

  const periodEndStr = periodEnd
    ? new Date(periodEnd).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

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
          {PLANS.map((plan, planIndex) => {
            const isCurrent = plan.id === currentPlanId
            const isPlanCustom = plan.id === 'custom'
            const isMostPopular = plan.id === 'business'
            const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice
            const isBusy = selectingPlan === plan.id

            const currentIndex = PLANS.findIndex(p => p.id === currentPlanId)
            const isDowngrade = currentIndex >= 0 && planIndex < currentIndex && !isPlanCustom

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border bg-white p-5 transition-shadow ${
                  isCurrent ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                  : isDowngrade ? 'border-slate-100 opacity-60'
                  : isMostPopular ? 'border-purple-400 ring-2 ring-purple-400/30'
                  : 'border-slate-200 hover:shadow-md'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-semibold text-white shadow">
                      Aktif Plan
                    </span>
                  </div>
                )}
                {isMostPopular && !isCurrent && !isDowngrade && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-purple-500 px-3 py-0.5 text-[11px] font-semibold text-white shadow">
                      En Popüler
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <span className={plan.color}>{plan.icon}</span>
                  <h3 className="text-base font-semibold text-slate-800">{plan.name}</h3>
                </div>
                <div className="mb-5">
                  {isPlanCustom ? (
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-slate-900">Görüşmeli</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold text-slate-900">${price}</span>
                        <span className="mb-1 text-sm text-slate-400">/ay</span>
                      </div>
                      {interval === 'annual' && (
                        <p className="mt-0.5 text-xs text-slate-400">Yıllık ödeme (${price * 12}/yıl)</p>
                      )}
                    </>
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
                ) : isDowngrade ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-sm font-medium text-slate-400 cursor-not-allowed">
                    Mevcut planınız daha üst
                  </div>
                ) : isPlanCustom ? (
                  <a
                    href="https://calendly.com/ataulufer1/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-lg border border-emerald-500 bg-white py-2 text-center text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 block"
                  >
                    Görüşme Planla
                  </a>
                ) : (
                  <button
                    onClick={() => handleSelect(plan.id)}
                    disabled={isBusy || !!selectingPlan || isDemo}
                    className="w-full rounded-lg bg-brand-500 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
                  >
                    {isBusy ? 'Yükleniyor...' : 'Yükselt'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Abonelik Durumu Kartı ── */}
      {!loading && hasSub && !isCustom && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Abonelik Durumu</h3>
              <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                <span className="font-medium text-slate-700">{planLabel}</span>
                <span className="text-slate-300">|</span>
                <span>{billingInterval === 'annual' ? 'Yıllık' : 'Aylık'}</span>
                {periodEndStr && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      Sonraki fatura: {periodEndStr}
                    </span>
                  </>
                )}
              </div>
            </div>
            {isTrial && (
              <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                Deneme
              </span>
            )}
          </div>

          {cancelAtPeriodEnd ? (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-amber-500" />
                <p className="text-sm text-amber-800">
                  Aboneliğiniz {periodEndStr ? <strong>{periodEndStr}</strong> : 'dönem sonunda'} sona erecek.
                </p>
              </div>
              <button
                onClick={handleReactivate}
                disabled={reactivating || isDemo}
                className="shrink-0 flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
              >
                {reactivating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                İptali Geri Al
              </button>
            </div>
          ) : !isDemo ? (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="text-sm text-slate-400 hover:text-red-500 transition-colors"
            >
              Aboneliği İptal Et
            </button>
          ) : null}
        </div>
      )}

      {/* ── Ödeme Yöntemi Kartı ── */}
      {!loading && hasSub && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Ödeme Yöntemi</h3>
              {pmLoading ? (
                <p className="mt-1 text-sm text-slate-400">Yükleniyor...</p>
              ) : paymentMethod ? (
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <CreditCard size={16} className="text-slate-400" />
                  <span className="font-medium">{cardBrandLabel(paymentMethod.brand)}</span>
                  <span>****{paymentMethod.last4}</span>
                  <span className="text-slate-400">
                    {String(paymentMethod.exp_month).padStart(2, '0')}/{paymentMethod.exp_year}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-400">Kayıtlı kart bulunamadı</p>
              )}
            </div>
            <button
              onClick={handleUpdatePaymentMethod}
              disabled={pmUpdateLoading || isDemo}
              className="shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              {pmUpdateLoading ? 'Yükleniyor...' : 'Güncelle'}
            </button>
          </div>
        </div>
      )}

      {/* ── Fatura Geçmişi ── */}
      {!loading && hasSub && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Fatura Geçmişi</h3>
          </div>
          {invoicesLoading ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">Yükleniyor...</div>
          ) : invoices.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">Henüz fatura yok.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-sm text-slate-500 w-28 shrink-0">
                      {inv.date ? new Date(inv.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      ${inv.amount.toFixed(2)}
                    </span>
                    <InvoiceStatus status={inv.status} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {inv.status === 'open' && (
                      <button
                        onClick={() => handlePayInvoice(inv.id)}
                        disabled={payingInvoice === inv.id || isDemo}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
                      >
                        {payingInvoice === inv.id ? 'Ödeniyor...' : 'Şimdi Öde'}
                      </button>
                    )}
                    {inv.pdf_url && (
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                        title="PDF İndir"
                      >
                        <Download size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reactivation Kredi Paketi ── */}
      {!loading && hasSub && (() => {
        const ent = limitsData?.entitlements?.workflow_reactivation
        if (!ent || !ent.enabled) return null
        const used = ent.used ?? 0
        const limit = ent.limit ?? 0
        const remaining = ent.remaining ?? (limit - used)
        const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
        return (
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Reactivation Kredileri</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {used.toLocaleString('tr-TR')} <span className="text-sm font-normal text-slate-400">/ {limit.toLocaleString('tr-TR')}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{remaining.toLocaleString('tr-TR')} lead kaldı</p>
              </div>
              <button
                onClick={handleBuyAddon}
                disabled={addonLoading || isDemo}
                className="flex items-center gap-1.5 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-60 transition-colors"
              >
                {addonLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                +10.000 Lead — $19
              </button>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })()}

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

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onCanceled={handleCanceled}
        onRetained={handleRetained}
        planName={planLabel}
        periodEnd={periodEnd}
        isTrial={isTrial}
      />
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
  const isDemo = useIsDemo()
  const t = useT()
  const { orgId } = useOrg()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) { setLoading(false); return }
    const supabase = createClient()
    supabase
      .from('support_tickets')
      .select('id, subject, message, status, priority, admin_notes, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .then(({ data: rows }) => {
        setTickets(rows ?? [])
        setLoading(false)
      })
  }, [orgId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo) return
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
        {!isDemo && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Yeni Talep
          </button>
        )}
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

// ─── Form Webhook Section ─────────────────────────────────────────────────────

interface WebhookConfig {
  active: boolean
  api_key: string | null
  default_country_code: string
  field_mapping: Record<string, string>
  webhook_url: string
}

interface MappingRow {
  formField: string
  target: string
}

const MAPPING_TARGETS = [
  { value: '', label: '— Seç —' },
  { value: 'full_name', label: 'Ad Soyad' },
  { value: 'phone', label: 'Telefon' },
  { value: 'email', label: 'E-posta' },
  { value: 'city', label: 'Şehir' },
  { value: 'country', label: 'Ülke' },
]

const CC_OPTIONS = [
  { code: '90',  label: 'TR (+90)' },
  { code: '49',  label: 'DE (+49)' },
  { code: '7',   label: 'RU (+7)' },
  { code: '1',   label: 'US/CA (+1)' },
  { code: '44',  label: 'UK (+44)' },
  { code: '33',  label: 'FR (+33)' },
  { code: '971', label: 'AE (+971)' },
  { code: '966', label: 'SA (+966)' },
]

function FormWebhookSection() {
  const isDemo = useIsDemo()
  const [config, setConfig] = useState<WebhookConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [mappings, setMappings] = useState<MappingRow[]>([])
  const [defaultCC, setDefaultCC] = useState('90')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/settings/form-webhook')
      .then(r => r.ok ? r.json() : null)
      .then((data: WebhookConfig | null) => {
        if (data) {
          setConfig(data)
          setDefaultCC(data.default_country_code || '90')
          const rows = Object.entries(data.field_mapping || {}).map(([formField, target]) => ({ formField, target }))
          setMappings(rows.length > 0 ? rows : [{ formField: '', target: '' }])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleGenerate(regenerate = false) {
    if (isDemo) return
    setSaving(true)
    try {
      const fieldMapping: Record<string, string> = {}
      for (const m of mappings) {
        if (m.formField.trim() && m.target) fieldMapping[m.formField.trim()] = m.target
      }
      const res = await fetch('/api/settings/form-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate_key: regenerate, field_mapping: fieldMapping, default_country_code: defaultCC }),
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
        setShowKey(true)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate() {
    if (isDemo) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/form-webhook', { method: 'DELETE' })
      if (res.ok) setConfig(prev => prev ? { ...prev, active: false } : prev)
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (!config?.api_key || !config?.webhook_url) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.api_key },
        body: JSON.stringify({ name: 'Test Kullanıcı', phone: '05551234567', email: 'test@test.com', mesaj: 'Form webhook test' }),
      })
      const data = await res.json()
      setTestResult(data.success
        ? { success: true, message: `Lead oluşturuldu (ID: ${data.lead_id?.slice(0, 8)}...)` }
        : { success: false, message: data.message || data.error || 'Bilinmeyen hata' }
      )
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Bağlantı hatası' })
    } finally {
      setTesting(false)
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  function addMappingRow() {
    setMappings(prev => [...prev, { formField: '', target: '' }])
  }

  function removeMappingRow(index: number) {
    setMappings(prev => prev.filter((_, i) => i !== index))
  }

  function updateMapping(index: number, field: keyof MappingRow, value: string) {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const maskedKey = config?.api_key
    ? config.api_key.slice(0, 8) + '••••••••••••••••' + config.api_key.slice(-4)
    : null

  // ── Embeddable HTML form (ready to paste) ──
  const htmlFormSnippet = config?.api_key ? `<!-- stoaix Lead Form — web sitenize yapıştırın -->
<form id="stoaix-lead-form" style="max-width:480px;font-family:system-ui,sans-serif;">
  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:14px;font-weight:500;margin-bottom:4px;">Ad Soyad *</label>
    <input type="text" name="full_name" required placeholder="Adınız Soyadınız"
      style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;">
  </div>
  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:14px;font-weight:500;margin-bottom:4px;">Telefon *</label>
    <input type="tel" name="phone" required placeholder="05XX XXX XX XX"
      style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;">
  </div>
  <div style="margin-bottom:12px;">
    <label style="display:block;font-size:14px;font-weight:500;margin-bottom:4px;">E-posta</label>
    <input type="email" name="email" placeholder="ornek@email.com"
      style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;">
  </div>
  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:14px;font-weight:500;margin-bottom:4px;">Mesajınız</label>
    <textarea name="mesaj" rows="3" placeholder="Nasıl yardımcı olabiliriz?"
      style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;resize:vertical;"></textarea>
  </div>
  <!-- Honeypot: botları yakalar, kullanıcılar görmez -->
  <div style="position:absolute;left:-9999px;" aria-hidden="true">
    <input type="text" name="_hp_website" tabindex="-1" autocomplete="off">
  </div>
  <button type="submit"
    style="width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">
    Gönder
  </button>
  <p id="stoaix-form-msg" style="margin-top:8px;font-size:13px;text-align:center;display:none;"></p>
</form>
<script>
document.getElementById('stoaix-lead-form').addEventListener('submit',function(e){
  e.preventDefault();
  var btn=this.querySelector('button[type="submit"]');
  var msg=document.getElementById('stoaix-form-msg');
  btn.disabled=true; btn.textContent='Gönderiliyor...';
  msg.style.display='none';
  fetch('${config.webhook_url}',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':'${config.api_key}'},
    body:JSON.stringify(Object.fromEntries(new FormData(this)))
  })
  .then(function(r){return r.json()})
  .then(function(d){
    if(d.success){
      msg.style.color='#059669'; msg.textContent='Talebiniz alındı! En kısa sürede dönüş yapacağız.';
      msg.style.display='block'; e.target.reset();
    } else {
      msg.style.color='#dc2626'; msg.textContent=d.message||'Bir hata oluştu.';
      msg.style.display='block';
    }
    btn.disabled=false; btn.textContent='Gönder';
  })
  .catch(function(){
    msg.style.color='#dc2626'; msg.textContent='Bağlantı hatası. Lütfen tekrar deneyin.';
    msg.style.display='block'; btn.disabled=false; btn.textContent='Gönder';
  });
});
</script>` : ''

  // ── JS snippet for existing forms ──
  const jsSnippet = config?.api_key ? `<!-- Mevcut formunuza ekleyin: #YOUR_FORM_ID yerine formunuzun ID'sini yazın -->
<script>
document.querySelector('#YOUR_FORM_ID').addEventListener('submit', function(e) {
  e.preventDefault();
  fetch('${config.webhook_url}', {
    method: 'POST',
    headers: {'Content-Type':'application/json','x-api-key':'${config.api_key}'},
    body: JSON.stringify(Object.fromEntries(new FormData(this)))
  }).then(r => r.json()).then(d => { if(d.success) alert('Gönderildi!'); });
});
</script>` : ''

  const curlSnippet = config?.api_key ? `curl -X POST ${config.webhook_url} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${config.api_key}" \\
  -d '{"full_name":"Test","phone":"05551234567","email":"test@test.com"}'` : ''

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 bg-slate-100 rounded" />
          <div className="h-32 bg-slate-50 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Website Form Webhook</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Web sitenizdeki formları platforma bağlayın. Form gönderildiğinde otomatik lead oluşturulur ve AI akışları tetiklenir.
        </p>
      </div>

      {/* API Key Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-brand-500" />
              <span className="text-sm font-semibold text-slate-800">API Anahtarı</span>
            </div>
            {config?.active && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {config?.api_key ? (
            <>
              {/* Key display */}
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 truncate">
                  {showKey ? config.api_key : maskedKey}
                </code>
                <button onClick={() => setShowKey(v => !v)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title={showKey ? 'Gizle' : 'Göster'}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => copyToClipboard(config.api_key!, 'key')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Kopyala">
                  {copied === 'key' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>

              {/* Webhook URL */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Webhook URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 truncate">
                    {config.webhook_url}
                  </code>
                  <button onClick={() => copyToClipboard(config.webhook_url, 'url')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Kopyala">
                    {copied === 'url' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                {!isDemo && (
                  <>
                    <button onClick={() => handleGenerate(true)} disabled={saving}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-amber-200 text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors">
                      <RefreshCw size={12} /> Yenile
                    </button>
                    <button onClick={handleDeactivate} disabled={saving}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">
                      <Trash2 size={12} /> Devre Dışı Bırak
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 mb-3">Henüz API anahtarı oluşturulmadı.</p>
              {!isDemo && (
                <button onClick={() => handleGenerate(false)} disabled={saving}
                  className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  API Anahtarı Oluştur
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Country Code + Field Mapping */}
      {config?.api_key && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Ayarlar</span>
          </div>
          <div className="px-5 py-4 space-y-5">
            {/* Default Country Code */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Varsayılan Ülke Kodu</label>
              <select value={defaultCC} onChange={e => setDefaultCC(e.target.value)}
                className="w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                {CC_OPTIONS.map(cc => (
                  <option key={cc.code} value={cc.code}>{cc.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Ülke kodu olmayan telefon numaraları için kullanılır</p>
            </div>

            {/* Field Mapping */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Alan Eşleştirme</label>
              <p className="text-xs text-slate-400 mb-3">Formunuzdaki alan adlarını platform alanlarına eşleyin. Eşlenmeyen alanlar ek veri olarak kaydedilir.</p>
              <div className="space-y-2">
                {mappings.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={m.formField} onChange={e => updateMapping(i, 'formField', e.target.value)}
                      placeholder="Form alan adı (ör: ad_soyad)"
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <span className="text-slate-300 text-sm">→</span>
                    <select value={m.target} onChange={e => updateMapping(i, 'target', e.target.value)}
                      className="w-36 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                      {MAPPING_TARGETS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {mappings.length > 1 && (
                      <button onClick={() => removeMappingRow(i)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addMappingRow} className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 mt-2 font-medium">
                <Plus size={12} /> Eşleştirme Ekle
              </button>
            </div>

            {/* Save */}
            {!isDemo && (
              <button onClick={() => handleGenerate(false)} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Kaydet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Embeddable HTML Form */}
      {config?.api_key && (
        <div className="bg-white rounded-xl border border-brand-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-100 bg-brand-50">
            <span className="text-sm font-semibold text-brand-800">Hazır Form Kodu (Kolay Yöntem)</span>
            <p className="text-xs text-brand-600 mt-0.5">Bu kodu web sitenize yapıştırmanız yeterli. Form otomatik çalışır.</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5 text-xs text-emerald-700">
              <strong>Nasıl kullanılır:</strong> Aşağıdaki kodu kopyalayın ve web sitenizin HTML'ine (iletişim sayfası, popup, footer vb.) yapıştırın.
              Form görünümünü CSS ile özelleştirebilirsiniz. Gönderilen her form otomatik olarak lead olarak kaydedilir ve AI akışlarınız tetiklenir.
            </div>
            <div className="flex items-center justify-end">
              <button onClick={() => copyToClipboard(htmlFormSnippet, 'html')} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors">
                {copied === 'html' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />} HTML Kodu Kopyala
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre max-h-80 overflow-y-auto">
              {htmlFormSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* Advanced Integration */}
      {config?.api_key && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Gelişmiş Entegrasyon (Manuel)</span>
            <p className="text-xs text-slate-400 mt-0.5">Mevcut formunuz varsa veya özel entegrasyon gerekiyorsa aşağıdaki kodları kullanın.</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* JS Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <label className="text-xs font-medium text-slate-500">JavaScript — Mevcut Forma Bağlama</label>
                  <p className="text-xs text-slate-400">Sitenizde zaten bir form varsa, bu kodu formunuzun altına ekleyin. <code className="bg-slate-100 px-1 rounded">#YOUR_FORM_ID</code> kısmını formunuzun ID'si ile değiştirin.</p>
                </div>
                <button onClick={() => copyToClipboard(jsSnippet, 'js')} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 flex-shrink-0 ml-3">
                  {copied === 'js' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />} Kopyala
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre mt-2">
                {jsSnippet}
              </pre>
            </div>

            {/* cURL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <label className="text-xs font-medium text-slate-500">cURL — API Testi</label>
                  <p className="text-xs text-slate-400">Terminal'den test etmek için kullanın.</p>
                </div>
                <button onClick={() => copyToClipboard(curlSnippet, 'curl')} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 flex-shrink-0 ml-3">
                  {copied === 'curl' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />} Kopyala
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre mt-2">
                {curlSnippet}
              </pre>
            </div>

            {/* Field names info */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-xs text-slate-500">
              <p className="font-medium text-slate-600 mb-1.5">Tanınan alan adları (otomatik eşleşir):</p>
              <div className="grid grid-cols-2 gap-1">
                <span><code className="bg-white px-1 rounded border">full_name</code> / <code className="bg-white px-1 rounded border">name</code> / <code className="bg-white px-1 rounded border">ad_soyad</code></span>
                <span>→ Ad Soyad</span>
                <span><code className="bg-white px-1 rounded border">phone</code> / <code className="bg-white px-1 rounded border">telefon</code> / <code className="bg-white px-1 rounded border">tel</code></span>
                <span>→ Telefon</span>
                <span><code className="bg-white px-1 rounded border">email</code> / <code className="bg-white px-1 rounded border">eposta</code></span>
                <span>→ E-posta</span>
                <span><code className="bg-white px-1 rounded border">city</code> / <code className="bg-white px-1 rounded border">sehir</code></span>
                <span>→ Şehir</span>
              </div>
              <p className="mt-2 text-slate-400">Diğer tüm alanlar otomatik olarak lead'in ek verilerine kaydedilir. Yukarıdaki "Alan Eşleştirme" bölümünden özel eşleştirmeler tanımlayabilirsiniz.</p>
            </div>

            {/* Test */}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={handleTest} disabled={testing}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">
                {testing ? <Loader2 size={12} className="animate-spin" /> : <TestTube2 size={12} />}
                Test Gönder
              </button>
              {testResult && (
                <span className={`text-xs ${testResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                  {testResult.message}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Language & Timezone constants ───────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'nl', label: 'Nederlands' },
]

const TIMEZONE_OPTIONS = [
  { group: 'Avrupa', zones: ['Europe/Istanbul', 'Europe/Berlin', 'Europe/London', 'Europe/Paris', 'Europe/Moscow'] },
  { group: 'Orta Doğu', zones: ['Asia/Dubai', 'Asia/Riyadh', 'Asia/Baghdad'] },
  { group: 'Amerika', zones: ['America/New_York', 'America/Chicago', 'America/Los_Angeles'] },
]

// ─── General Section ─────────────────────────────────────────────────────────

function GeneralSection() {
  const { userRole } = useOrg()
  const isDemo = useIsDemo()
  const readOnly = userRole === 'muhasebe'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lang, setLang] = useState('tr')
  const [tz, setTz] = useState('Europe/Berlin')
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/settings/general')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setLang(d.default_language ?? 'tr')
          setTz(d.timezone ?? 'Europe/Berlin')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (isDemo || readOnly) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/general', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_language: lang, timezone: tz }),
      })
      if (res.ok) {
        setToast('Ayarlar kaydedildi')
        setTimeout(() => setToast(''), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-10 w-64 bg-slate-100 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-10 w-64 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Globe size={18} className="text-brand-600" />
        <h2 className="text-base font-semibold text-slate-800">Genel Ayarlar</h2>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Varsayılan Dil</label>
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          disabled={readOnly}
          className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
        >
          {LANGUAGE_OPTIONS.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">AI asistanın ve sistem mesajlarının varsayılan dili</p>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Saat Dilimi</label>
        <select
          value={tz}
          onChange={e => setTz(e.target.value)}
          disabled={readOnly}
          className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
        >
          {TIMEZONE_OPTIONS.map(g => (
            <optgroup key={g.group} label={g.group}>
              {g.zones.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">İş akışları ve randevu zamanlaması için kullanılır</p>
      </div>

      {/* Save */}
      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Kaydet
          </button>
          {toast && (
            <span className="text-sm text-emerald-600 flex items-center gap-1">
              <Check size={14} /> {toast}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

type SettingsTab = 'genel' | 'moduller' | 'billing' | 'pipelinelar' | 'formwebhook' | 'support'

function SettingsPageInner() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as SettingsTab) ?? 'genel'
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    ['genel', 'moduller', 'billing', 'pipelinelar', 'formwebhook', 'support'].includes(initialTab) ? initialTab : 'genel'
  )

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'genel',       label: 'Genel' },
    { key: 'moduller',    label: 'Modüller' },
    { key: 'billing',     label: 'Plan & Fatura' },
    { key: 'pipelinelar', label: 'Pipelinelar' },
    { key: 'formwebhook', label: 'Form Webhook' },
    { key: 'support',     label: 'Destek Talebi' },
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

      {activeTab === 'genel'       && <GeneralSection />}
      {activeTab === 'moduller'    && <ModulesSection />}
      {activeTab === 'billing'     && <BillingSection />}
      {activeTab === 'pipelinelar' && <PipelineSettings />}
      {activeTab === 'formwebhook' && <FormWebhookSection />}
      {activeTab === 'support'     && <SupportSection />}
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
