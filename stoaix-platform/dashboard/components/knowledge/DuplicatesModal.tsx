'use client'

import { useState } from 'react'
import { X, GitMerge, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react'

interface DuplicatePair {
  a_id: string
  a_title: string
  a_item_type: string
  a_description_for_ai: string
  b_id: string
  b_title: string
  b_item_type: string
  b_description_for_ai: string
  similarity: number
}

interface Props {
  pairs: DuplicatePair[]
  remaining: number
  onClose: () => void
  onDeleted: (id: string) => void
}

const TYPE_LABELS: Record<string, string> = {
  service: 'Hizmet',
  faq: 'SSS',
  pricing: 'Fiyat',
  team_member: 'Ekip',
  policy: 'Politika',
  general: 'Genel',
  treatment: 'Tedavi',
  program: 'Program',
  country: 'Ülke',
}

const TYPE_COLORS: Record<string, string> = {
  service: 'bg-purple-100 text-purple-700',
  faq: 'bg-blue-100 text-blue-700',
  pricing: 'bg-emerald-100 text-emerald-700',
  team_member: 'bg-pink-100 text-pink-700',
  policy: 'bg-red-100 text-red-700',
  general: 'bg-slate-100 text-slate-600',
  treatment: 'bg-green-100 text-green-700',
  program: 'bg-green-100 text-green-700',
  country: 'bg-amber-100 text-amber-700',
}

function similarityBadgeColor(sim: number): string {
  if (sim > 0.95) return 'bg-red-100 text-red-700'
  if (sim > 0.85) return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

interface CardProps {
  id: string
  title: string
  item_type: string
  description: string
  deletingId: string | null
  onDelete: (id: string) => void
  expanded: boolean
  onToggleExpand: () => void
}

function KBCard({ id, title, item_type, description, deletingId, onDelete, expanded, onToggleExpand }: CardProps) {
  return (
    <div className="flex-1 border border-slate-200 rounded-xl p-3 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${TYPE_COLORS[item_type] || TYPE_COLORS.general}`}>
          {TYPE_LABELS[item_type] || item_type}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleExpand}
            className="text-slate-400 hover:text-slate-600 p-0.5"
            title={expanded ? 'Daralt' : 'Genişlet'}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={() => onDelete(id)}
            disabled={deletingId === id}
            className="text-slate-400 hover:text-red-500 disabled:opacity-40 p-0.5 transition-colors"
            title="Sil"
          >
            {deletingId === id
              ? <Loader2 size={13} className="animate-spin" />
              : <Trash2 size={13} />
            }
          </button>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-800 mb-1 truncate" title={title}>{title}</p>
      <p className={`text-xs text-slate-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
        {description}
      </p>
    </div>
  )
}

export default function DuplicatesModal({ pairs: initialPairs, remaining, onClose, onDeleted }: Props) {
  const [pairs, setPairs] = useState<DuplicatePair[]>(initialPairs)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  function toggleExpand(key: string) {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  async function handleDelete(id: string, pairIdx: number) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
      setPairs(prev => prev.filter((_, i) => i !== pairIdx))
      onDeleted(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GitMerge size={18} className="text-brand-500" />
            <h2 className="text-base font-semibold text-slate-800">Benzerlik Kontrolü</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {pairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <GitMerge size={36} className="opacity-30" />
              <p className="text-sm font-medium text-slate-500">Harika! Çakışan kayıt bulunamadı.</p>
              <p className="text-xs text-slate-400">%85 ve üzeri benzerlik eşiğinde tüm kayıtlar incelendi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pairs.map((pair, idx) => (
                <div key={`${pair.a_id}-${pair.b_id}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  {/* Similarity badge */}
                  <div className="flex items-center justify-center mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${similarityBadgeColor(pair.similarity)}`}>
                      %{Math.round(pair.similarity * 100)} benzer
                    </span>
                  </div>
                  {/* Side by side cards */}
                  <div className="flex gap-2">
                    <KBCard
                      id={pair.a_id}
                      title={pair.a_title}
                      item_type={pair.a_item_type}
                      description={pair.a_description_for_ai}
                      deletingId={deletingId}
                      onDelete={(id) => handleDelete(id, idx)}
                      expanded={expandedCards.has(`${idx}-a`)}
                      onToggleExpand={() => toggleExpand(`${idx}-a`)}
                    />
                    <KBCard
                      id={pair.b_id}
                      title={pair.b_title}
                      item_type={pair.b_item_type}
                      description={pair.b_description_for_ai}
                      deletingId={deletingId}
                      onDelete={(id) => handleDelete(id, idx)}
                      expanded={expandedCards.has(`${idx}-b`)}
                      onToggleExpand={() => toggleExpand(`${idx}-b`)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>{pairs.length} çift bulundu · Bugün {remaining} hakkın kaldı</span>
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
