'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Phone, BookOpen, Upload, Users, Webhook } from 'lucide-react'

interface UsageMetric {
  key: string
  label: string
  icon: React.ReactNode
  used: number
  limit: number | null  // null = unlimited
}

function getBarColor(pct: number) {
  if (pct >= 95) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function getTextColor(pct: number) {
  if (pct >= 95) return 'text-red-600'
  if (pct >= 80) return 'text-amber-600'
  return 'text-emerald-600'
}

// metricKey = usage_counters.metric, featureKey = plan_entitlements.feature_key
const METRIC_META: { key: string; featureKey: string; label: string; icon: React.ReactNode }[] = [
  { key: 'whatsapp_outbound_msgs', featureKey: 'whatsapp_outbound',       label: 'WhatsApp Mesajları',  icon: <MessageSquare size={20} className="text-blue-500" /> },
  { key: 'voice_minutes',          featureKey: 'voice_agent_inbound',     label: 'Ses Dakikası',        icon: <Phone size={20} className="text-purple-500" /> },
  { key: 'kb_item_count',          featureKey: 'kb_write',                label: 'Bilgi Bankası Öğesi', icon: <BookOpen size={20} className="text-amber-500" /> },
  { key: 'import_row_count',       featureKey: 'leads_import_csv',        label: 'CSV Import',          icon: <Upload size={20} className="text-slate-500" /> },
  { key: 'team_member_count',      featureKey: 'multi_team',              label: 'Ekip Üyesi',          icon: <Users size={20} className="text-emerald-500" /> },
  { key: 'template_count',         featureKey: 'whatsapp_templates',      label: 'WA Template',         icon: <Webhook size={20} className="text-indigo-500" /> },
]

function UsageCard({ metric }: { metric: UsageMetric }) {
  const isUnlimited = metric.limit === null || metric.limit === -1
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((metric.used / (metric.limit ?? 1)) * 100))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
            {metric.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{metric.label}</p>
            {isUnlimited ? (
              <p className="text-xs text-slate-400">Sınırsız</p>
            ) : (
              <p className={`text-xs font-medium ${getTextColor(pct)}`}>
                {pct}% kullanıldı
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-slate-900 tabular-nums">
            {metric.used.toLocaleString('tr-TR')}
          </span>
          {!isUnlimited && (
            <p className="text-xs text-slate-400 mt-0.5">
              / {metric.limit?.toLocaleString('tr-TR')}
            </p>
          )}
        </div>
      </div>

      {isUnlimited ? (
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full w-full rounded-full bg-emerald-400/40" />
        </div>
      ) : (
        <div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getBarColor(pct)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>{metric.used.toLocaleString('tr-TR')} kullanıldı</span>
            <span>{((metric.limit ?? 0) - metric.used).toLocaleString('tr-TR')} kalan</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UsagePage() {
  const [metrics, setMetrics] = useState<UsageMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [periodLabel, setPeriodLabel] = useState('Aylık Kullanım')

  useEffect(() => {
    async function load() {
      try {
        const [usageRes, limitsRes] = await Promise.all([
          fetch('/api/billing/usage'),
          fetch('/api/billing/limits'),
        ])

        if (!usageRes.ok || !limitsRes.ok) return

        const usageData = await usageRes.json()
        const limitsData = await limitsRes.json()

        const usageMap: Record<string, number> = usageData.usage ?? {}
        const entitlements: Record<string, any> = limitsData.entitlements ?? {}

        // Build period label
        const period: string = usageData.period ?? ''
        if (period) {
          // period format: "2026-04"
          const [year, month] = period.split('-')
          const d = new Date(Number(year), Number(month) - 1, 1)
          const label = d.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })
          setPeriodLabel(label.charAt(0).toUpperCase() + label.slice(1))
        } else {
          const now = new Date()
          const label = now.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })
          setPeriodLabel(label.charAt(0).toUpperCase() + label.slice(1))
        }

        const built: UsageMetric[] = METRIC_META.map(m => {
          const ent = entitlements[m.featureKey]
          const rawLimit = ent?.limit ?? null
          const limit = (rawLimit === 0 || rawLimit === -1) ? null : rawLimit
          const used = usageMap[m.key] ?? 0
          return { key: m.key, label: m.label, icon: m.icon, used, limit }
        }).filter(m => m.used > 0 || m.limit !== null)

        setMetrics(built)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aylık Kullanım</h1>
          <p className="mt-1 text-sm text-slate-500">{periodLabel}</p>
        </div>
        <a
          href="/dashboard/billing"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Plan Detayları
        </a>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-lg" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                  <div className="h-2.5 w-16 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-8 w-20 bg-slate-100 rounded" />
              <div className="h-2.5 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Metrics grid */}
      {!loading && metrics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(m => (
            <UsageCard key={m.key} metric={m} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && metrics.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Henüz kullanım verisi bulunmuyor.</p>
        </div>
      )}

      {/* Legend */}
      {!loading && metrics.length > 0 && (
        <div className="flex items-center gap-6 rounded-xl border border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-xs font-medium text-slate-500">Renk kodları:</p>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-6 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Normal (&lt;%80)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-6 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-500">Dikkat (%80–95)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-6 rounded-full bg-red-500" />
            <span className="text-xs text-slate-500">Kritik (&gt;%95)</span>
          </div>
        </div>
      )}
    </div>
  )
}
