'use client'

import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

interface Props {
  orgId: string
  orgName: string
  onClose: () => void
}

const ROLE_LABELS: Record<string, string> = {
  admin:     'Admin — tam erişim',
  yönetici:  'Yönetici — tam erişim (billing hariç)',
  satisci:   'Satışçı — leads + teklifler + knowledge',
  muhasebe:  'Muhasebe — teklif/ödeme takibi',
  viewer:    'Viewer — salt okunur',
}

export default function InviteUserModal({ orgId, orgName, onClose }: Props) {
  const [role, setRole] = useState('yönetici')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/admin/orgs/${orgId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, note: note.trim() || undefined }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Bir hata oluştu')
      return
    }

    setInviteUrl(data.invite_url)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Kullanıcı Davet Et</h2>
            <p className="text-xs text-slate-500 mt-0.5">{orgName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {!inviteUrl ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              >
                {Object.entries(ROLE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Not (opsiyonel)</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Satış temsilcisi - İstanbul ofisi"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
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
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Oluşturuluyor...' : 'Davet Linki Üret'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 mb-1">Davet linki oluşturuldu!</p>
              <p className="text-xs text-green-700">Link 7 gün geçerlidir. Rol: <strong>{ROLE_LABELS[role]}</strong></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Davet Linki</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 text-slate-700 min-w-0"
                />
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={onClose} className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                Tamam
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
