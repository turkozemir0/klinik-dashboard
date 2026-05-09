'use client'

import { AlertTriangle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Props {
  entitlements: Record<string, { enabled: boolean; limit: number | null; used: number | null; remaining: number | null }>
}

const TRACKED_FEATURES: { key: string; label: string }[] = [
  { key: 'ai_conversations', label: 'AI Konuşma' },
  { key: 'voice_agent_inbound', label: 'Ses Dakikası' },
]

export default function UsageLimitBanner({ entitlements }: Props) {
  if (!entitlements) return null

  const warnings: { label: string; pct: number; used: number; limit: number }[] = []

  for (const feat of TRACKED_FEATURES) {
    const ent = entitlements[feat.key]
    if (!ent || !ent.enabled || ent.limit === null || ent.limit <= 0) continue
    const used = ent.used ?? 0
    const pct = Math.round((used / ent.limit) * 100)
    if (pct >= 80) {
      warnings.push({ label: feat.label, pct, used, limit: ent.limit })
    }
  }

  if (warnings.length === 0) return null

  const isCritical = warnings.some(w => w.pct >= 95)

  return (
    <Link
      href="/dashboard/billing/usage"
      className={`block rounded-xl border px-5 py-3 transition-colors ${
        isCritical
          ? 'border-red-200 bg-red-50 hover:bg-red-100'
          : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
      }`}
    >
      <div className="flex items-start gap-3">
        {isCritical ? (
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
        ) : (
          <TrendingUp size={16} className="mt-0.5 shrink-0 text-amber-500" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isCritical ? 'text-red-800' : 'text-amber-800'}`}>
            {isCritical ? 'Limitinize yaklaşıyorsunuz!' : 'Kullanımınız artıyor'}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {warnings.map(w => (
              <span key={w.label} className={`text-xs ${isCritical ? 'text-red-700' : 'text-amber-700'}`}>
                {w.label}: {w.used.toLocaleString('tr-TR')}/{w.limit.toLocaleString('tr-TR')} ({w.pct}%)
              </span>
            ))}
          </div>
          <p className={`mt-1 text-xs ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
            Ek paket almak için tıklayın →
          </p>
        </div>
      </div>
    </Link>
  )
}
