'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'new', label: 'Yeni', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'İşlemde', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'handed_off', label: 'Devredildi', color: 'bg-orange-100 text-orange-700' },
  { value: 'nurturing', label: 'Nurturing', color: 'bg-purple-100 text-purple-700' },
  { value: 'qualified', label: 'Kalifiye', color: 'bg-green-100 text-green-700' },
  { value: 'converted', label: 'Dönüştü', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'lost', label: 'Kayıp', color: 'bg-red-100 text-red-700' },
]

interface Props {
  leadId: string
  initialStatus: string
  userRole: string | null
}

export default function LeadStatusSelectClient({ leadId, initialStatus, userRole }: Props) {
  const canEdit = ['admin', 'yönetici', 'satisci'].includes(userRole ?? '')
  const [status, setStatus] = useState(initialStatus)
  const [saving, setSaving] = useState(false)

  const current = STATUS_OPTIONS.find(s => s.value === status)

  async function handleChange(newStatus: string) {
    if (newStatus === status) return
    setSaving(true)

    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setStatus(newStatus)
      }
    } catch {
      // Silently fail
    }
    setSaving(false)
  }

  if (!canEdit) {
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${current?.color || 'bg-slate-100 text-slate-600'}`}>
        {current?.label || status}
      </span>
    )
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <select
        value={status}
        onChange={e => handleChange(e.target.value)}
        disabled={saving}
        className={`text-xs font-medium pl-2.5 pr-7 py-1 rounded-full border-0 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${current?.color || 'bg-slate-100 text-slate-600'}`}
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {saving && <Loader2 size={12} className="animate-spin text-slate-400" />}
    </div>
  )
}
