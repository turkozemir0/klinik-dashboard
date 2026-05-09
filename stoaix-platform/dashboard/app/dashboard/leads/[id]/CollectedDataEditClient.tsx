'use client'

import { useState } from 'react'
import { Pencil, Check, X, Loader2, Plus, Trash2 } from 'lucide-react'
import { t } from '@/lib/i18n'

interface Props {
  leadId: string
  initialData: Record<string, any>
  userRole: string | null
}

export default function CollectedDataEditClient({ leadId, initialData, userRole }: Props) {
  const canEdit = ['admin', 'yönetici', 'satisci'].includes(userRole ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Convert object to entries for editing
  const [displayData, setDisplayData] = useState<Record<string, any>>(initialData || {})
  const [entries, setEntries] = useState<{ key: string; value: string; isNew: boolean }[]>([])

  function handleStartEdit() {
    setEntries(
      Object.entries(displayData).map(([key, value]) => ({
        key,
        value: String(value ?? ''),
        isNew: false,
      }))
    )
    setError('')
    setEditing(true)
  }

  function addEntry() {
    setEntries([...entries, { key: '', value: '', isNew: true }])
  }

  function removeEntry(index: number) {
    setEntries(entries.filter((_, i) => i !== index))
  }

  function updateEntry(index: number, field: 'key' | 'value', val: string) {
    setEntries(entries.map((e, i) => i === index ? { ...e, [field]: val } : e))
  }

  async function handleSave() {
    // Validate: no empty keys
    const hasEmptyKey = entries.some(e => !e.key.trim())
    if (hasEmptyKey) {
      setError('Alan adı boş olamaz')
      return
    }

    // Check duplicate keys
    const keys = entries.map(e => e.key.trim())
    if (new Set(keys).size !== keys.length) {
      setError('Aynı alan adı birden fazla kullanılamaz')
      return
    }

    setSaving(true)
    setError('')

    const collected_data: Record<string, any> = {}
    for (const e of entries) {
      collected_data[e.key.trim()] = e.value
    }

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collected_data }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Güncelleme başarısız')
        setSaving(false)
        return
      }

      setDisplayData(collected_data)
      setEditing(false)
    } catch {
      setError('Bağlantı hatası')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">{t.collectedData}</h2>
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
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={entry.key}
                onChange={e => updateEntry(i, 'key', e.target.value)}
                disabled={!entry.isNew}
                placeholder="Alan adı"
                className="w-1/3 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
              <input
                value={entry.value}
                onChange={e => updateEntry(i, 'value', e.target.value)}
                placeholder="Değer"
                className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button onClick={() => removeEntry(i)} className="text-slate-400 hover:text-red-500 flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={addEntry}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-1"
          >
            <Plus size={12} /> Yeni Alan Ekle
          </button>
        </div>
      ) : (
        <>
          {Object.keys(displayData).length === 0 ? (
            <p className="text-sm text-slate-400">{t.noData}</p>
          ) : (
            <dl className="space-y-2">
              {Object.entries(displayData).map(([key, value]) => (
                value != null ? (
                  <div key={key} className="flex text-sm">
                    <dt className="w-36 text-slate-500 flex-shrink-0 truncate capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd className="text-slate-800 font-medium">{String(value)}</dd>
                  </div>
                ) : null
              ))}
            </dl>
          )}
        </>
      )}
    </div>
  )
}
