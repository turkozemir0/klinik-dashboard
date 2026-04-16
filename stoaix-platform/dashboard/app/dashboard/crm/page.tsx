'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Phone, MessageSquare, Flame, Target, Loader2, LayoutGrid, List,
  ChevronLeft, ChevronRight, FileText, Wallet, Send, Clock, AlertCircle,
  CalendarDays, Plus,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import KanbanBoard from '../leads/KanbanBoard'
import StatCard from '@/components/StatCard'
import ManualTasksPanel from '@/components/followup/ManualTasksPanel'
import FollowupTabs from '@/components/followup/FollowupTabs'

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'in_progress' | 'handed_off' | 'nurturing' | 'qualified' | 'converted' | 'lost'

interface Lead {
  id: string
  qualification_score: number
  status: LeadStatus
  source_channel: string
  collected_data: Record<string, any>
  updated_at: string
  contact_id: string
  contacts: { phone: string | null; full_name: string | null; source_channel: string } | null
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Yeni', in_progress: 'Aktif', handed_off: 'Temsilci Talep',
  nurturing: 'Takipte', qualified: 'Randevu', converted: 'Dönüştü', lost: 'Kaybedildi',
}

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: 'bg-slate-100 text-slate-600', in_progress: 'bg-blue-50 text-blue-700',
  handed_off: 'bg-amber-50 text-amber-700', nurturing: 'bg-purple-50 text-purple-700',
  qualified: 'bg-green-50 text-green-700', converted: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-red-50 text-red-500',
}

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak', sent: 'Gönderildi', accepted: 'Kabul', rejected: 'Reddedildi', signed: 'İmzalandı',
}
const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600', sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  signed: 'bg-emerald-100 text-emerald-700',
}

const STAGE_LABELS: Record<string, string> = {
  first_reminder: 'İlk Hatırlatma', warm_day4: 'Gün 4 (Warm)', warm_day11: 'Gün 11 (Warm)',
  warm_to_cold: 'Soğuyor (G14)', cold_month1: '1. Ay (Cold)', cold_month2: '2. Ay (Cold)',
  cold_final: 'Son Deneme', re_contact_1: 'İlk Temas', re_contact_2: '2. Temas', re_contact_3: 'Son Temas',
}

const ORGANIC_STAGES      = ['first_reminder','warm_day4','warm_day11','warm_to_cold','cold_month1','cold_month2','cold_final']
const REENGAGEMENT_STAGES = ['re_contact_1','re_contact_2','re_contact_3']

// ─── Leads Tab ────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'handed_off' | 'in_progress' | 'new'
const PAGE_SIZE = 100

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-red-500 text-white' :
    score >= 60 ? 'bg-orange-400 text-white' :
    score >= 40 ? 'bg-amber-400 text-white' :
                  'bg-slate-200 text-slate-600'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {score >= 70 && <Flame size={10} />}
      {score}
    </span>
  )
}

function LeadsTab({ orgId }: { orgId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState({ all: 0, new: 0, handed_off: 0, in_progress: 0 })

  useEffect(() => {
    async function loadCounts() {
      const supabase = createClient()
      const [all, newC, handedOff, inProgress] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'new'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'handed_off'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'in_progress'),
      ])
      setStatusCounts({ all: all.count ?? 0, new: newC.count ?? 0, handed_off: handedOff.count ?? 0, in_progress: inProgress.count ?? 0 })
    }
    loadCounts()
  }, [orgId])

  const loadLeads = useCallback(async (filter: FilterStatus, page: number) => {
    setLoading(true)
    const supabase = createClient()
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    let query = supabase
      .from('leads')
      .select('id,qualification_score,status,source_channel,collected_data,updated_at,contact_id,contacts(phone,full_name,source_channel)', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('qualification_score', { ascending: false })
      .order('updated_at', { ascending: false })
      .range(from, to)
    if (filter !== 'all') query = query.eq('status', filter)
    const { data, count } = await query
    setLeads((data as unknown as Lead[]) ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [orgId])

  useEffect(() => { loadLeads(filter, page) }, [filter, page, loadLeads])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleFilter(f: FilterStatus) { setFilter(f); setPage(0) }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm text-slate-500">{statusCounts.all} kayıt</p>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/import"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
          >
            <Plus size={13} />
            Import
          </Link>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={14} /> Tablo
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard orgId={orgId} />
      ) : (
        <>
          <div className="flex gap-2 mb-5 flex-wrap">
            {([['all','Tümü'],['new','Yeni'],['handed_off','Temsilci Talep'],['in_progress','Aktif']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === key ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
                <span className={`ml-1.5 text-xs ${filter === key ? 'text-brand-200' : 'text-slate-400'}`}>
                  {statusCounts[key]}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
              <Loader2 size={16} className="animate-spin" /> Yükleniyor...
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Target size={32} className="mx-auto mb-3 opacity-40" />
              <p>Bu kriterde lead yok.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Kişi</th>
                      <th className="text-left px-4 py-3">Telefon</th>
                      <th className="text-left px-4 py-3">Skor</th>
                      <th className="text-left px-4 py-3">Durum</th>
                      <th className="text-left px-4 py-3">Son Aktiv.</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => {
                      const name = lead.collected_data?.full_name || lead.contacts?.full_name
                      const channel = lead.source_channel
                      const phone = lead.contacts?.phone || (lead.collected_data?.phone as string)
                      const updatedAt = new Date(lead.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${channel === 'whatsapp' ? 'bg-green-100 text-green-600' : channel === 'instagram' ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500'}`}>
                                {channel === 'whatsapp' ? 'W' : channel === 'instagram' ? 'IG' : '?'}
                              </span>
                              <span className="font-medium text-slate-800">
                                {name || <span className="text-slate-400 font-normal">İsimsiz</span>}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {phone ? (
                              <a href={`tel:${phone}`} className="font-mono text-sm text-slate-800 hover:text-brand-600">{phone}</a>
                            ) : <span className="text-xs text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3"><ScoreBadge score={lead.qualification_score} /></td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[lead.status]}`}>
                              {STATUS_LABEL[lead.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{updatedAt}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              {phone && (
                                <a href={`tel:${phone}`} className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors">
                                  <Phone size={12} /> Ara
                                </a>
                              )}
                              <Link href={`/dashboard/leads/${lead.id}`} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">
                                <MessageSquare size={12} /> Detay
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total} kayıt</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={14} /> Önceki
                    </button>
                    <span className="text-sm text-slate-500 px-2">{page + 1} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      Sonraki <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── Proposals & Payments Tab ─────────────────────────────────────────────────

function ProposalsPaymentsTab({ orgId }: { orgId: string }) {
  const [proposals, setProposals] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [propRes, payRes] = await Promise.all([
        supabase
          .from('proposals')
          .select('id, title, total_amount, currency, status, created_at, lead:leads(id, contact:contacts(full_name, phone))')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false }),
        supabase
          .from('payment_schedules')
          .select('id, amount, due_date, status, paid_at, notes, proposal:proposals(id, title, currency, lead:leads(id, contact:contacts(full_name, phone)))')
          .eq('organization_id', orgId)
          .order('due_date', { ascending: true }),
      ])
      setProposals(propRes.data ?? [])
      setPayments(payRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [orgId])

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const totalPending  = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid     = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const overdueCount  = payments.filter(p => p.status === 'pending' && new Date(p.due_date) < today).length

  if (loading) {
    return <div className="flex items-center gap-2 text-slate-400 py-12 justify-center"><Loader2 size={16} className="animate-spin" /> Yükleniyor...</div>
  }

  return (
    <div className="space-y-8">
      {/* Proposals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-brand-600" />
            <h2 className="font-semibold text-slate-800">Teklifler</h2>
            <span className="text-xs text-slate-400">{proposals.length} teklif</span>
          </div>
          <Link
            href="/dashboard/proposals/new"
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> Yeni Teklif
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Müşteri</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teklif</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {proposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <FileText size={32} />
                      <p className="text-sm">Henüz teklif oluşturulmadı.</p>
                    </div>
                  </td>
                </tr>
              ) : proposals.map((p: any) => {
                const contact = p.lead?.contact
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{contact?.full_name || contact?.phone || 'Bilinmeyen'}</p>
                      {contact?.phone && contact?.full_name && <p className="text-xs text-slate-400">{contact.phone}</p>}
                    </td>
                    <td className="px-5 py-3"><p className="font-medium text-slate-700">{p.title}</p></td>
                    <td className="px-5 py-3"><p className="font-semibold text-slate-900">{Number(p.total_amount).toLocaleString('tr-TR')} {p.currency}</p></td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROPOSAL_STATUS_COLORS[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {PROPOSAL_STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {new Date(p.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/proposals/${p.id}`} className="text-xs text-brand-600 hover:underline">Detay</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-brand-600" />
          <h2 className="font-semibold text-slate-800">Ödemeler</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Bekleyen</p>
            <p className="text-2xl font-bold text-slate-900">{totalPending.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tahsil Edilen</p>
            <p className="text-2xl font-bold text-green-700">{totalPaid.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Gecikmiş</p>
            <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>{overdueCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Müşteri</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teklif</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vade</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Wallet size={32} />
                      <p className="text-sm">Henüz ödeme kaydı yok.</p>
                    </div>
                  </td>
                </tr>
              ) : payments.map((p: any) => {
                const isOverdue = p.status === 'pending' && new Date(p.due_date) < today
                const proposal = p.proposal
                const contact = proposal?.lead?.contact
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3"><p className="font-medium text-slate-800">{contact?.full_name || contact?.phone || '—'}</p></td>
                    <td className="px-5 py-3">
                      {proposal && <Link href={`/dashboard/proposals/${proposal.id}`} className="text-sm text-brand-600 hover:underline">{proposal.title}</Link>}
                    </td>
                    <td className="px-5 py-3"><p className="font-semibold text-slate-900">{Number(p.amount).toLocaleString('tr-TR')} {proposal?.currency ?? ''}</p></td>
                    <td className="px-5 py-3">
                      <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                        {new Date(p.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {isOverdue && ' ⚠️'}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.status === 'paid' ? 'Ödendi' : isOverdue ? 'Gecikmiş' : 'Bekliyor'}
                      </span>
                      {p.paid_at && <p className="text-xs text-slate-400 mt-0.5">{new Date(p.paid_at).toLocaleDateString('tr-TR')}</p>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Followup Tab ─────────────────────────────────────────────────────────────

function StageBar({ row }: { row: any }) {
  const total = (row.pending ?? 0) + (row.sent ?? 0) + (row.done ?? 0) + (row.cancelled ?? 0)
  if (total === 0) return null
  const sentPct   = Math.round((row.sent      / total) * 100)
  const donePct   = Math.round((row.done      / total) * 100)
  const cancelPct = Math.round((row.cancelled / total) * 100)
  const pendingPct = 100 - sentPct - donePct - cancelPct
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-slate-700">{STAGE_LABELS[row.stage] ?? row.stage}</span>
        <span className="text-slate-400">{total} toplam</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
        {donePct    > 0 && <div className="h-full bg-green-400"  style={{ width: `${donePct}%` }} />}
        {sentPct    > 0 && <div className="h-full bg-blue-400"   style={{ width: `${sentPct}%` }} />}
        {pendingPct > 0 && <div className="h-full bg-amber-300"  style={{ width: `${pendingPct}%` }} />}
        {cancelPct  > 0 && <div className="h-full bg-slate-300"  style={{ width: `${cancelPct}%` }} />}
      </div>
      <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
        {row.pending   > 0 && <span className="text-amber-500">⏳ {row.pending} bekliyor</span>}
        {row.sent      > 0 && <span className="text-blue-500">✉ {row.sent} gönderildi</span>}
        {row.done      > 0 && <span className="text-green-500">✓ {row.done} tamamlandı</span>}
        {row.cancelled > 0 && <span>✕ {row.cancelled} iptal</span>}
      </div>
    </div>
  )
}

function FollowupTab({ orgId }: { orgId: string }) {
  const [stats, setStats]     = useState<any>({})
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [channelConfig, setChannelConfig] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [statsRes, upcomingRes, orgRes] = await Promise.all([
        supabase.rpc('get_followup_stats',    { p_org_id: orgId }),
        supabase.rpc('get_upcoming_followups', { p_org_id: orgId, p_limit: 20 }),
        supabase.from('organizations').select('channel_config').eq('id', orgId).single(),
      ])
      setStats(statsRes.data ?? {})
      setUpcoming(upcomingRes.data ?? [])
      setChannelConfig((orgRes.data?.channel_config ?? {}) as any)
      setLoading(false)
    }
    load()
  }, [orgId])

  const chatActive  = channelConfig?.whatsapp?.active === true || channelConfig?.instagram?.active === true
  const voiceActive = channelConfig?.voice_inbound?.active === true || channelConfig?.voice_outbound?.active === true
  const byStage     = stats.by_stage ?? []
  const organicRows  = byStage.filter((r: any) => ORGANIC_STAGES.includes(r.stage))
  const reengageRows = byStage.filter((r: any) => REENGAGEMENT_STAGES.includes(r.stage))
  const recentSent   = stats.recent_sent ?? []

  const tabs = [
    { key: 'manual',   label: 'Manuel Görevler', always: true },
    { key: 'sequence', label: 'Sequence',         always: false, show: chatActive },
    { key: 'calls',    label: 'Aramalar',          always: false, show: voiceActive },
  ].filter(t => t.always || t.show).map(t => ({ key: t.key, label: t.label }))

  const sequencePanel = chatActive ? (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-slate-700">Sequence Hunisi</h2>
          {organicRows.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organik Follow-up</p>
              {organicRows.map((row: any) => <StageBar key={row.stage} row={row} />)}
            </div>
          )}
          {reengageRows.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Re-engagement</p>
              {reengageRows.map((row: any) => <StageBar key={row.stage} row={row} />)}
            </div>
          )}
          {byStage.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Henüz follow-up verisi yok.</p>}
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Son Gönderilen</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {recentSent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Henüz gönderilmiş mesaj yok.</p>
            ) : recentSent.map((item: any) => (
              <div key={item.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700">{item.phone ?? '—'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${REENGAGEMENT_STAGES.includes(item.sequence_stage) ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {STAGE_LABELS[item.sequence_stage] ?? item.sequence_stage}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {item.sent_at ? new Date(item.sent_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
                {item.preview && <p className="text-xs text-slate-500 line-clamp-1">{item.preview}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : null

  if (loading) {
    return <div className="flex items-center gap-2 text-slate-400 py-12 justify-center"><Loader2 size={16} className="animate-spin" /> Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="7 Günde Planlanan"  value={stats.upcoming_7_days ?? 0} icon={CalendarDays} color="blue" />
        <StatCard title="Bugün Gönderilen"   value={stats.sent_today      ?? 0} icon={Send}         color="green" />
        <StatCard title="Gecikmiş"           value={stats.overdue         ?? 0} icon={AlertCircle}  color="red" />
        <StatCard title="Aktif Sequence"
          value={byStage.reduce((s: number, r: any) => s + (r.pending ?? 0), 0)}
          icon={Clock} color="amber"
        />
      </div>
      <FollowupTabs
        tabs={tabs}
        manualPanel={<ManualTasksPanel />}
        sequencePanel={sequencePanel}
        voicePanel={voiceActive ? (
          <div className="text-center py-10">
            <Phone size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-medium text-slate-600">Voice agent aktif olduğunda planlanan aramalar burada görünecek.</p>
          </div>
        ) : null}
      />
    </div>
  )
}

// ─── CRM Page ─────────────────────────────────────────────────────────────────

type CRMTab = 'leads' | 'proposals' | 'followup'

function CRMPageInner() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as CRMTab) ?? 'leads'
  const [activeTab, setActiveTab] = useState<CRMTab>(
    ['leads', 'proposals', 'followup'].includes(initialTab) ? initialTab : 'leads'
  )
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: orgUser } = await supabase
        .from('org_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (orgUser) setOrgId(orgUser.organization_id)
      setLoading(false)
    }
    loadOrg()
  }, [])

  const tabs: { key: CRMTab; label: string }[] = [
    { key: 'leads',     label: 'Leads' },
    { key: 'proposals', label: 'Teklifler & Ödemeler' },
    { key: 'followup',  label: 'Takip' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Target size={22} className="text-brand-600" />
        <h1 className="text-xl font-semibold text-slate-800">CRM</h1>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> Yükleniyor...
        </div>
      ) : !orgId ? (
        <p className="text-slate-400">Organizasyon bulunamadı.</p>
      ) : (
        <>
          {activeTab === 'leads'     && <LeadsTab orgId={orgId} />}
          {activeTab === 'proposals' && <ProposalsPaymentsTab orgId={orgId} />}
          {activeTab === 'followup'  && <FollowupTab orgId={orgId} />}
        </>
      )}
    </div>
  )
}

export default function CRMPage() {
  return (
    <Suspense fallback={null}>
      <CRMPageInner />
    </Suspense>
  )
}
