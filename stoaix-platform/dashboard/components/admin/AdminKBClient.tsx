'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, ChevronLeft, Search } from 'lucide-react'
import Link from 'next/link'
import type { KnowledgeItem } from '@/lib/types'
import { useT } from '@/lib/lang-context'
import KBItemModal from './KBItemModal'

interface Org {
  id: string
  name: string
  slug: string
  sector: string
}

interface Props {
  org: Org
  items: KnowledgeItem[]
}

const typeColors: Record<string, string> = {
  faq: 'bg-blue-100 text-blue-700',
  policy: 'bg-red-100 text-red-700',
  pricing: 'bg-emerald-100 text-emerald-700',
  office_location: 'bg-cyan-100 text-cyan-700',
  general: 'bg-slate-100 text-slate-600',
  country_overview: 'bg-amber-100 text-amber-700',
  university_programs: 'bg-violet-100 text-violet-700',
  treatment: 'bg-green-100 text-green-700',
  doctor: 'bg-teal-100 text-teal-700',
  property: 'bg-orange-100 text-orange-700',
  neighborhood: 'bg-yellow-100 text-yellow-700',
  service_package: 'bg-purple-100 text-purple-700',
  case_study: 'bg-pink-100 text-pink-700',
}

const sectorColors: Record<string, string> = {
  education: 'bg-blue-100 text-blue-700',
  clinic: 'bg-green-100 text-green-700',
  real_estate: 'bg-amber-100 text-amber-700',
  tech_service: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-600',
}

type ModalMode = { mode: 'add' } | { mode: 'edit'; item: KnowledgeItem }

export default function AdminKBClient({ org, items: initialItems }: Props) {
  const t = useT()
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modal, setModal] = useState<ModalMode | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Unique types in this org's KB
  const existingTypes = Array.from(new Set(items.map(i => i.item_type))).sort()

  const filtered = items.filter(item => {
    const matchesType = !typeFilter || item.item_type === typeFilter
    const q = search.toLowerCase()
    const matchesSearch = !q || item.title.toLowerCase().includes(q) ||
      (item.data?.country as string || '').toLowerCase().includes(q) ||
      (item.data?.university_name as string || '').toLowerCase().includes(q) ||
      item.tags.some(tag => tag.toLowerCase().includes(q))
    return matchesType && matchesSearch
  })

  async function toggleActive(item: KnowledgeItem) {
    setTogglingId(item.id)
    try {
      const res = await fetch(`/api/knowledge/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      })
      if (res.ok) {
        const updated = await res.json()
        setItems(prev => prev.map(i => i.id === updated.id ? { ...i, is_active: updated.is_active } : i))
      }
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(item: KnowledgeItem) {
    if (!confirm(`"${item.title}" silinsin mi?`)) return
    setDeletingId(item.id)
    try {
      const res = await fetch(`/api/knowledge/${item.id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== item.id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  function handleSaved(saved: KnowledgeItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setModal(null)
  }

  function getItemSubtitle(item: KnowledgeItem): string {
    if (item.data?.country && item.data?.university_name) {
      return `${item.data.country} — ${item.data.university_name}`
    }
    if (item.data?.country) return item.data.country as string
    if (item.data?.city) return item.data.city as string
    return ''
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-slate-400 hover:text-slate-700 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{org.name} — Bilgi Bankası</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sectorColors[org.sector] || 'bg-slate-100 text-slate-600'}`}>
              {org.sector}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{items.length} kayıt</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Yeni Kayıt
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Başlık, ülke, üniversite ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700"
        >
          <option value="">Tüm Türler</option>
          {existingTypes.map(type => (
            <option key={type} value={type}>{(t as any)[type] || type}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tür</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Başlık</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Etiketler</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Güncellendi</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktif</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">{t.noData}</td>
              </tr>
            ) : filtered.map(item => {
              const subtitle = getItemSubtitle(item)
              return (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${!item.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${typeColors[item.item_type] || 'bg-slate-100 text-slate-600'}`}>
                      {(t as any)[item.item_type] || item.item_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-slate-800 truncate">{item.title}</p>
                    {subtitle && <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{tag}</span>
                      ))}
                      {item.tags.length > 3 && <span className="text-xs text-slate-400">+{item.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                    {new Date(item.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(item)}
                      disabled={togglingId === item.id}
                      className={`transition-colors ${item.is_active ? 'text-green-500 hover:text-green-700' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      {item.is_active
                        ? <ToggleRight size={20} />
                        : <ToggleLeft size={20} />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setModal({ mode: 'edit', item })}
                        className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <KBItemModal
          orgId={org.id}
          sector={org.sector}
          item={modal.mode === 'edit' ? modal.item : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
