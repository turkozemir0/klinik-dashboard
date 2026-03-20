'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { t } from '@/lib/i18n'
import { formatDuration } from '@/lib/types'

interface Props {
  call: {
    id: string
    phone_from: string | null
    phone_to: string | null
    direction: string
    duration_seconds: number
    status: string
    started_at: string
    transcript: string | null
  }
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  missed: 'bg-red-100 text-red-700',
  dropped: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-blue-100 text-blue-700',
}

export default function CallRow({ call }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-5 py-3 font-medium text-slate-800">
          {call.direction === 'inbound' ? call.phone_from : call.phone_to || '—'}
        </td>
        <td className="px-5 py-3 text-slate-600">
          {call.direction === 'inbound' ? t.inbound : t.outbound}
        </td>
        <td className="px-5 py-3 text-slate-600">{formatDuration(call.duration_seconds)}</td>
        <td className="px-5 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[call.status] || 'bg-slate-100 text-slate-600'}`}>
            {call.status}
          </span>
        </td>
        <td className="px-5 py-3 text-slate-400 text-xs">
          {new Date(call.started_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-5 py-3">
          {call.transcript && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
          )}
        </td>
      </tr>
      {expanded && call.transcript && (
        <tr>
          <td colSpan={6} className="px-5 pb-4">
            <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto border border-slate-200">
              {call.transcript}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
