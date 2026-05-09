'use client'

import { useState } from 'react'
import { CheckCircle2, PhoneOff, XCircle, Clock, ChevronDown } from 'lucide-react'

const OUTCOMES = [
  { value: 'in_progress', label: 'Devam Ediyor', color: 'text-blue-600', Icon: Clock },
  { value: 'converted',   label: 'Dönüştü',       color: 'text-emerald-600', Icon: CheckCircle2 },
  { value: 'no_answer',   label: 'Cevap Yok',      color: 'text-slate-500',   Icon: PhoneOff },
  { value: 'lost',        label: 'Kaybedildi',     color: 'text-red-500',     Icon: XCircle },
] as const

type OutcomeValue = typeof OUTCOMES[number]['value']

interface Props {
  handoffId: string
  initialOutcome: string | null
  initialNotes: string | null
  triggerReason: string
  routingTarget?: string | null
  summary?: string | null
  missingAtHandoff?: string[]
  userRole: string | null
}

export default function HandoffOutcomeClient({
  handoffId,
  initialOutcome,
  initialNotes,
  triggerReason,
  routingTarget,
  summary,
  missingAtHandoff,
  userRole,
}: Props) {
  const [outcome, setOutcome]   = useState<OutcomeValue>((initialOutcome as OutcomeValue) ?? 'in_progress')
  const [notes, setNotes]       = useState(initialNotes ?? '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const canEdit = ['admin', 'yönetici', 'satisci'].includes(userRole ?? '')
  const current = OUTCOMES.find(o => o.value === outcome)
  const { Icon } = current!

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/handoff/${handoffId}/outcome`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome, notes: notes || undefined }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setShowEdit(false)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-amber-800">Handoff Bilgisi</h2>
        {canEdit && (
          <button
            onClick={() => setShowEdit(p => !p)}
            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"
          >
            Sonuç Gir <ChevronDown size={12} className={`transition-transform ${showEdit ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <div className="text-sm text-amber-700 space-y-1 mt-2">
        <p><span className="font-medium">Neden:</span> {triggerReason}</p>
        {routingTarget && <p><span className="font-medium">Yönlendirme:</span> {routingTarget}</p>}
        {summary && <p className="mt-1 text-amber-800 bg-amber-100 rounded px-2 py-1">{summary}</p>}
        {missingAtHandoff && missingAtHandoff.length > 0 && (
          <p><span className="font-medium">Eksik:</span> {missingAtHandoff.join(', ')}</p>
        )}
      </div>

      {/* Outcome badge */}
      <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${current!.color}`}>
        <Icon size={13} />
        {current!.label}
        {notes && <span className="font-normal text-slate-500 ml-1">· {notes}</span>}
        {saved && <span className="text-emerald-600 font-normal ml-1">· Kaydedildi</span>}
      </div>

      {/* Outcome editor */}
      {showEdit && canEdit && (
        <div className="mt-4 space-y-3 border-t border-amber-200 pt-4">
          <p className="text-xs font-medium text-amber-800">Handoff Sonucu</p>
          <div className="grid grid-cols-2 gap-2">
            {OUTCOMES.map(o => {
              const OIcon = o.Icon
              return (
                <button
                  key={o.value}
                  onClick={() => setOutcome(o.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    outcome === o.value
                      ? 'border-amber-400 bg-amber-100 ' + o.color
                      : 'border-amber-200 bg-white text-slate-600 hover:bg-amber-50'
                  }`}
                >
                  <OIcon size={13} />
                  {o.label}
                </button>
              )
            })}
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Not ekle (isteğe bağlı)..."
            className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none placeholder:text-slate-300"
          />
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}
    </div>
  )
}
