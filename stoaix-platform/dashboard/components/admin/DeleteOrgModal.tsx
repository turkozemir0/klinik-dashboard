'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, X } from 'lucide-react'

const CONFIRM_PHRASE = 'SİLMEKİSTİYORUMBEYLER'

interface Props {
  orgId: string
  orgName: string
  onClose: () => void
  onDeleted: (orgId: string) => void
}

export default function DeleteOrgModal({ orgId, orgName, onClose, onDeleted }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmed = input === CONFIRM_PHRASE

  async function handleDelete() {
    if (!confirmed) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Silme işlemi başarısız.')
        return
      }
      onDeleted(orgId)
      onClose()
    } catch {
      setError('Sunucu hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <Trash2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Organizasyonu Sil</h2>
              <p className="text-xs text-slate-500">{orgName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex gap-3">
          <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 leading-relaxed">
            Bu işlem <strong>geri alınamaz.</strong> Organizasyona ait tüm lead'ler, konuşmalar, mesajlar,
            bilgi bankası, kullanıcılar ve tüm veriler kalıcı olarak silinecek.
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Onaylamak için aşağıdaki ifadeyi yazın:
          </label>
          <p className="font-mono text-sm font-bold text-slate-800 bg-slate-100 rounded-lg px-3 py-2 mb-3 select-all">
            {CONFIRM_PHRASE}
          </p>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Buraya yazın..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Kalıcı Olarak Sil
          </button>
        </div>
      </div>
    </div>
  )
}
