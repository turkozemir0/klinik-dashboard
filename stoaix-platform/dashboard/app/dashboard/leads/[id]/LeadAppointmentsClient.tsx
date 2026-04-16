'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle2, UserX, XCircle, Loader2, Plus, X } from 'lucide-react'

type AppointmentType = 'consultation' | 'operation' | 'follow_up' | 'other'

interface Appointment {
  id: string
  title?: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  appointment_type: AppointmentType
  source: string
  notes?: string | null
  contacts?: { full_name?: string; phone?: string } | null
}

interface NewForm {
  title: string
  date: string
  startTime: string
  endTime: string
  appointment_type: AppointmentType
  notes: string
}

const EMPTY_FORM: NewForm = {
  title: '', date: '', startTime: '09:00', endTime: '10:00',
  appointment_type: 'consultation', notes: '',
}

const TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: 'Konsültasyon',
  operation:    'Operasyon',
  follow_up:    'Kontrol',
  other:        'Diğer',
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  scheduled:   { label: 'Planlandı',  cls: 'bg-blue-100 text-blue-700' },
  confirmed:   { label: 'Onaylandı',  cls: 'bg-green-100 text-green-700' },
  rescheduled: { label: 'Ertelendi',  cls: 'bg-amber-100 text-amber-700' },
  attended:    { label: 'Katıldı',    cls: 'bg-emerald-100 text-emerald-700' },
  no_show:     { label: 'Gelmedi',    cls: 'bg-red-100 text-red-700' },
  cancelled:   { label: 'İptal',      cls: 'bg-slate-100 text-slate-500' },
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' })
}

export default function LeadAppointmentsClient({ leadId }: { leadId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState<NewForm>(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError] = useState('')

  async function loadAppointments() {
    const res  = await fetch(`/api/appointments?lead_id=${leadId}&limit=20`)
    const data = await res.json()
    const list: Appointment[] = Array.isArray(data) ? data : []
    list.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
    setAppointments(list)
    setLoading(false)
  }

  useEffect(() => { loadAppointments() }, [leadId])

  async function updateStatus(apptId: string, newStatus: string) {
    setUpdatingStatus(apptId)
    try {
      await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      await loadAppointments()
    } finally {
      setUpdatingStatus(null)
    }
  }

  async function createAppointment() {
    if (!form.date || !form.startTime || !form.endTime) {
      setFormError('Tarih ve saatler zorunlu')
      return
    }
    setSaving(true); setFormError('')

    const [sH, sM] = form.startTime.split(':').map(Number)
    const [eH, eM] = form.endTime.split(':').map(Number)
    const duration = Math.max(15, (eH * 60 + eM) - (sH * 60 + sM))

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduled_at:     `${form.date}T${form.startTime}:00`,
        duration_minutes: duration,
        title:            form.title || undefined,
        appointment_type: form.appointment_type,
        notes:            form.notes || undefined,
        lead_id:          leadId,
        source:           'platform',
      }),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error ?? 'Oluşturulamadı'); setSaving(false); return }

    setShowForm(false)
    setForm(EMPTY_FORM)
    await loadAppointments()
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Randevular</h2>
          {appointments.length > 0 && (
            <span className="text-xs text-slate-400">({appointments.length})</span>
          )}
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormError('') }}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'İptal' : 'Yeni Randevu'}
        </button>
      </div>

      {/* Inline create form */}
      {showForm && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Başlık (isteğe bağlı)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <select
                value={form.appointment_type}
                onChange={e => setForm(f => ({ ...f, appointment_type: e.target.value as AppointmentType }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {(Object.entries(TYPE_LABELS) as [AppointmentType, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="col-span-2">
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Not (isteğe bağlı)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex justify-end">
            <button
              onClick={createAppointment}
              disabled={saving}
              className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Oluştur
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 py-4 justify-center">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-sm">Yükleniyor...</span>
          </div>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Henüz randevu oluşturulmadı.</p>
        ) : (
          <div className="space-y-0">
            {appointments.map((appt) => {
              const isCancelled = appt.status === 'cancelled'
              const badge = STATUS_BADGE[appt.status] ?? { label: appt.status, cls: 'bg-slate-100 text-slate-600' }
              const endTime = new Date(
                new Date(appt.scheduled_at).getTime() + appt.duration_minutes * 60_000
              ).toISOString()

              return (
                <div
                  key={appt.id}
                  className={`flex items-start justify-between gap-3 py-3 border-b border-slate-50 last:border-0 group
                    ${isCancelled ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-slate-800 ${isCancelled ? 'line-through' : ''}`}>
                      {fmtDate(appt.scheduled_at)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Clock size={11} />
                      {fmtTime(appt.scheduled_at)} — {fmtTime(endTime)}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
                      </span>
                    </div>
                    {appt.notes && (
                      <p className="text-xs text-slate-400 mt-1 truncate">{appt.notes}</p>
                    )}
                  </div>

                  {!isCancelled && (
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {['scheduled', 'confirmed', 'rescheduled'].includes(appt.status) && (
                        <>
                          <button
                            onClick={() => updateStatus(appt.id, 'attended')}
                            disabled={updatingStatus === appt.id}
                            className="p-1.5 rounded hover:bg-green-100 text-slate-300 hover:text-green-600 transition-colors disabled:opacity-40"
                            title="Katıldı">
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, 'no_show')}
                            disabled={updatingStatus === appt.id}
                            className="p-1.5 rounded hover:bg-orange-100 text-slate-300 hover:text-orange-500 transition-colors disabled:opacity-40"
                            title="Gelmedi">
                            <UserX size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => updateStatus(appt.id, 'cancelled')}
                        disabled={updatingStatus === appt.id}
                        className="p-1.5 rounded hover:bg-red-100 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="İptal Et">
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
