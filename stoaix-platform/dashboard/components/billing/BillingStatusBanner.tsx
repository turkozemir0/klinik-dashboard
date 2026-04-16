'use client'

import { useState, useEffect } from 'react'
import TrialBanner from './TrialBanner'
import DunningBanner from './DunningBanner'

export default function BillingStatusBanner() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/billing/limits')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setData(d))
      .catch(() => {})
  }, [])

  if (!data) return null

  const planId: string = data.plan_id ?? 'legacy'
  const status: string = data.status ?? ''
  const trialEndsAt: string | null = data.trial_ends_at ?? null

  const hasDunning = ['grace_period', 'past_due', 'suspended'].includes(status)
  const hasTrial = !!(trialEndsAt && planId !== 'legacy')

  if (!hasDunning && !hasTrial) return null

  return (
    <div className="space-y-2 px-6 pt-4">
      <DunningBanner status={status} />
      <TrialBanner trialEndsAt={trialEndsAt} planId={planId} />
    </div>
  )
}
