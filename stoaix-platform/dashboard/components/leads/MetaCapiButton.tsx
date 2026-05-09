'use client'

import { useState, useEffect } from 'react'
import { Send, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

interface Props {
  leadId: string
}

const EVENT_OPTIONS = [
  { value: 'Lead', labelTr: 'Nitelikli Lead', labelEn: 'Qualified Lead' },
  { value: 'CompleteRegistration', labelTr: 'Kayıt Tamamlandı', labelEn: 'Registration Complete' },
  { value: 'Schedule', labelTr: 'Randevu Alındı', labelEn: 'Appointment Booked' },
]

export default function MetaCapiButton({ leadId }: Props) {
  const { lang } = useLang()
  const isTr = lang === 'tr'

  const [capiActive, setCapiActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState('Lead')
  const [result, setResult] = useState<'success' | 'already_sent' | 'error' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetch('/api/capi/status')
      .then(r => r.json())
      .then(data => {
        setCapiActive(data.connected === true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Don't render if CAPI is not active or lead not qualified
  if (loading) return null
  if (!capiActive) return null

  async function handleSend() {
    setSending(true)
    setResult(null)
    setErrorMsg('')
    try {
      const res = await fetch('/api/capi/send-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, event_name: selectedEvent }),
      })
      const data = await res.json()
      if (res.status === 409) {
        setResult('already_sent')
      } else if (!res.ok) {
        setResult('error')
        setErrorMsg(data.detail || data.error || 'Gönderim başarısız')
      } else {
        setResult('success')
      }
    } catch {
      setResult('error')
      setErrorMsg(isTr ? 'Bağlantı hatası' : 'Connection error')
    } finally {
      setSending(false)
    }
  }

  const selectedLabel = EVENT_OPTIONS.find(e => e.value === selectedEvent)
  const displayLabel = isTr ? selectedLabel?.labelTr : selectedLabel?.labelEn

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">
          {isTr ? 'Meta Dönüşüm Bildirimi' : 'Meta Conversion Report'}
        </h2>
        <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
          <Send size={11} className="text-blue-600" />
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        {isTr
          ? 'Bu leadi Meta Conversions API\'ye bildirerek reklam optimizasyonunu iyileştirin.'
          : 'Report this lead to Meta Conversions API to improve ad optimization.'}
      </p>

      <div className="flex items-center gap-2">
        {/* Event selector */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <span>{displayLabel}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              {EVENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSelectedEvent(opt.value); setShowDropdown(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                    selectedEvent === opt.value ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  {isTr ? opt.labelTr : opt.labelEn}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || result === 'already_sent'}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {isTr ? 'Gönder' : 'Send'}
        </button>
      </div>

      {/* Feedback */}
      {result === 'success' && (
        <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle2 size={14} className="text-green-600" />
          <p className="text-xs text-green-700">{isTr ? 'Meta\'ya başarıyla bildirildi' : 'Successfully reported to Meta'}</p>
        </div>
      )}
      {result === 'already_sent' && (
        <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle size={14} className="text-amber-600" />
          <p className="text-xs text-amber-700">{isTr ? 'Bu olay son 24 saat içinde zaten bildirildi' : 'This event was already reported in the last 24 hours'}</p>
        </div>
      )}
      {result === 'error' && (
        <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle size={14} className="text-red-600" />
          <p className="text-xs text-red-700">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
