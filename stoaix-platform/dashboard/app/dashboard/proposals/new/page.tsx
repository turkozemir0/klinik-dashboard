'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface ContactResult {
  contact_id: string
  lead_id: string | null
  full_name: string | null
  phone: string | null
}

interface PaymentRow {
  amount: string
  due_date: string
  notes: string
}

export default function NewProposalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLeadId = searchParams.get('lead_id')

  // Lead / müşteri alanları
  const [leadId, setLeadId] = useState<string | null>(initialLeadId)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [phoneQuery, setPhoneQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ContactResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Teklif alanları
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [currency, setCurrency] = useState('TRY')
  const [status, setStatus] = useState('draft')
  const [notes, setNotes] = useState('')
  const [payments, setPayments] = useState<PaymentRow[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // lead_id ile açıldıysa isim/telefon yükle
  useEffect(() => {
    if (!initialLeadId) return
    fetch(`/api/proposals/lead-info?lead_id=${initialLeadId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setClientName(data.full_name ?? '')
          setClientPhone(data.phone ?? '')
          setPhoneQuery(data.phone ?? '')
        }
      })
      .catch(() => {})
  }, [initialLeadId])

  // Telefon arama debounce
  const handlePhoneChange = useCallback((val: string) => {
    setPhoneQuery(val)
    setClientPhone(val)
    setLeadId(null) // yeni arama başladıysa seçimi temizle

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 2) { setSearchResults([]); setShowDropdown(false); return }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setSearchResults(data)
          setShowDropdown(data.length > 0)
        }
      } catch {}
    }, 400)
  }, [])

  function selectContact(c: ContactResult) {
    setLeadId(c.lead_id)
    setClientName(c.full_name ?? '')
    setClientPhone(c.phone ?? '')
    setPhoneQuery(c.phone ?? '')
    setShowDropdown(false)
    setSearchResults([])
  }

  // Dropdown dışı tıklamada kapat
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function addPaymentRow() {
    setPayments(prev => [...prev, { amount: '', due_date: '', notes: '' }])
  }

  function updatePayment(idx: number, field: keyof PaymentRow, val: string) {
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p))
  }

  function removePayment(idx: number) {
    setPayments(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Teklif başlığı zorunlu'); return }
    setLoading(true)
    setError('')

    try {
      const validPayments = payments.filter(p => p.amount && p.due_date)
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId || null,
          client_name: clientName.trim() || null,
          client_phone: clientPhone.trim() || null,
          title: title.trim(),
          description: description.trim() || null,
          total_amount: totalAmount ? parseFloat(totalAmount) : 0,
          currency,
          status,
          notes: notes.trim() || null,
          payments: validPayments.map(p => ({
            amount: parseFloat(p.amount),
            due_date: p.due_date,
            notes: p.notes || null,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Bir hata oluştu'); return }
      router.push(`/dashboard/proposals/${data.id}`)
    } catch {
      setError('Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/proposals" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ArrowLeft size={15} /> Teklifler
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Yeni Teklif</h1>
        <p className="text-sm text-slate-500 mt-0.5">Mevcut müşteri seçin veya telefon numarasıyla yeni kayıt oluşturun</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Müşteri Bilgileri */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Müşteri</h2>

          {/* Telefon arama */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-slate-600 mb-1">Telefon</label>
            <input
              type="text"
              value={phoneQuery}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="Telefon numarası ile ara..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                {searchResults.map(c => (
                  <button
                    key={c.contact_id}
                    type="button"
                    onClick={() => selectContact(c)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.full_name || 'İsimsiz'}</p>
                      <p className="text-xs text-slate-400">{c.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* İsim */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              İsim
              {leadId && <span className="ml-2 text-xs text-amber-600">Değiştirirseniz müşteri kaydı güncellenecek</span>}
            </label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Müşteri adı"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {leadId && (
            <p className="text-xs text-slate-400">
              Lead seçildi: <span className="font-mono text-slate-600">{leadId.slice(0, 8)}…</span>
            </p>
          )}
        </div>

        {/* Teklif Bilgileri */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Teklif Detayları</h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Başlık <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder=""
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Açıklama</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Teklif detayları..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Toplam Tutar</label>
              <input
                type="number"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Para Birimi</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Durum</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="draft">Taslak</option>
              <option value="sent">Gönderildi</option>
              <option value="accepted">Kabul Edildi</option>
              <option value="signed">İmzalandı</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notlar</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="İç notlar..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Ödeme Takvimi */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Ödeme Takvimi</h2>
            <button
              type="button"
              onClick={addPaymentRow}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={13} /> Taksit Ekle
            </button>
          </div>

          {payments.length === 0 && (
            <p className="text-xs text-slate-400">Taksit eklenmedi — tek seferlik ödeme.</p>
          )}

          {payments.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tutar</label>
                <input
                  type="number"
                  value={p.amount}
                  onChange={e => updatePayment(i, 'amount', e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Vade</label>
                <input
                  type="date"
                  value={p.due_date}
                  onChange={e => updatePayment(i, 'due_date', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removePayment(i)}
                className="text-slate-400 hover:text-red-500 transition-colors pb-2"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor...' : 'Teklif Oluştur'}
          </button>
          <Link
            href="/dashboard/proposals"
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            İptal
          </Link>
        </div>
      </form>
    </div>
  )
}
