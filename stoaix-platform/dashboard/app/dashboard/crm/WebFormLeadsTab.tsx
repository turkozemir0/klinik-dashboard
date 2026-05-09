'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Globe, Loader2, Search, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import Avatar from '@/components/Avatar'

type LeadStatus = 'new' | 'in_progress' | 'handed_off' | 'nurturing' | 'qualified' | 'converted' | 'lost'

interface WebFormLead {
  id: string
  status: LeadStatus
  qualification_score: number
  collected_data: Record<string, any>
  created_at: string
  full_name: string | null
  phone: string | null
  email: string | null
  city: string | null
  country: string | null
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

// Standard fields that have dedicated columns — excluded from "extra fields" display
const STANDARD_KEYS = new Set([
  'full_name', 'ad', 'adsoyad', 'ad_soyad', 'name',
  'phone', 'telefon', 'tel',
  'email', 'eposta', 'e-posta',
  'sehir', 'city', 'ulke', 'country',
])

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'az önce'
  if (mins < 60) return `${mins} dk önce`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} saat önce`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} gün önce`
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function ExtraFieldsBadge({ data }: { data: Record<string, any> }) {
  const extras = Object.entries(data).filter(([k]) => !STANDARD_KEYS.has(k.toLowerCase()))
  if (extras.length === 0) return <span className="text-xs text-slate-400">—</span>

  const preview = extras.slice(0, 2).map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`).join(' · ')
  const rest = extras.length - 2

  return (
    <span title={extras.map(([k, v]) => `${k}: ${v}`).join('\n')} className="cursor-help">
      <span className="text-xs text-slate-600">{preview}</span>
      {rest > 0 && (
        <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">
          +{rest} alan
        </span>
      )}
    </span>
  )
}

export default function WebFormLeadsTab() {
  const [leads, setLeads] = useState<WebFormLead[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (q) params.set('q', q)
    const res = await fetch(`/api/leads/web-forms?${params}`)
    if (res.ok) {
      const data = await res.json()
      setLeads(data.leads ?? [])
      setCount(data.count ?? 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => { setPage(0) }, [debouncedSearch])
  useEffect(() => { load(page, debouncedSearch) }, [page, debouncedSearch, load])

  const totalPages = Math.ceil(count / 50)

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm text-slate-500">{count} başvuru</p>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Ad, telefon veya e-posta ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> Yükleniyor...
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Globe size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-500 mb-1">Henüz web formu başvurusu yok</p>
          <p className="text-sm">
            Web sitenize entegre etmek için{' '}
            <Link href="/dashboard/settings?tab=integrations" className="text-brand-600 hover:underline">
              Ayarlar → Form Webhook
            </Link>{' '}
            sayfasını ziyaret edin.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Tarih</th>
                  <th className="text-left px-4 py-3">Ad Soyad</th>
                  <th className="text-left px-4 py-3">Telefon</th>
                  <th className="text-left px-4 py-3">E-posta</th>
                  <th className="text-left px-4 py-3">Şehir / Ülke</th>
                  <th className="text-left px-4 py-3">Ek Alanlar</th>
                  <th className="text-left px-4 py-3">Durum</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {timeAgo(lead.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={lead.full_name || '?'} size={28} />
                        <span className="font-medium text-slate-800 truncate max-w-[140px]">
                          {lead.full_name || <span className="text-slate-400 font-normal">İsimsiz</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.phone
                        ? <span className="font-mono text-sm text-slate-800">{lead.phone}</span>
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[160px] truncate">
                      {lead.email || <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {[lead.city, lead.country].filter(Boolean).join(' / ') || <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <ExtraFieldsBadge data={lead.collected_data} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABEL[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors whitespace-nowrap"
                      >
                        <MessageSquare size={12} /> Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
              {count === 0
                ? '0 kayıt'
                : `${page * 50 + 1}–${Math.min((page + 1) * 50, count)} / ${count} kayıt`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} /> Önceki
                </button>
                <span className="text-sm text-slate-500 px-2">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sonraki <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
