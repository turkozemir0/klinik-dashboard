'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

const LANGUAGES = [
  { value: '', label: 'Org Varsayılanı' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' },
]

interface Props {
  contactId: string
  initialLanguage: string | null
}

export default function ContactLanguageSelect({ contactId, initialLanguage }: Props) {
  const [language, setLanguage] = useState(initialLanguage ?? '')
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setLanguage(val)
    setSaving(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_language: val || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Güncelleme başarısız')
        setLanguage(initialLanguage ?? '')
      }
    } catch {
      setLanguage(initialLanguage ?? '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
      <Globe size={14} className="text-slate-400" />
      <label className="text-xs text-slate-500">Ses Dili:</label>
      <select
        value={language}
        onChange={handleChange}
        disabled={saving}
        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 disabled:opacity-50"
      >
        {LANGUAGES.map(l => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
    </div>
  )
}
