'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Flame, Search, Loader2, UserPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Pipeline, PipelineStage } from '@/lib/types'

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
  pipeline: Pipeline | null
  readOnly?: boolean
}

// Default pipeline — static columns matching leads.status
const DEFAULT_COLUMNS: { key: LeadStatus; label: string; color: string; headerColor: string }[] = [
  { key: 'new',         label: 'Yeni',           color: 'bg-slate-50 border-slate-200',     headerColor: 'bg-slate-100 text-slate-700' },
  { key: 'in_progress', label: 'Aktif',           color: 'bg-blue-50 border-blue-100',       headerColor: 'bg-blue-100 text-blue-700' },
  { key: 'handed_off',  label: 'Temsilci Talep',  color: 'bg-amber-50 border-amber-100',     headerColor: 'bg-amber-100 text-amber-700' },
  { key: 'nurturing',   label: 'Takipte',         color: 'bg-purple-50 border-purple-100',   headerColor: 'bg-purple-100 text-purple-700' },
  { key: 'qualified',   label: 'Randevu',         color: 'bg-green-50 border-green-100',     headerColor: 'bg-green-100 text-green-700' },
  { key: 'converted',   label: 'Dönüştü',         color: 'bg-emerald-50 border-emerald-100', headerColor: 'bg-emerald-100 text-emerald-700' },
  { key: 'lost',        label: 'Kaybedildi',      color: 'bg-red-50 border-red-100',         headerColor: 'bg-red-100 text-red-700' },
]

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Yeni', in_progress: 'Aktif', handed_off: 'Temsilci', nurturing: 'Takipte',
  qualified: 'Randevu', converted: 'Dönüştü', lost: 'Kayıp',
}

const PAGE_SIZE = 20

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

// ── Add Lead Modal (Custom Pipeline) ──────────────────────────────────────────

function AddLeadToStageModal({
  pipelineId,
  stageId,
  stageName,
  onAdded,
  onClose,
}: {
  pipelineId: string
  stageId: string
  stageName: string
  onAdded: () => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (query.length < 1) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const sb = createClient()

      // 1. contacts tablosunda ara → contact_id listesi
      const { data: contacts } = await sb
        .from('contacts')
        .select('id')
        .or(`phone.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(200)

      const contactIds = (contacts ?? []).map((c: any) => c.id)

      // 2. leads: contact_id eşleşenleri + collected_data->full_name eşleşenleri
      const byContact = contactIds.length > 0
        ? await sb.from('leads')
            .select('id, qualification_score, status, collected_data, contacts(full_name, phone)')
            .in('contact_id', contactIds)
            .limit(20)
        : { data: [] }

      const byName = await sb.from('leads')
        .select('id, qualification_score, status, collected_data, contacts(full_name, phone)')
        .ilike('collected_data->>full_name', `%${query}%`)
        .limit(20)

      const results = [byContact, byName]
      const merged: any[] = []
      const seen = new Set<string>()
      for (const r of results) {
        for (const lead of r.data ?? []) {
          if (!seen.has(lead.id)) { seen.add(lead.id); merged.push(lead) }
        }
      }

      setResults(merged)
      setSearching(false)
    }, 350)
  }, [query])

  async function handleAdd(leadId: string) {
    setAdding(leadId)
    await fetch(`/api/pipelines/${pipelineId}/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId }),
    })
    setAdding(null)
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">
            <span className="text-brand-600">{stageName}</span> aşamasına lead ekle
          </p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="İsim veya telefon ile ara..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
          {searching && (
            <div className="flex justify-center py-6 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
            </div>
          )}
          {!searching && query.length >= 1 && results.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Eşleşen lead bulunamadı.</p>
          )}
          {!searching && results.map((lead: any) => {
            const name = lead.collected_data?.full_name || lead.contacts?.full_name
            const phone = lead.contacts?.phone || lead.collected_data?.phone
            const isAdding = adding === lead.id
            return (
              <div key={lead.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{name || <span className="text-slate-400">İsimsiz</span>}</p>
                  {phone && <p className="text-xs text-slate-500 font-mono">{phone}</p>}
                </div>
                <button
                  onClick={() => handleAdd(lead.id)}
                  disabled={!!adding}
                  className="ml-3 shrink-0 flex items-center gap-1 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isAdding ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
                  Ekle
                </button>
              </div>
            )
          })}
          {query.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">Aramak için yazmaya başlayın</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Default Pipeline Board ─────────────────────────────────────────────────────

function DefaultKanban({ orgId, readOnly }: { orgId: string; readOnly?: boolean }) {
  const [cols, setCols] = useState<Record<string, ColState>>(() =>
    Object.fromEntries(DEFAULT_COLUMNS.map(c => [c.key, initCol()]))
  )
  const [movingId, setMovingId] = useState<string | null>(null)
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchCol = useCallback(async (status: string, search: string, page: number, append: boolean) => {
    setCols(prev => ({ ...prev, [status]: { ...prev[status], loading: true } }))
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

  useEffect(() => {
    if (!orgId) return
    DEFAULT_COLUMNS.forEach(col => fetchCol(col.key, '', 0, false))
  }, [orgId, fetchCol])

  function handleSearch(status: string, val: string) {
    setCols(prev => ({ ...prev, [status]: { ...prev[status], search: val } }))
    if (debounceRefs.current[status]) clearTimeout(debounceRefs.current[status])
    debounceRefs.current[status] = setTimeout(() => {
      fetchCol(status, val, 0, false)
    }, 400)
  }

  function loadMore(status: string) {
    const col = cols[status]
    fetchCol(status, col.search, col.page + 1, true)
  }

  async function moveToStatus(leadId: string, fromStatus: string, newStatus: LeadStatus) {
    setMovingId(leadId)
    const res = await fetch(`/api/leads/${leadId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
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
    <KanbanGrid
      columns={DEFAULT_COLUMNS.map(c => ({ id: c.key, label: c.label, color: c.color, headerColor: c.headerColor }))}
      cols={cols}
      movingId={movingId}
      onSearch={handleSearch}
      onLoadMore={loadMore}
      renderMoveControl={(lead, colId) => (
        <select
          value={lead.status}
          onChange={e => moveToStatus(lead.id, colId, e.target.value as LeadStatus)}
          disabled={readOnly || movingId === lead.id}
          className="text-[10px] border border-slate-200 rounded px-1 py-1 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:opacity-50"
        >
          {DEFAULT_COLUMNS.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      )}
    />
  )
}

// ── Custom Pipeline Board ──────────────────────────────────────────────────────

function CustomKanban({ orgId, pipeline, readOnly }: { orgId: string; pipeline: Pipeline; readOnly?: boolean }) {
  const stages = (pipeline.stages ?? []).slice().sort((a, b) => a.position - b.position)

  const [cols, setCols] = useState<Record<string, ColState>>(() =>
    Object.fromEntries(stages.map(s => [s.id, initCol()]))
  )
  const [movingId, setMovingId] = useState<string | null>(null)
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const [addModal, setAddModal] = useState<{ stageId: string; stageName: string } | null>(null)

  const fetchCol = useCallback(async (stageId: string, search: string, page: number, append: boolean) => {
    setCols(prev => ({ ...prev, [stageId]: { ...prev[stageId], loading: true } }))
    const params = new URLSearchParams({ stage_id: stageId, page: String(page) })
    if (search) params.set('q', search)
    const res = await fetch(`/api/pipelines/${pipeline.id}/kanban?${params}`)
    const data = await res.json()
    const newLeads: Lead[] = data.leads ?? []
    const count: number = data.count ?? 0
    setCols(prev => {
      const existing = append ? (prev[stageId]?.leads ?? []) : []
      return {
        ...prev,
        [stageId]: {
          ...prev[stageId],
          leads: [...existing, ...newLeads],
          count,
          loading: false,
          page,
          hasMore: (append ? existing.length + newLeads.length : newLeads.length) < count,
        },
      }
    })
  }, [pipeline.id])

  useEffect(() => {
    stages.forEach(s => fetchCol(s.id, '', 0, false))
    // Re-init col state when pipeline/stages change
    setCols(Object.fromEntries(stages.map(s => [s.id, initCol()])))
    stages.forEach(s => fetchCol(s.id, '', 0, false))
  }, [pipeline.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(stageId: string, val: string) {
    setCols(prev => ({ ...prev, [stageId]: { ...prev[stageId], search: val } }))
    if (debounceRefs.current[stageId]) clearTimeout(debounceRefs.current[stageId])
    debounceRefs.current[stageId] = setTimeout(() => {
      fetchCol(stageId, val, 0, false)
    }, 400)
  }

  function loadMore(stageId: string) {
    const col = cols[stageId] ?? initCol()
    fetchCol(stageId, col.search, col.page + 1, true)
  }

  async function moveToStage(leadId: string, fromStageId: string, newStageId: string) {
    setMovingId(leadId)
    const res = await fetch(`/api/pipelines/${pipeline.id}/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: newStageId }),
    })
    if (res.ok) {
      setCols(prev => ({
        ...prev,
        [fromStageId]: {
          ...prev[fromStageId],
          leads: prev[fromStageId].leads.filter(l => l.id !== leadId),
          count: Math.max(0, prev[fromStageId].count - 1),
        },
      }))
      const col = cols[newStageId] ?? initCol()
      fetchCol(newStageId, col.search, 0, false)
    }
    setMovingId(null)
  }

  return (
    <>
      {addModal && (
        <AddLeadToStageModal
          pipelineId={pipeline.id}
          stageId={addModal.stageId}
          stageName={addModal.stageName}
          onAdded={() => fetchCol(addModal.stageId, cols[addModal.stageId]?.search ?? '', 0, false)}
          onClose={() => setAddModal(null)}
        />
      )}
      <KanbanGrid
        columns={stages.map(s => ({
          id: s.id,
          label: s.name,
          color: 'bg-white border-slate-200',
          headerColor: 'text-slate-700',
          stageColor: s.color,
        }))}
        cols={cols}
        movingId={movingId}
        onSearch={handleSearch}
        onLoadMore={loadMore}
        onAddClick={readOnly ? undefined : (stageId, stageName) => setAddModal({ stageId, stageName })}
        renderMoveControl={(lead, colId) => (
          <select
            value={colId}
            onChange={e => moveToStage(lead.id, colId, e.target.value)}
            disabled={readOnly || movingId === lead.id}
            className="text-[10px] border border-slate-200 rounded px-1 py-1 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:opacity-50"
          >
            {stages.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        renderExtraBadge={(lead) => (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
            {STATUS_LABELS[lead.status]}
          </span>
        )}
      />
    </>
  )
}

// ── Shared Grid ────────────────────────────────────────────────────────────────

interface GridColumn {
  id: string
  label: string
  color: string
  headerColor: string
  stageColor?: string  // custom pipeline stage color
}

function KanbanGrid({
  columns,
  cols,
  movingId,
  onSearch,
  onLoadMore,
  onAddClick,
  renderMoveControl,
  renderExtraBadge,
}: {
  columns: GridColumn[]
  cols: Record<string, ColState>
  movingId: string | null
  onSearch: (colId: string, val: string) => void
  onLoadMore: (colId: string) => void
  onAddClick?: (colId: string, label: string) => void
  renderMoveControl: (lead: Lead, colId: string) => React.ReactNode
  renderExtraBadge?: (lead: Lead) => React.ReactNode
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map(col => {
        const state = cols[col.id] ?? initCol()
        const bgStyle = col.stageColor
          ? { backgroundColor: col.stageColor + '15', borderColor: col.stageColor + '40' }
          : undefined

        return (
          <div key={col.id} className="flex-shrink-0 w-64">
            {/* Header */}
            <div
              className={`rounded-t-xl px-3 pt-2.5 pb-1.5 ${col.stageColor ? '' : col.headerColor}`}
              style={col.stageColor ? { backgroundColor: col.stageColor + '25', color: col.stageColor } : undefined}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {col.stageColor && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.stageColor }} />
                  )}
                  <span className="text-xs font-semibold">{col.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold opacity-70 flex items-center gap-1">
                    {state.loading && state.leads.length === 0
                      ? <Loader2 size={10} className="animate-spin" />
                      : state.count.toLocaleString('tr-TR')
                    }
                  </span>
                  {onAddClick && (
                    <button
                      onClick={() => onAddClick(col.id, col.label)}
                      title="Lead Ekle"
                      className="opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <UserPlus size={12} />
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                <input
                  type="text"
                  value={state.search}
                  onChange={e => onSearch(col.id, e.target.value)}
                  placeholder="İsim veya telefon..."
                  className="w-full pl-5 pr-2 py-1 text-[10px] rounded-lg bg-white/60 border border-black/10 focus:outline-none focus:bg-white placeholder:opacity-50"
                />
              </div>
            </div>

            {/* Cards */}
            <div
              className={`rounded-b-xl border min-h-[200px] p-2 space-y-2 ${col.stageColor ? '' : col.color}`}
              style={bgStyle}
            >
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

                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        lead.source_channel === 'whatsapp' ? 'bg-green-100 text-green-700' :
                        lead.source_channel === 'instagram' ? 'bg-pink-100 text-pink-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {lead.source_channel}
                      </span>
                      {renderExtraBadge?.(lead)}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-50">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="flex-1 text-center text-[10px] text-brand-600 hover:text-brand-700 font-medium py-1 rounded hover:bg-brand-50 transition-colors"
                      >
                        Detay
                      </Link>
                      {renderMoveControl(lead, col.id)}
                    </div>
                  </div>
                )
              })}

              {state.hasMore && (
                <button
                  onClick={() => onLoadMore(col.id)}
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

// ── Main Export ────────────────────────────────────────────────────────────────

export default function KanbanBoard({ orgId, pipeline, readOnly }: Props) {
  if (!pipeline || pipeline.is_default) {
    return <DefaultKanban orgId={orgId} readOnly={readOnly} />
  }
  return <CustomKanban orgId={orgId} pipeline={pipeline} readOnly={readOnly} />
}
