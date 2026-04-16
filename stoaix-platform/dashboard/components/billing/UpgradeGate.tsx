'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'

interface Props {
  feature: string
  children: React.ReactNode
}

export default function UpgradeGate({ feature, children }: Props) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkFeature() {
      try {
        const res = await fetch('/api/billing/limits')
        if (!res.ok) {
          // On error, optimistically allow
          setEnabled(true)
          return
        }
        const data = await res.json()
        const entitlements = data.entitlements ?? {}
        if (entitlements[feature] !== undefined) {
          setEnabled(entitlements[feature].enabled !== false)
        } else {
          // Feature not found in limits — optimistically allow
          setEnabled(true)
        }
      } catch {
        setEnabled(true)
      } finally {
        setLoading(false)
      }
    }
    checkFeature()
  }, [feature])

  // Optimistic: show children while loading
  if (loading || enabled === null || enabled === true) {
    return <>{children}</>
  }

  // Feature disabled — show blur overlay
  return (
    <div className="relative">
      {/* Blurred children */}
      <div className="pointer-events-none select-none blur-sm" aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-lg text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Lock size={22} className="text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Bu ozellik planinizda yok</p>
            <p className="mt-1 text-xs text-slate-500">
              Bu ozelligi kullanmak icin planınızı yükseltin.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Planı Yukselt
          </Link>
        </div>
      </div>
    </div>
  )
}
