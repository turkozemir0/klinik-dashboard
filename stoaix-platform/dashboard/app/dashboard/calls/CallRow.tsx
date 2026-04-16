'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useT } from '@/lib/lang-context'
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
    lead?: {
      ai_summary: string | null
      collected_data: Record<string, any> | null
      qualification_score: number | null
    } | null
  }
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  missed: 'bg-red-100 text-red-700',
  dropped: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-blue-100 text-blue-700',
}

function scoreColor(score: number) {
  if (score >= 70) return 'bg-green-100 text-green-700'
  if (score >= 40) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

export default function CallRow({ call }: Props) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const lead = call.lead
  const hasDetail = call.transcript || lead?.ai_summary || lead?.collected_data

  const collectedEntries = lead?.collected_data
    ? Object.entries(lead.collected_data).filter(([, v]) => v)
    : []

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
        <td className="px-5 py-3">
          {lead?.qualification_score != null ? (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scoreColor(lead.qualification_score)}`}>
              {lead.qualification_score}/100
            </span>
          ) : <span className="text-slate-300 text-xs">—</span>}
        </td>
        <td className="px-5 py-3 text-slate-400 text-xs">
          {new Date(call.started_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-5 py-3">
          {hasDetail && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-5 pb-4 pt-1">
            <div className="space-y-3">
              {/* AI Özeti */}
              {lead?.ai_summary && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">AI Özeti</p>
                  <p className="text-xs text-slate-700">{lead.ai_summary}</p>
                </div>
              )}

              {/* Toplanan Bilgiler */}
              {collectedEntries.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Toplanan Bilgiler</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {collectedEntries.map(([key, value]) => (
                      <div key={key} className="flex gap-1.5 text-xs">
                        <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-slate-700 font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transkript */}
              {call.transcript && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Transkript</p>
                  <div className="text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {call.transcript}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
