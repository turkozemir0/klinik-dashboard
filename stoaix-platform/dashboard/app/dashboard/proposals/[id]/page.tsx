'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  signed: 'İmzalandı',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  signed: 'bg-emerald-100 text-emerald-700',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

export default function ProposalDetailPage() {
  const params = useParams()
  const [proposal, setProposal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)

  // Taksit ekleme formu
  const [addingPayment, setAddingPayment] = useState(false)
  const [newAmount, setNewAmount] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    fetch(`/api/proposals/${params.id}`)
      .then(r => r.json())
      .then(data => { setProposal(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  async function markPaid(pid: string) {
    setPayingId(pid)
    try {
      const res = await fetch(`/api/proposals/${params.id}/payments/${pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      })
      if (res.ok) {
        setProposal((p: any) => ({
          ...p,
          payment_schedules: p.payment_schedules.map((ps: any) =>
            ps.id === pid ? { ...ps, status: 'paid', paid_at: new Date().toISOString() } : ps
          ),
        }))
      }
    } finally {
      setPayingId(null)
    }
  }

  async function addPayment() {
    if (!newAmount || !newDueDate) { setPaymentError('Tutar ve vade tarihi zorunlu'); return }
    setSavingPayment(true)
    setPaymentError('')
    try {
      const res = await fetch(`/api/proposals/${params.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(newAmount), due_date: newDueDate, notes: newNotes || null }),
      })
      const data = await res.json()
      if (!res.ok) { setPaymentError(data.error || 'Hata'); return }
      setProposal((p: any) => ({
        ...p,
        payment_schedules: [...(p.payment_schedules ?? []), {
          id: data.id,
          amount: parseFloat(newAmount),
          due_date: newDueDate,
          notes: newNotes || null,
          status: 'pending',
          paid_at: null,
        }],
      }))
      setNewAmount(''); setNewDueDate(''); setNewNotes('')
      setAddingPayment(false)
    } finally {
      setSavingPayment(false)
    }
  }

  async function updateStatus(newStatus: string) {
    setStatusLoading(true)
    try {
      const res = await fetch(`/api/proposals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) setProposal((p: any) => ({ ...p, status: newStatus }))
    } finally {
      setStatusLoading(false)
    }
  }

  if (loading) return <div className="p-6 text-slate-500 text-sm">Yükleniyor...</div>
  if (!proposal || proposal.error) return <div className="p-6 text-red-500 text-sm">Teklif bulunamadı.</div>

  const payments = proposal.payment_schedules ?? []

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/proposals" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ArrowLeft size={15} /> Teklifler
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{proposal.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date(proposal.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[proposal.status]}`}>
          {STATUS_LABELS[proposal.status]}
        </span>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Toplam Tutar</span>
          <span className="font-bold text-slate-900 text-lg">
            {Number(proposal.total_amount).toLocaleString('tr-TR')} {proposal.currency}
          </span>
        </div>
        {proposal.description && (
          <p className="text-sm text-slate-600 border-t border-slate-50 pt-3">{proposal.description}</p>
        )}
        {proposal.notes && (
          <p className="text-xs text-slate-400 italic border-t border-slate-50 pt-3">{proposal.notes}</p>
        )}

        {/* Status change actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50">
          {['draft','sent','accepted','rejected','signed'].filter(s => s !== proposal.status).map(s => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={statusLoading}
              className="text-xs text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              → {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Payment schedules */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Ödeme Takvimi</h2>
          {!addingPayment && (
            <button
              onClick={() => { setAddingPayment(true); setPaymentError('') }}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={13} /> Taksit Ekle
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-50">
          {payments.length === 0 && !addingPayment && (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">Ödeme takvimi eklenmemiş.</p>
          )}

          {payments.map((ps: any) => {
            const isOverdue = ps.status === 'pending' && new Date(ps.due_date) < new Date()
            const displayStatus = isOverdue ? 'overdue' : ps.status
            return (
              <div key={ps.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {Number(ps.amount).toLocaleString('tr-TR')} {proposal.currency}
                  </p>
                  <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                    Vade: {new Date(ps.due_date).toLocaleDateString('tr-TR')}
                    {ps.paid_at && ` · Ödendi: ${new Date(ps.paid_at).toLocaleDateString('tr-TR')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {ps.status === 'pending' && (
                    <button
                      onClick={() => markPaid(ps.id)}
                      disabled={payingId === ps.id}
                      className="text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {payingId === ps.id ? '...' : 'Ödendi İşaretle'}
                    </button>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[displayStatus] ?? PAYMENT_STATUS_COLORS.pending}`}>
                    {displayStatus === 'paid' ? 'Ödendi' : displayStatus === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Taksit ekleme formu */}
          {addingPayment && (
            <div className="px-5 py-4 space-y-3 bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tutar *</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Vade Tarihi *</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Not (opsiyonel)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Ör: 1. taksit"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
              {paymentError && <p className="text-xs text-red-600">{paymentError}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={addPayment}
                  disabled={savingPayment}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {savingPayment ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  onClick={() => { setAddingPayment(false); setNewAmount(''); setNewDueDate(''); setNewNotes(''); setPaymentError('') }}
                  className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
