'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, Loader2 } from 'lucide-react'

export function ExcludedPhonesConfig() {
  const [phones, setPhones] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/settings/excluded-phones')
      .then((r) => r.json())
      .then((d) => setPhones(d.phones ?? []))
      .catch(() => setError('Yuklenemedi'))
      .finally(() => setLoading(false))
  }, [])

  async function save(updated: string[]) {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/settings/excluded-phones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones: updated }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPhones(data.phones)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (e: any) {
      setError(e.message ?? 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  function addPhones() {
    if (!input.trim()) return
    const parsed = input.split(/[\s,\n]+/).map((s) => s.trim()).filter(Boolean)
    const merged = Array.from(new Set([...phones, ...parsed]))
    setInput('')
    save(merged)
  }

  function remove(phone: string) {
    save(phones.filter((p) => p !== phone))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Bu numaralara gelen mesajlara AI yanit vermez. Numaralari ulke kodu ile girin.
      </p>

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addPhones() } }}
          placeholder="+4915123456789&#10;+90 555 000 00 00"
          rows={3}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={addPhones}
          disabled={saving || !input.trim()}
          className="self-start flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Ekle
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Kaydedildi.</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
          <Loader2 size={14} className="animate-spin" /> Yukleniyor...
        </div>
      ) : phones.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">Henuz haric tutulan numara yok.</p>
      ) : (
        <ul className="space-y-1">
          {phones.map((phone) => (
            <li key={phone} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
              <span className="font-mono text-slate-700">{phone}</span>
              <button
                onClick={() => remove(phone)}
                disabled={saving}
                className="text-slate-400 hover:text-red-500 disabled:opacity-40 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
