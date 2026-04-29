'use client'

import { Search } from 'lucide-react'
import { type ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  primaryCta?: ReactNode
}

export default function TopBar({ title, subtitle, searchPlaceholder, onSearch, primaryCta }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100 px-6 py-4 -mx-6 -mt-6 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {(onSearch || searchPlaceholder) && (
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder ?? 'Ara...'}
                onChange={onSearch ? (e => onSearch(e.target.value)) : undefined}

                className="w-56 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-brand-400/40 placeholder:text-slate-400"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-mono hidden lg:inline">⌘K</kbd>
            </div>
          )}
          {primaryCta}
        </div>
      </div>
    </div>
  )
}
