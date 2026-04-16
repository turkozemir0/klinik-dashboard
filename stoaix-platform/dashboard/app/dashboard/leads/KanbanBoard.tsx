'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Flame, Search, Loader2 } from 'lucide-react'

type LeadStatus = 'new' | 'in_progress' | 'handed_off' | 'nurturing' | 'qualified' | 'converted' | 'lost'

interface Lead {
  id: string
  qualification_score: number
  status: LeadStatus
  source_channel: string
  collected_data: Record<string, any>
  updated_at: string
  contacts: { phone: string | null; full_name: string | null } | null
}

interface ColState {
  leads: Lead[]
  count: number
  loading: boolean
  page: number
  search: string
  hasMore: boolean
}

interface Props {
  orgId: string
}

const COLUMNS: { key: LeadStatus; label: string; color: string; headerColor: string }[] = [
  { key: 'new',         label: 'Yeni',           color: 'bg-slate-50 border-slate-200',     headerColor: 'bg-slate-100 text-slate-700' },
  { key: 'in_progress', label: 'Aktif',           color: 'bg-blue-50 border-blue-100',       headerColor: 'bg-blue-100 text-blue-700' },
  { key: 'handed_off',  label: 'Temsilci Talep',  color: 'bg-amber-50 border-amber-100',     headerColor: 'bg-amber-100 text-amber-700' },
  { key: 'nurturing',   label: 'Takipte',         color: 'bg-purple-50 border-purple-100',   headerColor: 'bg-purple-100 text-purple-700' },
  { key: 'qualified',   label: 'Randevu',         color: 'bg-green-50 border-green-100',     headerColor: 'bg-green-100 text-green-700' },
  { key: 'converted',   label: 'Dönüştü',         color: 'bg-emerald-50 border-emerald-100', headerColor: 'bg-emerald-100 text-emerald-700' },
  { key: 'lost',        label: 'Kaybedildi',      color: 'bg-red-50 border-red-100',         headerColor: 'bg-red-100 text-red-700' },
]

const PAGE_SIZE = 30

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-red-500 text-white' :
    score >= 60 ? 'bg-orange-400 text-white' :
    score >= 40 ? 'bg-amber-400 text-white' :
                  'bg-slate-200 text-slate-600'
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      {score >= 70 && <Flame size={8} />}
      {score}
    </span>
  )
}

function initCol(): ColState {
  return { leads: [], count: 0, loading: true, page: 0, search: '', hasMore: false }
}

export default function KanbanBoard({ orgId }: Props) {
  const [cols, setCols] = useState<Record<string, ColState>>(() =>
    Object.fromEntries(COLUMNS.map(c => [c.key, initCol()]))
  )
  const [movingId, setMovingId] = useState<string | null>(null)
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Tek bir kolon için veri çek
  const fetchCol = useCallback(async (status: string, search: string, page: number, append: boolean) => {
    setCols(prev => ({
      ...prev,
      [status]: { ...prev[status], loading: true },
    }))

    const params = new URLSearchParams({ status, page: String(page) })
    if (search) params.set('q', search)

    const res = await fetch(`/api/leads/kanban?${params}`)
    const data = await res.json()

    const newLeads: Lead[] = data.leads ?? []
    const count: number = data.count ?? 0

    setCols(prev => {
      const existing = append ? prev[status].leads : []
      return {
        ...prev,
        [status]: {
          ...prev[status],
          leads: [...existing, ...newLeads],
          count,
          loading: false,
          page,
          hasMore: (append ? existing.length + newLeads.length : newLeads.length) < count,
        },
      }
    })
  }, [])

  // İlk yüklemede tüm kolonları paralel çek
  useEffect(() => {
    if (!orgId) return
    COLUMNS.forEach(col => fetchCol(col.key, '', 0, false))
  }, [orgId, fetchCol])

  // Arama — debounce
  function handleSearch(status: string, val: string) {
    setCols(prev => ({ ...prev, [status]: { ...prev[status], search: val } }))

    if (debounceRefs.current[status]) clearTimeout(debounceRefs.current[status])
    debounceRefs.current[status] = setTimeout(() => {
      fetchCol(status, val, 0, false)
    }, 400)
  }

  // Daha fazla göster
  function loadMore(status: string) {
    const col = cols[status]
    fetchCol(status, col.search, col.page + 1, true)
  }

  // Kart taşı
  async function moveToStatus(leadId: string, fromStatus: string, newStatus: LeadStatus) {
    setMovingId(leadId)
    const res = await fetch(`/api/leads/${leadId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      // Kaynaktan kaldır, hedef kolonu yeniden yükle
      setCols(prev => ({
        ...prev,
        [fromStatus]: {
          ...prev[fromStatus],
          leads: prev[fromStatus].leads.filter(l => l.id !== leadId),
          count: Math.max(0, prev[fromStatus].count - 1),
        },
      }))
      fetchCol(newStatus, cols[newStatus].search, 0, false)
    }
    setMovingId(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const state = cols[col.key]

        return (
          <div key={col.key} className="flex-shrink-0 w-64">
            {/* Kolon başlığı */}
            <div className={`rounded-t-xl px-3 pt-2.5 pb-1.5 ${col.headerColor}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold">{col.label}</span>
                <span className="text-xs font-bold opacity-70 flex items-center gap-1">
                  {state.loading && state.leads.length === 0
                    ? <Loader2 size={10} className="animate-spin" />
                    : state.count.toLocaleString('tr-TR')
                  }
                </span>
              </div>
              {/* Arama */}
              <div className="relative">
                <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                <input
                  type="text"
                  value={state.search}
                  onChange={e => handleSearch(col.key, e.target.value)}
                  placeholder="İsim veya telefon..."
                  className="w-full pl-5 pr-2 py-1 text-[10px] rounded-lg bg-white/60 border border-black/10 focus:outline-none focus:bg-white placeholder:opacity-50"
                />
              </div>
            </div>

            {/* Kartlar */}
            <div className={`rounded-b-xl border ${col.color} min-h-[200px] p-2 space-y-2`}>
              {state.loading && state.leads.length === 0 && (
                <div className="flex justify-center py-8 text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}

              {!state.loading && state.leads.length === 0 && (
                <p className="text-[11px] text-slate-400 text-center py-6">
                  {state.search ? 'Eşleşme yok' : 'Lead yok'}
                </p>
              )}

              {state.leads.map(lead => {
                const name = lead.collected_data?.full_name || lead.contacts?.full_name
                const phone = lead.contacts?.phone || lead.collected_data?.phone
                const isMoving = movingId === lead.id

                return (
                  <div
                    key={lead.id}
                    className={`bg-white rounded-xl border border-slate-100 p-3 shadow-sm transition-opacity ${isMoving ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <p className="text-xs font-medium text-slate-800 truncate flex-1">
                        {name || <span className="text-slate-400">İsimsiz</span>}
                      </p>
                      <ScoreBadge score={lead.qualification_score} />
                    </div>

                    {phone && (
                      <p className="text-[11px] text-slate-500 font-mono mb-2 truncate">{phone}</p>
                    )}

                    <div className="flex items-center gap-1 mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        lead.source_channel === 'whatsapp' ? 'bg-green-100 text-green-700' :
                        lead.source_channel === 'instagram' ? 'bg-pink-100 text-pink-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {lead.source_channel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-50">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="flex-1 text-center text-[10px] text-brand-600 hover:text-brand-700 font-medium py-1 rounded hover:bg-brand-50 transition-colors"
                      >
                        Detay
                      </Link>
                      <select
                        value={lead.status}
                        onChange={e => moveToStatus(lead.id, col.key, e.target.value as LeadStatus)}
                        disabled={isMoving}
                        className="text-[10px] border border-slate-200 rounded px-1 py-1 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:opacity-50"
                      >
                        {COLUMNS.map(c => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}

              {/* Daha fazla */}
              {state.hasMore && (
                <button
                  onClick={() => loadMore(col.key)}
                  disabled={state.loading}
                  className="w-full text-[11px] text-slate-500 hover:text-slate-700 py-2 border border-dashed border-slate-200 rounded-xl hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {state.loading
                    ? <><Loader2 size={10} className="animate-spin" /> Yükleniyor...</>
                    : `+ ${(state.count - state.leads.length).toLocaleString('tr-TR')} kişi daha`
                  }
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
