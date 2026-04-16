'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Phone, MessageCircle, FileText, MoreHorizontal, CheckCircle2, Trash2, Clock } from 'lucide-react'

type ActionType = 'call' | 'whatsapp' | 'offer' | 'other'
type TaskStatus = 'pending' | 'done' | 'cancelled'

interface ManualTask {
  id: string
  status: TaskStatus
  scheduled_at: string
  variables: { note?: string; action_type?: ActionType; contact_name?: string; contact_phone?: string }
  contact?: { id: string; full_name?: string; phone?: string } | null
  created_at: string
}

const ACTION_META: Record<ActionType, { label: string; color: string; Icon: any }> = {
  call:      { label: 'Ara',         color: 'bg-blue-50 text-blue-600',   Icon: Phone },
  whatsapp:  { label: 'WhatsApp',    color: 'bg-green-50 text-green-600', Icon: MessageCircle },
  offer:     { label: 'Teklif',      color: 'bg-purple-50 text-purple-600', Icon: FileText },
  other:     { label: 'Diğer',       color: 'bg-slate-50 text-slate-600', Icon: MoreHorizontal },
}

function ActionBadge({ type }: { type?: ActionType }) {
  const meta = ACTION_META[type ?? 'other']
  const { Icon } = meta
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
      <Icon size={10} />
      {meta.label}
    </span>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isOverdue = d < now
  const str = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return { str, isOverdue }
}

export default function ManualTasksPanel() {
  const [tasks, setTasks]       = useState<ManualTask[]>([])
  const [loading, setLoading]   = useState(true)
  const [showDone, setShowDone] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [note, setNote]               = useState('')
  const [actionType, setActionType]   = useState<ActionType>('call')
  const [scheduledAt, setScheduledAt] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [submitting, setSubmitting]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/followup/manual')
    if (res.ok) setTasks(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim() || !scheduledAt) return
    setSubmitting(true)
    await fetch('/api/followup/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note, action_type: actionType, scheduled_at: scheduledAt,
        contact_name: contactName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
      }),
    })
    setNote(''); setScheduledAt(''); setActionType('call')
    setContactName(''); setContactPhone(''); setShowForm(false)
    await load()
    setSubmitting(false)
  }

  async function handleStatus(id: string, status: TaskStatus) {
    await fetch(`/api/followup/manual/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/followup/manual/${id}`, { method: 'DELETE' })
    await load()
  }

  const pending = tasks.filter(t => t.status === 'pending')
  const done    = tasks.filter(t => t.status === 'done' || t.status === 'cancelled')

  // Default scheduled_at → yarın 09:00
  function defaultScheduled() {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  }

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {pending.length} bekleyen görev
        </p>
        <button
          onClick={() => { setShowForm(v => !v); if (!scheduledAt) setScheduledAt(defaultScheduled()) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus size={13} />
          Görev Ekle
        </button>
      </div>

      {/* Yeni Görev Formu */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700">Yeni Manuel Görev</p>

          {/* Aksiyon tipi */}
          <div className="flex gap-2">
            {(Object.keys(ACTION_META) as ActionType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setActionType(t)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  actionType === t
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                {ACTION_META[t].label}
              </button>
            ))}
          </div>

          {/* Kişi bilgisi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Ad Soyad</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="Max Mustermann"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Telefon / WhatsApp</label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+49 173 704 3983"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Not */}
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Görev notu — örn. 'Saç analizi için aranacak, fiyat sormak istiyor'"
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            required
          />

          {/* Tarih */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Planlanan Tarih & Saat</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Bekleyen Görevler */}
      {loading ? (
        <p className="text-sm text-slate-400 text-center py-8">Yükleniyor...</p>
      ) : pending.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <CheckCircle2 size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Bekleyen görev yok.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map(task => {
            const { str, isOverdue } = formatDate(task.scheduled_at)
            const contactName = task.contact?.full_name || task.contact?.phone || null
            return (
              <div key={task.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-start gap-3 hover:border-slate-200 transition-colors">
                {/* Tamamlandı butonu */}
                <button
                  onClick={() => handleStatus(task.id, 'done')}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-200 hover:border-green-400 hover:bg-green-50 transition-colors flex-shrink-0"
                  title="Tamamlandı işaretle"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <ActionBadge type={task.variables?.action_type} />
                    {(task.variables?.contact_name || task.contact?.full_name) && (
                      <span className="text-xs text-slate-700 font-medium">
                        {task.variables?.contact_name || task.contact?.full_name}
                      </span>
                    )}
                    {(task.variables?.contact_phone || task.contact?.phone) && (
                      <span className="text-xs text-slate-400 font-mono">
                        {task.variables?.contact_phone || task.contact?.phone}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-snug">{task.variables?.note ?? '—'}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={11} className={isOverdue ? 'text-red-400' : 'text-slate-300'} />
                    <span className={`text-[11px] ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                      {str}{isOverdue && ' · Gecikmiş'}
                    </span>
                  </div>
                </div>

                {/* Sil */}
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Tamamlananlar toggle */}
      {done.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(v => !v)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showDone ? '▾ Tamamlananları gizle' : `▸ ${done.length} tamamlanan görev`}
          </button>

          {showDone && (
            <div className="mt-2 space-y-1.5">
              {done.map(task => (
                <div key={task.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-3 opacity-60">
                  <CheckCircle2 size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <ActionBadge type={task.variables?.action_type} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        task.status === 'cancelled' ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600'
                      }`}>
                        {task.status === 'cancelled' ? 'İptal' : 'Tamamlandı'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{task.variables?.note ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-slate-200 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
