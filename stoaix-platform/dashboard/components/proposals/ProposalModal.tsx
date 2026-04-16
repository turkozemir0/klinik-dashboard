'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentRow {
  amount: string
  due_date: string
  notes: string
}

interface Props {
  leadId: string
  onClose: () => void
  onCreated?: (id: string) => void
}

const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP']

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  signed: 'İmzalandı',
}

export default function ProposalModal({ leadId, onClose, onCreated }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [currency, setCurrency] = useState('TRY')
  const [status, setStatus] = useState('draft')
  const [notes, setNotes] = useState('')
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addPayment() {
    setPayments(prev => [...prev, { amount: '', due_date: '', notes: '' }])
  }

  function removePayment(idx: number) {
    setPayments(prev => prev.filter((_, i) => i !== idx))
  }

  function updatePayment(idx: number, field: keyof PaymentRow, value: string) {
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError('')

    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: leadId,
        title: title.trim(),
        description: description.trim() || undefined,
        total_amount: parseFloat(totalAmount) || 0,
        currency,
        status,
        notes: notes.trim() || undefined,
        payments: payments.filter(p => p.amount && p.due_date),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Bir hata oluştu')
      return
    }

    if (onCreated) onCreated(data.id)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Yeni Teklif</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Saç Ekimi Paketi — Altın"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Teklif detayları..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Toplam Tutar</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Para Birimi</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Payment schedules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Ödeme Taksitleri</label>
              <button type="button" onClick={addPayment} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <Plus size={12} /> Taksit Ekle
              </button>
            </div>
            {payments.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.amount}
                  onChange={e => updatePayment(idx, 'amount', e.target.value)}
                  placeholder="Tutar"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                />
                <input
                  type="date"
                  value={p.due_date}
                  onChange={e => updatePayment(idx, 'due_date', e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removePayment(idx)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Not</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="İç notlar..."
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
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Kaydediliyor...' : 'Teklif Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
