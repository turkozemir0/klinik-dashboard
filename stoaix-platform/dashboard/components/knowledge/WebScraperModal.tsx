'use client'

import { useState } from 'react'
import { X, Globe, Loader2, Check, Pencil, ChevronDown, ChevronUp, Plus } from 'lucide-react'

interface SuggestedItem {
  title: string
  description_for_ai: string
  item_type: string
}

interface EditState {
  title: string
  description_for_ai: string
  item_type: string
}

const TYPE_LABELS: Record<string, string> = {
  service: 'Hizmet',
  faq: 'SSS',
  pricing: 'Fiyat',
  team_member: 'Ekip',
  policy: 'Politika',
  general: 'Genel',
}

const TYPE_COLORS: Record<string, string> = {
  service: 'bg-purple-100 text-purple-700',
  faq: 'bg-blue-100 text-blue-700',
  pricing: 'bg-emerald-100 text-emerald-700',
  team_member: 'bg-pink-100 text-pink-700',
  policy: 'bg-red-100 text-red-700',
  general: 'bg-slate-100 text-slate-600',
}

interface Props {
  orgId: string
  onClose: () => void
  onSaved: (items: any[]) => void
}

export default function WebScraperModal({ orgId, onClose, onSaved }: Props) {
  const [url, setUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([])
  const [sourceUrl, setSourceUrl] = useState('')

  // Per-item state
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<EditState | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  // Saving
  const [saving, setSaving] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [saveError, setSaveError] = useState('')

  async function handleScrape() {
    const trimmed = url.trim()
    if (!trimmed) return
    setScraping(true)
    setScrapeError('')
    setSuggestions([])
    setSelected(new Set())
    setEditing(null)

    try {
      const res = await fetch('/api/knowledge/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, organization_id: orgId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setScrapeError(data.error ?? 'Tarama başarısız')
        return
      }
      setSuggestions(data.suggestions)
      setSourceUrl(data.source_url)
      // Select all by default
      setSelected(new Set(data.suggestions.map((_: any, i: number) => i)))
    } catch {
      setScrapeError('Bağlantı hatası')
    } finally {
      setScraping(false)
    }
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  function toggleExpand(i: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  function startEdit(i: number) {
    setEditing(i)
    setEditDraft({ ...suggestions[i] })
  }

  function saveEdit(i: number) {
    if (!editDraft) return
    setSuggestions(prev => {
      const next = [...prev]
      next[i] = editDraft
      return next
    })
    setEditing(null)
    setEditDraft(null)
  }

  function cancelEdit() {
    setEditing(null)
    setEditDraft(null)
  }

  async function handleSaveSelected() {
    if (selected.size === 0) return
    setSaving(true)
    setSaveError('')
    const selectedArr = Array.from(selected)
    const toSave = selectedArr.map(i => suggestions[i])
    const results: any[] = []
    const newSavedIds = new Set(savedIds)

    for (let idx = 0; idx < toSave.length; idx++) {
      const item = toSave[idx]
      const originalIdx = selectedArr[idx]
      try {
        const res = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: orgId,
            title: item.title,
            description_for_ai: item.description_for_ai,
            item_type: item.item_type,
            tags: [],
          }),
        })
        const data = await res.json()
        if (res.ok) {
          results.push(data)
          newSavedIds.add(originalIdx)
        }
      } catch {
        // continue saving others
      }
    }

    setSavedIds(newSavedIds)
    setSaving(false)

    if (results.length === 0) {
      setSaveError('Hiçbiri kaydedilemedi')
      return
    }

    if (results.length < toSave.length) {
      setSaveError(`${results.length}/${toSave.length} kayıt eklendi`)
    }

    onSaved(results)

    // Remove saved items from selection
    setSelected(prev => {
      const next = new Set(prev)
      newSavedIds.forEach(i => next.delete(i))
      return next
    })
  }

  const allSaved = suggestions.length > 0 && suggestions.every((_, i) => savedIds.has(i))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-brand-500" />
            <h2 className="text-base font-semibold text-slate-800">Web'den İçe Aktar</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* URL Input */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !scraping && handleScrape()}
              placeholder="https://siteniz.com"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              disabled={scraping}
            />

            <button
              onClick={handleScrape}
              disabled={scraping || !url.trim()}
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {scraping ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
              {scraping ? 'Taranıyor...' : 'Tara'}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Örnek: <span className="font-medium">https://klinigim.com</span> — https:// ile başlamalı, ana sayfa veya hizmetler sayfası önerilir
          </p>
          {scrapeError && (
            <p className="mt-2 text-sm text-red-500">{scrapeError}</p>
          )}
          {sourceUrl && !scraping && (
            <p className="mt-1.5 text-xs text-slate-400">
              Kaynak: <span className="font-medium">{sourceUrl}</span> — {suggestions.length} madde bulundu
            </p>
          )}
        </div>

        {/* Results */}
        {suggestions.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
              {suggestions.map((item, i) => {
                const isSaved = savedIds.has(i)
                const isEditing = editing === i
                const isExpanded = expanded.has(i)

                return (
                  <div
                    key={i}
                    className={`rounded-xl border transition-colors ${
                      isSaved
                        ? 'border-emerald-200 bg-emerald-50'
                        : selected.has(i)
                        ? 'border-brand-200 bg-brand-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {isEditing && editDraft ? (
                      /* Edit mode */
                      <div className="p-3 space-y-2">
                        <input
                          value={editDraft.title}
                          onChange={e => setEditDraft({ ...editDraft, title: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="Başlık"
                        />
                        <textarea
                          value={editDraft.description_for_ai}
                          onChange={e => setEditDraft({ ...editDraft, description_for_ai: e.target.value })}
                          rows={4}
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                          placeholder="AI açıklaması"
                        />
                        <div className="flex items-center justify-between">
                          <select
                            value={editDraft.item_type}
                            onChange={e => setEditDraft({ ...editDraft, item_type: e.target.value })}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            {Object.entries(TYPE_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={cancelEdit}
                              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded-lg border border-slate-200"
                            >
                              İptal
                            </button>
                            <button
                              onClick={() => saveEdit(i)}
                              className="text-xs text-white bg-brand-500 hover:bg-brand-600 px-3 py-1 rounded-lg"
                            >
                              Kaydet
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <div className="p-3">
                        <div className="flex items-start gap-2.5">
                          {/* Checkbox */}
                          {!isSaved ? (
                            <button
                              onClick={() => toggleSelect(i)}
                              className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                                selected.has(i)
                                  ? 'bg-brand-500 border-brand-500'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {selected.has(i) && <Check size={10} className="text-white" />}
                            </button>
                          ) : (
                            <div className="mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center bg-emerald-500">
                              <Check size={10} className="text-white" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[item.item_type] || TYPE_COLORS.general}`}>
                                {TYPE_LABELS[item.item_type] || item.item_type}
                              </span>
                              <span className="text-sm font-medium text-slate-800 truncate">{item.title}</span>
                              {isSaved && <span className="text-xs text-emerald-600 font-medium">Eklendi</span>}
                            </div>

                            {/* Description preview / expand */}
                            <p className={`mt-1 text-xs text-slate-500 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {item.description_for_ai}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!isSaved && (
                              <button
                                onClick={() => startEdit(i)}
                                className="text-slate-400 hover:text-brand-500 p-1"
                                title="Düzenle"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => toggleExpand(i)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title={isExpanded ? 'Daralt' : 'Genişlet'}
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  {selected.size} seçili
                </span>
                {saveError && <span className="text-sm text-amber-600">{saveError}</span>}
              </div>

              <div className="flex gap-2">
                {!allSaved && (
                  <button
                    onClick={() => {
                      const unSaved = suggestions
                        .map((_, i) => i)
                        .filter(i => !savedIds.has(i))
                      setSelected(new Set(unSaved))
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
                  >
                    Tümünü Seç
                  </button>
                )}
                <button
                  onClick={handleSaveSelected}
                  disabled={saving || selected.size === 0 || allSaved}
                  className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {saving ? 'Ekleniyor...' : `${selected.size} Madde Ekle`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Empty state while not scraped yet */}
        {suggestions.length === 0 && !scraping && !scrapeError && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Globe size={32} className="opacity-30" />
            <p className="text-sm">Web sitenizin URL'ini girin ve "Tara" butonuna tıklayın</p>
          </div>
        )}

        {/* Loading skeleton */}
        {scraping && (
          <div className="flex-1 px-6 py-4 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Loader2 size={15} className="animate-spin text-brand-500" />
              <p className="text-sm text-slate-500">Websitenizden bilgiler toplanıyor, lütfen bekleyin...</p>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-3 animate-pulse">
                <div className="flex gap-2 items-center mb-2">
                  <div className="w-12 h-4 bg-slate-200 rounded-full" />
                  <div className="w-48 h-4 bg-slate-200 rounded" />
                </div>
                <div className="w-full h-3 bg-slate-100 rounded mb-1" />
                <div className="w-3/4 h-3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
