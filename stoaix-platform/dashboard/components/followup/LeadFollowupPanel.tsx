'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Pause, Play, MessageSquare, Phone, Send, ChevronDown, ChevronUp } from 'lucide-react'

interface FollowUpTask {
  id: string
  task_type: string
  sequence_stage: string | null
  status: string
  scheduled_at: string
  sent_at: string | null
  channel: string
  is_paused: boolean
  variables: Record<string, any>
}

const STAGE_LABELS: Record<string, string> = {
  first_reminder:     'İlk Hatırlatma',
  warm_day4:          'Gün 4 (Warm)',
  warm_day11:         'Gün 11 (Warm)',
  warm_to_cold:       'Soğuyor (G14)',
  cold_month1:        '1. Ay (Cold)',
  cold_month2:        '2. Ay (Cold)',
  cold_final:         'Son Deneme',
  handoff_check_4h:   'Handoff +4s',
  handoff_check_24h:  'Handoff +24s',
  re_contact_1:       'İlk Temas',
  re_contact_2:       '2. Temas',
  re_contact_3:       'Son Temas',
}

const CHANNEL_ICON: Record<string, any> = {
  whatsapp: MessageSquare,
  voice:    Phone,
  instagram: MessageSquare,
  manual:   Send,
}

function formatScheduled(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const overdue = d < now
  const label = d.toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  return { label, overdue }
}

interface Props {
  leadId: string
}

export default function LeadFollowupPanel({ leadId }: Props) {
  const [tasks, setTasks]           = useState<FollowUpTask[]>([])
  const [loading, setLoading]       = useState(true)
  const [showSent, setShowSent]     = useState(false)
  const [pauseLoading, setPauseLoading] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('follow_up_tasks')
      .select('id,task_type,sequence_stage,status,scheduled_at,sent_at,channel,is_paused,variables')
      .eq('lead_id', leadId)
      .order('scheduled_at', { ascending: true })
    setTasks((data as FollowUpTask[]) ?? [])
    setLoading(false)
  }, [leadId])

  useEffect(() => { load() }, [load])

  async function togglePause(task: FollowUpTask) {
    setPauseLoading(task.id)
    const newPaused = !task.is_paused
    const res = await fetch(`/api/followup/pause/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_paused: newPaused }),
    })
    if (res.ok) {
      setTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, is_paused: newPaused } : t)
      )
    }
    setPauseLoading(null)
  }

  const pending = tasks.filter(t => t.status === 'pending')
  const sent    = tasks.filter(t => t.status === 'sent' || t.status === 'done')

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="h-4 bg-slate-100 rounded animate-pulse w-32 mb-3" />
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Otomatik Takip Görevleri</h2>
        <p className="text-sm text-slate-400">Bu lead için planlanmış takip görevi yok.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          Otomatik Takip Görevleri
          {pending.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
              {pending.length}
            </span>
          )}
        </h2>
      </div>

      <div className="divide-y divide-slate-50">
        {/* Pending tasks */}
        {pending.map(task => {
          const { label, overdue } = formatScheduled(task.scheduled_at)
          const Icon = CHANNEL_ICON[task.channel] ?? Send
          const isPausing = pauseLoading === task.id
          return (
            <div
              key={task.id}
              className={`px-5 py-3 flex items-center gap-3 ${task.is_paused ? 'bg-amber-50/50' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                task.is_paused ? 'bg-amber-100' : 'bg-blue-50'
              }`}>
                <Icon size={13} className={task.is_paused ? 'text-amber-600' : 'text-blue-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {STAGE_LABELS[task.sequence_stage ?? ''] ?? task.task_type}
                  {task.is_paused && (
                    <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      Duraklatıldı
                    </span>
                  )}
                </p>
                <p className={`text-xs flex items-center gap-1 mt-0.5 ${
                  overdue && !task.is_paused ? 'text-red-500' : 'text-slate-400'
                }`}>
                  <Clock size={10} />
                  {label}
                  {overdue && !task.is_paused && ' • Gecikmiş'}
                </p>
              </div>
              <button
                onClick={() => togglePause(task)}
                disabled={isPausing}
                title={task.is_paused ? 'Takibi Devam Ettir' : 'Takibi Durdur'}
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                  task.is_paused
                    ? 'text-emerald-600 hover:bg-emerald-50'
                    : 'text-amber-600 hover:bg-amber-50'
                }`}
              >
                {task.is_paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </div>
          )
        })}

        {/* Sent / Done section toggle */}
        {sent.length > 0 && (
          <>
            <button
              onClick={() => setShowSent(p => !p)}
              className="w-full px-5 py-2.5 flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {showSent ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {sent.length} gönderilmiş görev
            </button>
            {showSent && sent.map(task => {
              const Icon = CHANNEL_ICON[task.channel] ?? Send
              const sentDate = task.sent_at
                ? new Date(task.sent_at).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })
                : '—'
              return (
                <div key={task.id} className="px-5 py-3 flex items-center gap-3 opacity-60">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100">
                    <Icon size={13} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 truncate">
                      {STAGE_LABELS[task.sequence_stage ?? ''] ?? task.task_type}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{sentDate}</p>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Gönderildi
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
