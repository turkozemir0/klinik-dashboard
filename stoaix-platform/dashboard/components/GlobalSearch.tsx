'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'

interface SearchResult {
  id: string
  name: string | null
  phone: string | null
  score: number
  status: string
  channel: string | null
}

export default function GlobalSearch() {
  const { lang } = useLang()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isTr = lang === 'tr'

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) return
      const json = await res.json()
      setResults(json.results ?? [])
      setOpen(true)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(value.trim()), 300)
  }

  function handleSelect(r: SearchResult) {
    setOpen(false)
    setQuery('')
    setResults([])
    router.push(`/dashboard/conversations/${r.id}`)
  }

  function scoreBadgeClass(score: number) {
    if (score >= 70) return 'bg-red-500 text-white'
    if (score >= 40) return 'bg-amber-400 text-white'
    return 'bg-slate-200 text-slate-600'
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true) }}
        placeholder={isTr ? 'Lead ara (isim, telefon)...' : 'Search leads (name, phone)...'}
        className="w-56 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-brand-400/40 placeholder:text-slate-400"
      />
      {loading && (
        <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {r.name || r.phone || '—'}
                </p>
                {r.name && r.phone && (
                  <p className="text-xs text-slate-400 font-mono">{r.phone}</p>
                )}
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${scoreBadgeClass(r.score)}`}>
                {r.score}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute top-full mt-1.5 left-0 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-4 text-center text-sm text-slate-400">
          {isTr ? 'Sonuç bulunamadı' : 'No results found'}
        </div>
      )}
    </div>
  )
}
