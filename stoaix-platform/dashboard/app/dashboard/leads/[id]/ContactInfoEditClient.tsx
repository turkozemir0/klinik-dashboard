'use client'

import { useState } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import ContactLanguageSelect from './ContactLanguageSelect'
import PhoneInput from '@/components/PhoneInput'

interface Props {
  contactId: string
  fullName: string | null
  phone: string | null
  email: string | null
  sourceChannel: string | null
  contactStatus: string | null
  createdAt: string | null
  preferredLanguage: string | null
  userRole: string | null
}

export default function ContactInfoEditClient({
  contactId, fullName, phone, email, sourceChannel, contactStatus, createdAt, preferredLanguage, userRole
}: Props) {
  const canEdit = ['admin', 'yönetici', 'satisci'].includes(userRole ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [editName, setEditName] = useState(fullName || '')
  const [editPhone, setEditPhone] = useState(phone || '')
  const [editEmail, setEditEmail] = useState(email || '')

  // Current display values (updated after save)
  const [displayName, setDisplayName] = useState(fullName)
  const [displayPhone, setDisplayPhone] = useState(phone)
  const [displayEmail, setDisplayEmail] = useState(email)

  function handleStartEdit() {
    setEditName(displayName || '')
    setEditPhone(displayPhone || '')
    setEditEmail(displayEmail || '')
    setError('')
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editName.trim() || null,
          phone: editPhone.trim() || null,
          email: editEmail.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Güncelleme başarısız')
        setSaving(false)
        return
      }

      setDisplayName(editName.trim() || null)
      setDisplayPhone(editPhone.trim() || null)
      setDisplayEmail(editEmail.trim() || null)
      setEditing(false)
    } catch {
      setError('Bağlantı hatası')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">İletişim Bilgileri</h2>
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
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ad Soyad</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Telefon</label>
            <PhoneInput value={editPhone} onChange={setEditPhone} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">E-posta</label>
            <input
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      ) : (
        <dl className="space-y-2">
          {[
            ['Ad Soyad', displayName],
            ['Telefon', displayPhone],
            ['E-posta', displayEmail],
            ['Kaynak', sourceChannel],
            ['Durum', contactStatus],
            ['Kayıt', createdAt ? new Date(createdAt).toLocaleDateString('tr-TR') : '—'],
          ].map(([label, value]) => value ? (
            <div key={label as string} className="flex text-sm">
              <dt className="w-24 text-slate-500 flex-shrink-0">{label}</dt>
              <dd className="text-slate-800 font-medium">{value}</dd>
            </div>
          ) : null)}
        </dl>
      )}

      {contactId && (
        <ContactLanguageSelect
          contactId={contactId}
          initialLanguage={preferredLanguage}
        />
      )}
    </div>
  )
}
