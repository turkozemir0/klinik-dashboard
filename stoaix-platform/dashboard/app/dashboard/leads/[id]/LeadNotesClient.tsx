'use client'

import { useState } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'

interface Props {
  leadId: string
  initialNotes: string | null
  aiSummary: string | null
  userRole: string | null
}

export default function LeadNotesClient({ leadId, initialNotes, aiSummary, userRole }: Props) {
  const canEdit = ['admin', 'yönetici', 'satisci'].includes(userRole ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState(initialNotes || '')
  const [displayNotes, setDisplayNotes] = useState(initialNotes || '')

  function handleStartEdit() {
    setNotes(displayNotes)
    setError('')
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Güncelleme başarısız')
        setSaving(false)
        return
      }

      setDisplayNotes(notes)
      setEditing(false)
    } catch {
      setError('Bağlantı hatası')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Notlar</h2>
        {canEdit && !editing && (
          <button onClick={handleStartEdit} className="text-slate-400 hover:text-slate-600">
            <Pencil size={14} />
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-2">{error}</p>}

      {editing ? (
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Not ekleyin..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      ) : (
        <>
          {displayNotes ? (
            <div className="text-sm text-slate-700 whitespace-pre-line">{displayNotes}</div>
          ) : (
            <p className="text-sm text-slate-400">Henüz not yok.{canEdit ? ' Kalem ikonuna tıklayarak ekleyin.' : ''}</p>
          )}
        </>
      )}

      {aiSummary && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-medium text-slate-500 mb-1">AI Özeti</h3>
          <div className="text-sm text-slate-600 whitespace-pre-line">{aiSummary}</div>
        </div>
      )}
    </div>
  )
}
