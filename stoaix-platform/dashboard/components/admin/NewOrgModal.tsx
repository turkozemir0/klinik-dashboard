'use client'

import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function NewOrgModal({ onClose }: Props) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sector, setSector] = useState('education')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/orgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim(), sector }),
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
          <h2 className="text-base font-semibold text-slate-900">Yeni Müşteri Ekle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {!inviteUrl ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organizasyon Adı</label>
              <input
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Eurostar Eğitim"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="eurostar-egitim"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sektör</label>
              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              >
                <option value="education">Eğitim & Danışmanlık</option>
                <option value="clinic">Klinik & Sağlık</option>
                <option value="real_estate">Gayrimenkul</option>
                <option value="tech_service">Teknoloji Hizmetleri</option>
                <option value="ecommerce">E-Ticaret & Perakende</option>
                <option value="legal">Hukuk & Muhasebe</option>
                <option value="hospitality">Turizm & Konaklama</option>
                <option value="automotive">Otomotiv</option>
                <option value="construction">İnşaat & Mimarlık</option>
                <option value="finance">Finans & Sigorta</option>
                <option value="other">Diğer</option>
              </select>
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
                {loading ? 'Oluşturuluyor...' : 'Oluştur & Davet Link Üret'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 mb-1">Organizasyon oluşturuldu!</p>
              <p className="text-xs text-green-700">Davet linkini müşteriye gönderin. Link 7 gün geçerlidir.</p>
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
