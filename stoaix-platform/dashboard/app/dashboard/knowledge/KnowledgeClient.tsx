'use client'

import { useState } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { t } from '@/lib/i18n'
import KBItemModal from '@/components/admin/KBItemModal'
import type { KnowledgeItem } from '@/lib/types'

interface Props {
  items: KnowledgeItem[]
  orgId: string
  sector: string
}

const typeColors: Record<string, string> = {
  faq: 'bg-blue-100 text-blue-700',
  program: 'bg-green-100 text-green-700',
  service: 'bg-purple-100 text-purple-700',
  country: 'bg-amber-100 text-amber-700',
  policy: 'bg-red-100 text-red-700',
  team_member: 'bg-pink-100 text-pink-700',
  pricing: 'bg-emerald-100 text-emerald-700',
  general: 'bg-slate-100 text-slate-600',
  office_location: 'bg-cyan-100 text-cyan-700',
  country_overview: 'bg-amber-100 text-amber-700',
  university_programs: 'bg-violet-100 text-violet-700',
  treatment: 'bg-green-100 text-green-700',
  doctor: 'bg-teal-100 text-teal-700',
  property: 'bg-orange-100 text-orange-700',
  neighborhood: 'bg-yellow-100 text-yellow-700',
  service_package: 'bg-purple-100 text-purple-700',
  case_study: 'bg-pink-100 text-pink-700',
}

function getItemSubtitle(item: KnowledgeItem): string {
  if (item.data?.country && item.data?.university_name) {
    return `${item.data.country} — ${item.data.university_name}`
  }
  if (item.data?.country) return item.data.country as string
  if (item.data?.city) return item.data.city as string
  if (item.data?.question) return (item.data.question as string).slice(0, 80)
  return ''
}

export default function KnowledgeClient({ items: initialItems, orgId, sector }: Props) {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KnowledgeItem | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.item_type.toLowerCase().includes(search.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
    (item.data?.country as string || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.data?.university_name as string || '').toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setEditingItem(undefined)
    setModalOpen(true)
  }

  function openEdit(item: KnowledgeItem) {
    setEditingItem(item)
    setModalOpen(true)
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
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return
    setDeletingId(id)
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">{t.knowledgeTitle}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{items.length} kayıt</span>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Yeni Ekle
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={`${t.search}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.type}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.title}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.tags}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Güncellendi</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">{t.noData}</td></tr>
            ) : filtered.map(item => {
              const subtitle = getItemSubtitle(item)
              return (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${!item.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[item.item_type] || 'bg-slate-100 text-slate-600'}`}>
                      {(t as any)[item.item_type] || item.item_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800 max-w-xs">
                    <p className="truncate">{item.title}</p>
                    {subtitle && <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{tag}</span>
                      ))}
                      {item.tags.length > 3 && <span className="text-xs text-slate-400">+{item.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(item.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-slate-400 hover:text-brand-600 transition-colors"
                        title="Düzenle"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
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

      {modalOpen && (
        <KBItemModal
          orgId={orgId}
          sector={sector}
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
