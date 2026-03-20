'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import type { SupportTicket, TicketStatus } from '@/lib/types'
import { ChevronDown } from 'lucide-react'

interface Props {
  tickets: any[]
}

const statusColors: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-500',
  normal: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export default function TicketsClient({ tickets: initialTickets }: Props) {
  const [tickets, setTickets] = useState(initialTickets)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateStatus(id: string, status: TicketStatus, adminNotes?: string) {
    setUpdating(id)
    const supabase = createClient()
    const update: any = { status }
    if (adminNotes !== undefined) update.admin_notes = adminNotes

    const { data } = await supabase
      .from('support_tickets')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (data) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    }
    setUpdating(null)
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-900 mb-6">{t.ticketsTitle}</h1>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-10 text-center text-slate-400">{t.noData}</div>
        ) : tickets.map(ticket => (
          <div key={ticket.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div
              className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status] || 'bg-slate-100'}`}>
                    {t[ticket.status as keyof typeof t] as string || ticket.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority] || 'bg-slate-100'}`}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs text-slate-400">{ticket.organization?.name}</span>
                </div>
                <p className="font-medium text-slate-800">{ticket.subject}</p>
                <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{ticket.message}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-slate-400">
                  {new Date(ticket.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform ${expanded === ticket.id ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {expanded === ticket.id && (
              <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{t.message}</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.message}</p>
                </div>

                {ticket.admin_notes && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{t.adminNotes}</p>
                    <p className="text-sm text-slate-700">{ticket.admin_notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-medium text-slate-600">{t.updateStatus}:</span>
                  {(['open', 'in_progress', 'resolved'] as TicketStatus[]).map(s => (
                    <button
                      key={s}
                      disabled={ticket.status === s || updating === ticket.id}
                      onClick={() => updateStatus(ticket.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                        ticket.status === s
                          ? statusColors[s]
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t[s as keyof typeof t] as string || s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
