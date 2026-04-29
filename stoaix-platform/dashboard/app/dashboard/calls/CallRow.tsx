'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react'
import { useT } from '@/lib/lang-context'
import { formatDuration } from '@/lib/types'
import Sparkline from '@/components/Sparkline'

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

function DirectionIcon({ direction, status }: { direction: string; status: string }) {
  if (status === 'missed') return <PhoneMissed size={14} className="text-red-400" />
  if (direction === 'outbound') return <PhoneOutgoing size={14} className="text-blue-500" />
  return <PhoneIncoming size={14} className="text-green-500" />
}

function makeSparkValues(durationSec: number): number[] {
  if (durationSec <= 0) return []
  const points = 8
  const base = durationSec / points
  return Array.from({ length: points }, (_, i) => {
    const phase = Math.sin((i / points) * Math.PI)
    return Math.round(base * (0.3 + 0.7 * phase))
  })
}

export default function CallRow({ call }: Props) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const lead = call.lead
  const hasDetail = call.transcript || lead?.ai_summary || lead?.collected_data

  const collectedEntries = lead?.collected_data
    ? Object.entries(lead.collected_data).filter(([, v]) => v)
    : []

  const sparkValues = makeSparkValues(call.duration_seconds)

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <DirectionIcon direction={call.direction} status={call.status} />
            <span className="font-medium text-slate-800">
              {call.direction === 'inbound' ? call.phone_from : call.phone_to || '—'}
            </span>
          </div>
        </td>
        <td className="px-5 py-3 text-slate-600">
          {call.direction === 'inbound' ? t.inbound : t.outbound}
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">{formatDuration(call.duration_seconds)}</span>
            {sparkValues.length > 0 && <Sparkline values={sparkValues} width={60} height={20} color={call.status === 'completed' ? '#22c55e' : '#94a3b8'} />}
          </div>
        </td>
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
        <td className="px-5 py-3 hidden lg:table-cell">
          {lead?.ai_summary ? (
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{lead.ai_summary}</p>
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
          <td colSpan={8} className="px-5 pb-4 pt-1">
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
