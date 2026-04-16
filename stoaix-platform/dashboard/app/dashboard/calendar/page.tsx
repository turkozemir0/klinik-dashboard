'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Plus, Loader2, ChevronLeft, ChevronRight,
  Clock, User, X, Link2, Search, RefreshCw, Pencil,
  CheckCircle2, UserX, XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────────

type AppointmentType = 'consultation' | 'operation' | 'follow_up' | 'other'
type AppointmentSource = 'platform' | 'google' | 'ai' | 'ghl'
type SourceFilter = 'all' | AppointmentSource

interface Appointment {
  id: string
  title?: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  appointment_type: AppointmentType
  source: AppointmentSource
  external_id?: string | null
  notes?: string | null
  contact_id?: string | null
  lead_id?: string | null
  contacts?: { full_name?: string; phone?: string } | null
  leads?: { qualification_score?: number; status?: string } | null
}

interface Lead {
  id: string
  contacts: { full_name?: string; phone?: string } | null
  qualification_score?: number
}

interface NewAppointmentForm {
  title: string
  date: string
  startTime: string
  endTime: string
  appointment_type: AppointmentType
  notes: string
  leadId: string
}

const EMPTY_FORM: NewAppointmentForm = {
  title: '', date: '', startTime: '09:00', endTime: '10:00',
  appointment_type: 'consultation', notes: '', leadId: '',
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: 'Konsültasyon',
  operation:    'Operasyon',
  follow_up:    'Kontrol',
  other:        'Diğer',
}
const SOURCE_LABELS: Record<string, string> = {
  platform: 'Platform',
  google:   'Google',
  ai:       'AI Asistan',
  ghl:      'GHL',
}
const SOURCE_BAR_CLASS: Record<string, string> = {
  platform: 'bg-brand-400',
  google:   'bg-blue-400',
  ai:       'bg-emerald-400',
  ghl:      'bg-amber-400',
}
const SOURCE_CHIP_CLASS: Record<string, string> = {
  platform: 'bg-brand-100 text-brand-700',
  google:   'bg-blue-100 text-blue-700',
  ai:       'bg-emerald-100 text-emerald-700',
  ghl:      'bg-amber-100 text-amber-700',
}

const TR_MONTHS = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık',
]
const TR_DAYS_SHORT = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

// ── Calendar grid helpers ──────────────────────────────────────────────────────

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOfMonth(y: number, m: number) {
  const d = new Date(y, m, 1).getDay()
  return d === 0 ? 6 : d - 1  // Mon=0…Sun=6
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function isToday(d: Date) { return isoDate(d) === isoDate(new Date()) }

interface CalDay { date: Date; currentMonth: boolean }

function buildCalendar(year: number, month: number): CalDay[] {
  const first   = getFirstDayOfMonth(year, month)
  const inMonth = getDaysInMonth(year, month)
  const prevIn  = getDaysInMonth(year, month - 1)
  const days: CalDay[] = []
  for (let i = first - 1; i >= 0; i--)
    days.push({ date: new Date(year, month - 1, prevIn - i), currentMonth: false })
  for (let i = 1; i <= inMonth; i++)
    days.push({ date: new Date(year, month, i), currentMonth: true })
  const rem = 42 - days.length
  for (let i = 1; i <= rem; i++)
    days.push({ date: new Date(year, month + 1, i), currentMonth: false })
  return days
}

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
}
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1)  return 'az önce'
  if (m < 60) return `${m} dk önce`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} saat önce`
  return `${Math.floor(h/24)} gün önce`
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today       = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string>(isoDate(today))

  const [provider, setProvider]       = useState<string>('none')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [lastSynced, setLastSynced]   = useState<string | null>(null)
  const [syncing, setSyncing]         = useState(false)
  const [loading, setLoading]         = useState(true)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState<NewAppointmentForm>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

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

  // Edit modal
  const [editAppt, setEditAppt]     = useState<Appointment | null>(null)
  const [editForm, setEditForm]     = useState({ title: '', appointment_type: 'consultation' as AppointmentType, notes: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState('')
  const [leads, setLeads]         = useState<Lead[]>([])
  const [leadSearch, setLeadSearch] = useState('')
  const [leadsLoading, setLeadsLoading] = useState(false)

  // Fetch appointments for the visible month range (+ buffer weeks)
  const fetchAppointments = useCallback(async (year: number, month: number, filter: SourceFilter) => {
    const from = new Date(year, month - 1, 1)   // 1 month before
    const to   = new Date(year, month + 2, 0)   // end of month after
    const params = new URLSearchParams({
      from: from.toISOString(),
      to:   to.toISOString(),
    })
    if (filter !== 'all') params.set('source', filter)
    const res  = await fetch(`/api/calendar/events?${params}`)
    const data = await res.json()
    return data
  }, [])

  const loadAppointments = useCallback(async () => {
    const data = await fetchAppointments(viewYear, viewMonth, sourceFilter)
    setProvider(data.provider ?? 'none')
    setLastSynced(data.last_synced_at ?? null)
    setAppointments(data.appointments ?? [])
  }, [fetchAppointments, viewYear, viewMonth, sourceFilter])

  const load = useCallback(async () => {
    setLoading(true)
    let detectedProvider = 'none'
    try {
      const data = await fetchAppointments(viewYear, viewMonth, sourceFilter)
      detectedProvider = data.provider ?? 'none'
      setProvider(detectedProvider)
      setLastSynced(data.last_synced_at ?? null)
      setAppointments(data.appointments ?? [])
    } finally {
      setLoading(false)
    }
    // Auto-sync Google in background
    if (detectedProvider === 'google') {
      setSyncing(true)
      try {
        const syncRes  = await fetch('/api/calendar/sync', { method: 'POST' })
        const syncData = await syncRes.json()
        if (syncRes.ok) {
          setLastSynced(syncData.last_synced_at)
          // Always refresh after sync (new events may have been added)
          const refreshed = await fetchAppointments(viewYear, viewMonth, sourceFilter)
          setAppointments(refreshed.appointments ?? [])
        }
      } finally {
        setSyncing(false)
      }
    }
  }, [fetchAppointments, viewYear, viewMonth, sourceFilter])

  // Initial load
  useEffect(() => { load() }, [])

  // Reload when month or filter changes
  useEffect(() => { loadAppointments() }, [viewYear, viewMonth, sourceFilter])

  async function manualSync() {
    setSyncing(true)
    try {
      const syncRes  = await fetch('/api/calendar/sync', { method: 'POST' })
      const syncData = await syncRes.json()
      if (syncRes.ok) {
        setLastSynced(syncData.last_synced_at)
        await loadAppointments()
      }
    } finally {
      setSyncing(false)
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Build appointment lookup keyed by YYYY-MM-DD (exclude cancelled)
  const apptByDay: Record<string, Appointment[]> = {}
  for (const a of appointments) {
    if (a.status === 'cancelled') continue
    const day = a.scheduled_at.slice(0, 10)
    if (!apptByDay[day]) apptByDay[day] = []
    apptByDay[day].push(a)
  }

  const calDays     = buildCalendar(viewYear, viewMonth)
  const dayAppts    = apptByDay[selectedDay] ?? []
  const selectedDate = new Date(selectedDay + 'T00:00:00')

  // Lead search for modal
  async function loadLeads(search = '') {
    setLeadsLoading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setLeadsLoading(false); return }
    const { data: orgUser } = await sb
      .from('org_users').select('organization_id').eq('user_id', user.id).maybeSingle()
    if (!orgUser) { setLeadsLoading(false); return }
    let query = sb.from('leads')
      .select('id, qualification_score, contacts(full_name, phone)')
      .eq('organization_id', orgUser.organization_id)
      .not('status', 'in', '("converted","lost")')
      .order('updated_at', { ascending: false })
      .limit(20)
    if (search) {
      const { data: cm } = await sb.from('contacts').select('id')
        .eq('organization_id', orgUser.organization_id)
        .ilike('full_name', `%${search}%`).limit(20)
      const ids = (cm ?? []).map((c: any) => c.id)
      if (!ids.length) { setLeads([]); setLeadsLoading(false); return }
      query = query.in('contact_id', ids)
    }
    const { data } = await query
    setLeads((data ?? []) as Lead[])
    setLeadsLoading(false)
  }
  useEffect(() => { if (showModal) loadLeads() }, [showModal])
  useEffect(() => {
    if (!showModal) return
    const t = setTimeout(() => loadLeads(leadSearch), 300)
    return () => clearTimeout(t)
  }, [leadSearch, showModal])

  function openEdit(appt: Appointment) {
    setEditAppt(appt)
    setEditForm({
      title:            appt.title ?? '',
      appointment_type: appt.appointment_type,
      notes:            appt.notes ?? '',
    })
    setEditError('')
  }

  async function saveEdit() {
    if (!editAppt) return
    setEditSaving(true); setEditError('')
    const res = await fetch(`/api/appointments/${editAppt.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:            editForm.title            || null,
        appointment_type: editForm.appointment_type,
        notes:            editForm.notes            || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error ?? 'Kaydedilemedi'); setEditSaving(false); return }
    setEditAppt(null)
    await loadAppointments()
    setEditSaving(false)
  }

  async function createAppointment() {
    if (!form.title || !form.date || !form.startTime || !form.endTime) {
      setFormError('Başlık, tarih ve saatler zorunlu')
      return
    }
    setSaving(true); setFormError('')

    const [sH, sM] = form.startTime.split(':').map(Number)
    const [eH, eM] = form.endTime.split(':').map(Number)
    const duration = Math.max(15, (eH * 60 + eM) - (sH * 60 + sM))

    // Resolve contact_id from lead
    let contactId: string | null = null
    if (form.leadId) {
      const sb = createClient()
      const { data } = await sb.from('leads').select('contact_id').eq('id', form.leadId).maybeSingle()
      contactId = data?.contact_id ?? null
    }

    const res = await fetch('/api/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduled_at:     `${form.date}T${form.startTime}:00`,
        duration_minutes: duration,
        title:            form.title,
        appointment_type: form.appointment_type,
        notes:            form.notes || undefined,
        lead_id:          form.leadId || undefined,
        contact_id:       contactId || undefined,
        source:           'platform',
      }),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error ?? 'Oluşturulamadı'); setSaving(false); return }

    setShowModal(false); setForm(EMPTY_FORM); setLeadSearch('')
    setSelectedDay(form.date)
    await loadAppointments()
    setSaving(false)
  }

  function openModalForDay(day: string) {
    setForm({ ...EMPTY_FORM, date: day })
    setShowModal(true)
  }

  const selectedLead = leads.find(l => l.id === form.leadId)

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Calendar size={22} className="text-brand-600" />
          <h1 className="text-xl font-semibold text-slate-800">Takvim</h1>
          {provider && provider !== 'none' && (
            <span className="text-xs bg-brand-50 text-brand-600 border border-brand-100 px-2 py-0.5 rounded-full font-medium">
              {provider === 'google' ? 'Google Takvim bağlı' : provider}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {provider === 'google' && (
            <button onClick={manualSync} disabled={syncing}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Senkronize...' : 'Senkronize Et'}
            </button>
          )}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
            <Plus size={15} />
            Yeni Randevu
          </button>
        </div>
      </div>

      {/* ── Source Filter + Sync info ── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(['all', 'platform', 'google', 'ai', 'ghl'] as const).map(f => (
          <button key={f} onClick={() => setSourceFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              sourceFilter === f
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}>
            {f === 'all' ? 'Tümü' : SOURCE_LABELS[f]}
          </button>
        ))}
        {lastSynced && provider === 'google' && (
          <span className="ml-auto text-xs text-slate-400">Son senkron: {timeAgo(lastSynced)}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* ── Calendar Grid ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-slate-800">
              {TR_MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {TR_DAYS_SHORT.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Yükleniyor...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calDays.map(({ date, currentMonth }, idx) => {
                const key     = isoDate(date)
                const evts    = apptByDay[key] ?? []
                const today_  = isToday(date)
                const selected = key === selectedDay
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(key)}
                    className={`min-h-[80px] p-1.5 border-b border-r border-slate-100 cursor-pointer transition-colors
                      ${selected ? 'bg-brand-50' : 'hover:bg-slate-50'}
                      ${idx % 7 === 6 ? 'border-r-0' : ''}
                      ${idx >= 35 ? 'border-b-0' : ''}
                    `}
                  >
                    {/* Date number */}
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1
                      ${today_
                        ? 'bg-brand-600 text-white'
                        : selected
                          ? 'bg-brand-100 text-brand-700'
                          : currentMonth ? 'text-slate-700' : 'text-slate-300'
                      }`}>
                      {date.getDate()}
                    </div>
                    {/* Event chips (max 3) */}
                    <div className="space-y-0.5">
                      {evts.slice(0, 3).map(a => (
                        <div key={a.id}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate leading-tight
                            ${SOURCE_CHIP_CLASS[a.source] ?? 'bg-slate-100 text-slate-600'}`}>
                          {fmtTime(a.scheduled_at)} {a.title ?? a.contacts?.full_name ?? '—'}
                        </div>
                      ))}
                      {evts.length > 3 && (
                        <div className="text-[10px] text-slate-400 pl-1">
                          +{evts.length - 3} daha
                        </div>
                      )}
                    </div>
                    {/* Add hint on hover for empty days */}
                    {evts.length === 0 && currentMonth && (
                      <div className="hidden group-hover:block" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Day Detail Panel ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                {fmtDate(selectedDay + 'T00:00:00')}
              </p>
              <p className="text-xs text-slate-400">
                {dayAppts.length === 0 ? 'Randevu yok' : `${dayAppts.length} randevu`}
              </p>
            </div>
            <button
              onClick={() => openModalForDay(selectedDay)}
              className="p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors">
              <Plus size={16} />
            </button>
          </div>

          {/* Appointments for selected day */}
          <div className="flex-1 overflow-y-auto">
            {dayAppts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Calendar size={28} className="mb-2 text-slate-300" />
                <p className="text-sm">Bu gün randevu yok</p>
                <button
                  onClick={() => openModalForDay(selectedDay)}
                  className="mt-3 text-xs text-brand-500 hover:text-brand-700 flex items-center gap-1">
                  <Plus size={12} />
                  Randevu ekle
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dayAppts
                  .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                  .map(appt => {
                    const endTime = new Date(
                      new Date(appt.scheduled_at).getTime() + appt.duration_minutes * 60_000
                    ).toISOString()
                    const barCls  = SOURCE_BAR_CLASS[appt.source] ?? 'bg-slate-300'
                    const name    = appt.title ?? appt.contacts?.full_name ?? '(Başlıksız)'
                    return (
                      <div key={appt.id} className="px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors group">
                        <div className={`w-1 rounded-full shrink-0 ${barCls}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {['scheduled', 'confirmed', 'rescheduled'].includes(appt.status) && (
                                <>
                                  <button
                                    onClick={() => updateStatus(appt.id, 'attended')}
                                    disabled={updatingStatus === appt.id}
                                    className="p-1 rounded hover:bg-green-100 text-slate-300 hover:text-green-600 transition-colors disabled:opacity-40"
                                    title="Katıldı">
                                    <CheckCircle2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => updateStatus(appt.id, 'no_show')}
                                    disabled={updatingStatus === appt.id}
                                    className="p-1 rounded hover:bg-orange-100 text-slate-300 hover:text-orange-500 transition-colors disabled:opacity-40"
                                    title="Gelmedi">
                                    <UserX size={13} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => updateStatus(appt.id, 'cancelled')}
                                disabled={updatingStatus === appt.id}
                                className="p-1 rounded hover:bg-red-100 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                                title="İptal Et">
                                <XCircle size={13} />
                              </button>
                              <button
                                onClick={() => openEdit(appt)}
                                className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors"
                                title="Düzenle">
                                <Pencil size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Clock size={11} />
                            {fmtTime(appt.scheduled_at)} — {fmtTime(endTime)}
                          </div>
                          {appt.title && appt.contacts?.full_name && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                              <User size={11} />
                              {appt.contacts.full_name}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
                              ${SOURCE_CHIP_CLASS[appt.source] ?? 'bg-slate-100 text-slate-600'}`}>
                              {SOURCE_LABELS[appt.source] ?? appt.source}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
                            </span>
                          </div>
                          {appt.notes && (
                            <p className="text-xs text-slate-400 mt-1 truncate">{appt.notes}</p>
                          )}
                          {appt.lead_id && (
                            <Link href={`/dashboard/leads/${appt.lead_id}`}
                              className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 mt-1">
                              <Link2 size={10} />
                              Lead detayı
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Upcoming Appointments (next 14 days) ── */}
      <UpcomingSection appointments={appointments} />

      {/* ── Edit Appointment Modal ── */}
      {editAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800">Randevu Düzenle</h2>
              <button onClick={() => setEditAppt(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Randevu başlığı"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Randevu Tipi</label>
                <select
                  value={editForm.appointment_type}
                  onChange={e => setEditForm(f => ({ ...f, appointment_type: e.target.value as AppointmentType }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {(Object.entries(TYPE_LABELS) as [AppointmentType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama / Not</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="İsteğe bağlı not..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {editAppt.source === 'platform' && (
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                Google Takvim'e otomatik yansıyacak
              </p>
            )}

            {editError && <p className="text-sm text-red-500 mt-3">{editError}</p>}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setEditAppt(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                İptal
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {editSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Appointment Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800">Yeni Randevu</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(''); setLeadSearch('') }}
                className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
                <input value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Randevu başlığı"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Randevu Tipi</label>
                <select value={form.appointment_type}
                  onChange={e => setForm(f => ({ ...f, appointment_type: e.target.value as AppointmentType }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {(Object.entries(TYPE_LABELS) as [AppointmentType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tarih *</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç *</label>
                  <input type="time" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş *</label>
                  <input type="time" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>

              {/* Lead seçimi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead bağlantısı</label>
                {form.leadId ? (
                  <div className="flex items-center justify-between border border-brand-200 bg-brand-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-brand-700">
                        {selectedLead?.contacts?.full_name ?? 'İsimsiz'}
                      </p>
                      {selectedLead?.contacts?.phone && (
                        <p className="text-xs text-brand-500">{selectedLead.contacts.phone}</p>
                      )}
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, leadId: '' }))}
                      className="text-brand-400 hover:text-brand-600"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                      placeholder="Lead ara..."
                      className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    {(leads.length > 0 || leadsLoading) && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                        {leadsLoading ? (
                          <div className="flex items-center gap-2 px-3 py-2 text-slate-400 text-sm">
                            <Loader2 size={13} className="animate-spin" />Yükleniyor...
                          </div>
                        ) : leads.map(lead => (
                          <button key={lead.id} type="button"
                            onClick={() => { setForm(f => ({ ...f, leadId: lead.id })); setLeadSearch('') }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">
                            <span className="font-medium text-slate-700">
                              {lead.contacts?.full_name ?? 'İsimsiz'}
                            </span>
                            {lead.contacts?.phone && (
                              <span className="text-slate-400 ml-2 text-xs">{lead.contacts.phone}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notlar</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="İsteğe bağlı not..." rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            {provider === 'google' && (
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                Google Takvim'e otomatik eklenecek
              </p>
            )}
            {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(''); setLeadSearch('') }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                İptal
              </button>
              <button onClick={createAppointment} disabled={saving}
                className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Upcoming Section ───────────────────────────────────────────────────────────

function UpcomingSection({ appointments }: { appointments: Appointment[] }) {
  const now    = new Date()
  const cutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const upcoming = appointments
    .filter(a => new Date(a.scheduled_at) >= now && new Date(a.scheduled_at) <= cutoff)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .slice(0, 10)

  if (upcoming.length === 0) return null

  return (
    <div className="mt-5">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Yaklaşan 14 Gün
      </h2>
      <div className="space-y-2">
        {upcoming.map(appt => {
          const barCls  = SOURCE_BAR_CLASS[appt.source] ?? 'bg-slate-300'
          const name    = appt.title ?? appt.contacts?.full_name ?? '(Başlıksız)'
          const endTime = new Date(
            new Date(appt.scheduled_at).getTime() + appt.duration_minutes * 60_000
          ).toISOString()
          return (
            <div key={appt.id}
              className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-start gap-3 hover:border-brand-200 transition-colors">
              <div className={`mt-0.5 w-1 h-10 rounded-full shrink-0 ${barCls}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={11} />
                    {new Date(appt.scheduled_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    {' · '}
                    {fmtTime(appt.scheduled_at)} — {fmtTime(endTime)}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
                    ${SOURCE_CHIP_CLASS[appt.source] ?? 'bg-slate-100 text-slate-600'}`}>
                    {SOURCE_LABELS[appt.source] ?? appt.source}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
                  </span>
                </div>
              </div>
              {appt.lead_id && (
                <Link href={`/dashboard/leads/${appt.lead_id}`}
                  className="text-slate-300 hover:text-brand-500 mt-0.5 transition-colors">
                  <Link2 size={15} />
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
