'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, ArrowRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PhoneInput from '@/components/PhoneInput'

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manuel' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'voice', label: 'Telefon' },
  { value: 'web_form', label: 'Web Form' },
  { value: 'referral', label: 'Referans' },
]

const STATUS_OPTIONS = [
  { value: 'new', label: 'Yeni' },
  { value: 'in_progress', label: 'İşlemde' },
  { value: 'qualified', label: 'Kalifiye' },
  { value: 'nurturing', label: 'Nurturing' },
]

interface Props {
  onClose: () => void
}

export default function NewLeadModal({ onClose }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [sourceChannel, setSourceChannel] = useState('manual')
  const [status, setStatus] = useState('new')
  const [notes, setNotes] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ lead_id: string; is_existing_contact: boolean } | null>(null)
  const [members, setMembers] = useState<{ user_id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/org/members')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.members ?? []
        setMembers(list)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          source_channel: sourceChannel,
          status,
          notes: notes.trim() || undefined,
          assigned_to: assignedTo || undefined,
        }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        setError(data.error || 'Bir hata oluştu')
        return
      }

      setResult({ lead_id: data.lead_id, is_existing_contact: data.is_existing_contact })
    } catch {
      setLoading(false)
      setError('Bağlantı hatası')
    }
  }

  function handleReset() {
    setFullName('')
    setPhone('')
    setEmail('')
    setSourceChannel('manual')
    setStatus('new')
    setNotes('')
    setAssignedTo('')
    setError('')
    setResult(null)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Yeni Lead Ekle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad *</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ahmet Yılmaz"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <PhoneInput value={phone} onChange={setPhone} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kaynak</label>
                <select
                  value={sourceChannel}
                  onChange={e => setSourceChannel(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  {SOURCE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {members.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Atanan Kişi</label>
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  <option value="">Seçilmedi</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.name || m.user_id}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notlar</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Ek bilgiler..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</> : 'Kaydet'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 mb-1">Lead başarıyla oluşturuldu!</p>
              {result.is_existing_contact && (
                <p className="text-xs text-green-700">Mevcut bir kişi ile eşleştirildi.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 px-4 py-2"
              >
                <Plus size={14} /> Yeni Ekle
              </button>
              <button
                onClick={() => {
                  onClose()
                  router.push(`/dashboard/leads/${result.lead_id}`)
                }}
                className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                Lead'e Git <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
