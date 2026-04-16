'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Phone, BookOpen } from 'lucide-react'

interface UsageItem {
  key: string
  label: string
  icon: React.ReactNode
  used: number
  limit: number | null
}

interface Props {
  orgId: string
  collapsed?: boolean
}

export default function UsageWidget({ orgId, collapsed }: Props) {
  const [items, setItems] = useState<UsageItem[]>([])
  const [loading, setLoading] = useState(true)

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

        // metricKey = DB metric, featureKey = entitlements key
        const metered: { metricKey: string; featureKey: string; label: string; icon: React.ReactNode }[] = [
          { metricKey: 'whatsapp_outbound_msgs', featureKey: 'whatsapp_outbound', label: 'WhatsApp', icon: <MessageSquare size={12} /> },
          { metricKey: 'voice_minutes',          featureKey: 'voice_agent_inbound', label: 'Ses (dk)',  icon: <Phone size={12} /> },
          { metricKey: 'kb_item_count',          featureKey: 'kb_write',            label: 'KB Öğesi',  icon: <BookOpen size={12} /> },
        ]

        const built: UsageItem[] = []
        for (const m of metered) {
          const limit = entitlements[m.featureKey]?.limit ?? null
          // If no limit (unlimited or not metered), skip
          if (limit === null || limit === -1 || limit === 0) continue
          const used = usageMap[m.metricKey] ?? 0
          built.push({ key: m.metricKey, label: m.label, icon: m.icon, used, limit })
        }

        setItems(built)
      } catch {
        // silently ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orgId])

  if (loading) {
    if (collapsed) return null
    return (
      <div className="space-y-2 px-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-3 bg-slate-800 rounded" />
        ))}
      </div>
    )
  }

  if (items.length === 0) return null

  // Collapsed: just show a small usage dot/icon
  if (collapsed) {
    const hasOverage = items.some(it => it.limit && it.used / it.limit >= 0.95)
    return (
      <div
        className="flex justify-center px-2 pb-2"
        title="Kullanim limitleri"
      >
        <div
          className={`h-2 w-2 rounded-full ${hasOverage ? 'bg-red-500' : 'bg-emerald-500'}`}
        />
      </div>
    )
  }

  return (
    <div className="border-t border-white/10 px-3 py-3 space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Kullanim
      </p>
      {items.map(item => {
        const pct = item.limit ? Math.min(100, Math.round((item.used / item.limit) * 100)) : 0
        const barColor =
          pct >= 95 ? 'bg-red-500' :
          pct >= 80 ? 'bg-amber-400' :
          'bg-brand-500'

        return (
          <div key={item.key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                {item.icon}
                <span className="text-[11px]">{item.label}</span>
              </div>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {item.used.toLocaleString('tr-TR')}/{item.limit?.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
