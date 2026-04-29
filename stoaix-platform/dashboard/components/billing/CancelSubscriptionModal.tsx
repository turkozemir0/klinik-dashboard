'use client'

import { useState } from 'react'
import { X, AlertTriangle, Star, Loader2, Gift, ArrowRight } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onCanceled: () => void
  onRetained: () => void
  planName: string
  periodEnd: string | null
  isTrial: boolean
}

const REASONS = [
  { value: 'too_expensive', label: 'Fiyat çok yüksek' },
  { value: 'not_using', label: 'Yeterince kullanmıyorum' },
  { value: 'missing_features', label: 'İhtiyacım olan özellikler eksik' },
  { value: 'switching_competitor', label: 'Başka bir çözüme geçiyorum' },
  { value: 'temporary_pause', label: 'Geçici olarak duraklatmak istiyorum' },
  { value: 'other', label: 'Diğer' },
]

export default function CancelSubscriptionModal({
  open, onClose, onCanceled, onRetained, planName, periodEnd, isTrial,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [reason, setReason] = useState('')
  const [reasonText, setReasonText] = useState('')
  const [satisfaction, setSatisfaction] = useState(0)
  const [satisfactionNote, setSatisfactionNote] = useState('')
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [retentionEligible, setRetentionEligible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  function reset() {
    setStep(1)
    setReason('')
    setReasonText('')
    setSatisfaction(0)
    setSatisfactionNote('')
    setFeedbackId(null)
    setRetentionEligible(false)
    setLoading(false)
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  // Step 1 → 2: Neden + memnuniyet kaydet
  async function handleSaveFeedback() {
    if (!reason) { setError('Lütfen bir neden seçin'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_feedback',
          cancel_reason: reason,
          cancel_reason_text: reasonText || undefined,
          satisfaction: satisfaction || undefined,
          satisfaction_note: satisfactionNote || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Bir hata oluştu'); return }

      setFeedbackId(data.feedback_id)
      setRetentionEligible(data.retention_eligible)

      if (data.retention_eligible) {
        setStep(3) // retention teklif et
      } else {
        // Direkt iptal
        await confirmCancel(data.feedback_id)
      }
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  // Retention kabul
  async function handleAcceptDiscount() {
    if (!feedbackId) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept_discount', feedback_id: feedbackId }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Bir hata oluştu'); return }

      reset()
      onRetained()
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  // İptal onayla
  async function confirmCancel(fId?: string) {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_cancel', feedback_id: fId || feedbackId }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Bir hata oluştu'); return }

      reset()
      onCanceled()
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  const endDateStr = periodEnd
    ? new Date(periodEnd).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-base font-semibold text-slate-800">
              {step === 3 ? 'Size bir teklifimiz var' : 'Aboneliği İptal Et'}
            </h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Step 1+2: Neden + Memnuniyet (tek ekranda) */}
          {step === 1 && (
            <>
              {isTrial && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-sm text-amber-800">
                    Deneme süreniz henüz bitmedi. İptal ederseniz kalan süreniz sona erecek.
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">İptal nedeniniz nedir?</p>
                <div className="space-y-2">
                  {REASONS.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                        reason === r.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancel_reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-brand-500"
                      />
                      <span className="text-sm text-slate-700">{r.label}</span>
                    </label>
                  ))}
                </div>

                {reason === 'other' && (
                  <textarea
                    value={reasonText}
                    onChange={e => setReasonText(e.target.value)}
                    placeholder="Lütfen nedeninizi açıklayın..."
                    rows={2}
                    className="w-full mt-3 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Genel memnuniyetiniz nasıldı?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setSatisfaction(s)}
                      className="p-1"
                    >
                      <Star
                        size={24}
                        className={`transition-colors ${
                          s <= satisfaction
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {satisfaction > 0 && (
                  <textarea
                    value={satisfactionNote}
                    onChange={e => setSatisfactionNote(e.target.value)}
                    placeholder="Eklemek istediğiniz bir şey var mı? (opsiyonel)"
                    rows={2}
                    className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                )}
              </div>
            </>
          )}

          {/* Step 3: Retention teklifi */}
          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <Gift size={28} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Gitmeden önce...</h3>
                <p className="text-sm text-slate-500 mt-1">
                  <strong>{planName}</strong> planınıza devam etmeniz için size özel bir teklifimiz var.
                </p>
              </div>
              <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-5">
                <p className="text-2xl font-bold text-emerald-700">%40 indirim</p>
                <p className="text-sm text-emerald-600 mt-1">Bir sonraki fatura döneminizde geçerli</p>
              </div>
              {endDateStr && (
                <p className="text-xs text-slate-400">
                  Mevcut dönem bitiş: {endDateStr}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          {step === 1 && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSaveFeedback}
                disabled={loading || !reason}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? 'İşleniyor...' : 'Devam Et'}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                onClick={() => confirmCancel()}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-600 disabled:opacity-60"
              >
                {loading ? 'İşleniyor...' : 'Hayır, iptal et'}
              </button>
              <button
                onClick={handleAcceptDiscount}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-60 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
                Teklifi Kabul Et
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
