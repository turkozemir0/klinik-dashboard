'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, LayoutGrid, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { Pipeline } from '@/lib/types'

interface Props {
  pipelines: Pipeline[]
  activePipelineId: string
  onChange: (id: string) => void
}

export default function PipelineSelector({ pipelines, activePipelineId, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = pipelines.find(p => p.id === activePipelineId) ?? pipelines[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (pipelines.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: active?.color ?? '#6366f1' }} />
        <LayoutGrid size={13} className="text-slate-400" />
        <span className="max-w-[120px] truncate">{active?.name ?? 'Pipeline'}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1 overflow-hidden">
          {pipelines.map(p => (
            <button
              key={p.id}
              onClick={() => { onChange(p.id); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                p.id === activePipelineId
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="flex-1 truncate">{p.name}</span>
              {p.is_default && (
                <span className="text-[10px] text-slate-400 shrink-0">Varsayılan</span>
              )}
            </button>
          ))}
          <div className="border-t border-slate-100 mt-1 pt-1">
            <Link
              href="/dashboard/settings?tab=pipelinelar"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
            >
              <ExternalLink size={11} />
              Pipelineları Yönet
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
