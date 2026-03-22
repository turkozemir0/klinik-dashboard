'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ChevronDown, LifeBuoy } from 'lucide-react'
import { t } from '@/lib/i18n'

const statusColors: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
}

const priorityLabels: Record<string, string> = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
  urgent: 'Acil',
}

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  admin_notes: string | null
  created_at: string
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [orgId, setOrgId] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('org_users')
        .select('organization_id')
        .eq('user_id', data.user.id)
        .maybeSingle()
        .then(({ data: ou }) => {
          if (!ou) { setLoading(false); return }
          setOrgId(ou.organization_id)
          supabase
            .from('support_tickets')
            .select('id, subject, message, status, priority, admin_notes, created_at')
            .eq('organization_id', ou.organization_id)
            .order('created_at', { ascending: false })
            .then(({ data: rows }) => {
              setTickets(rows ?? [])
              setLoading(false)
            })
        })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim() || !orgId) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('support_tickets')
      .insert({ organization_id: orgId, subject: subject.trim(), message: message.trim(), priority })
      .select('id, subject, message, status, priority, admin_notes, created_at')
      .single()

    if (err) {
      setError('Talep gönderilemedi. Lütfen tekrar deneyin.')
    } else if (data) {
      setTickets(prev => [data, ...prev])
      setSubject('')
      setMessage('')
      setPriority('normal')
      setShowForm(false)
    }
    setSubmitting(false)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.ticketsTitle}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Sorun ve taleplerinizi buradan iletebilirsiniz.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Yeni Talep
        </button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-brand-100 shadow-sm p-5 mb-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Yeni Destek Talebi</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Konu</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Kısaca konuyu belirtin"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mesaj</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="Sorununuzu veya talebinizi detaylı açıklayın..."
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="low">Düşük</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {submitting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        </form>
      )}

      {/* Ticket list */}
      {loading ? (
        <p className="text-sm text-slate-400">{t.loading}</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-12 text-center">
          <LifeBuoy size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">Henüz destek talebiniz yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div
                className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status] || 'bg-slate-100 text-slate-600'}`}>
                      {t[ticket.status as keyof typeof t] as string || ticket.status}
                    </span>
                    <span className="text-xs text-slate-400">{priorityLabels[ticket.priority] || ticket.priority}</span>
                  </div>
                  <p className="font-medium text-slate-800">{ticket.subject}</p>
                  <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{ticket.message}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400">
                    {new Date(ticket.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-slate-400 transition-transform ${expanded === ticket.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {expanded === ticket.id && (
                <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{t.message}</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.message}</p>
                  </div>
                  {ticket.admin_notes && (
                    <div className="bg-brand-50 border border-brand-100 rounded-lg p-3">
                      <p className="text-xs font-medium text-brand-700 mb-1">stoaix yanıtı</p>
                      <p className="text-sm text-slate-700">{ticket.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
