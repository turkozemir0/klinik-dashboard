'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

interface Props {
  trialEndsAt: string | null
  planId: string
}

export default function TrialBanner({ trialEndsAt, planId }: Props) {
  // Don't render for legacy plan or no trial date
  if (!trialEndsAt || planId === 'legacy') return null

  const now = new Date()
  const endsAt = new Date(trialEndsAt)

  // Don't render if trial has already ended
  if (endsAt <= now) return null

  const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / 86400000)

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Zap size={16} className="shrink-0 text-amber-500" />
        <p className="text-sm text-amber-800 font-medium truncate">
          <span className="font-bold">{daysLeft} gun</span> deneme sureniz kaldi — Plani aktifleştirin ve kesintisiz kullanmaya devam edin.
        </p>
      </div>
      <Link
        href="/dashboard/billing"
        className="shrink-0 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
      >
        Planı Aktifleştir
      </Link>
    </div>
  )
}
