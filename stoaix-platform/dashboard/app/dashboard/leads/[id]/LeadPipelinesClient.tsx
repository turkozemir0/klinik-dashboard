'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutGrid, Plus, Trash2, Loader2, ChevronDown } from 'lucide-react'
import type { Pipeline, PipelineStage } from '@/lib/types'

interface PipelineAssignment {
  pipeline_id: string
  stage_id: string
}

export default function LeadPipelinesClient({ leadId }: { leadId: string }) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [assignments, setAssignments] = useState<PipelineAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [pipeRes, sb] = [
        fetch('/api/pipelines').then(r => r.json()),
        createClient(),
      ]
      const [pipeData, { data: asgn }] = await Promise.all([
        pipeRes,
        sb
          .from('lead_pipeline_stages')
          .select('pipeline_id, stage_id')
          .eq('lead_id', leadId),
      ])
      setPipelines(pipeData.pipelines ?? [])
      setAssignments(asgn ?? [])
      setLoading(false)
    }
    load()
  }, [leadId])

  // Only custom (non-default) pipelines
  const customPipelines = pipelines.filter(p => !p.is_default)

  function getAssignment(pipelineId: string) {
    return assignments.find(a => a.pipeline_id === pipelineId)
  }

  async function handleAssign(pipelineId: string, stageId: string) {
    setSaving(pipelineId)
    const res = await fetch(`/api/pipelines/${pipelineId}/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId }),
    })
    if (res.ok) {
      setAssignments(prev => {
        const filtered = prev.filter(a => a.pipeline_id !== pipelineId)
        return [...filtered, { pipeline_id: pipelineId, stage_id: stageId }]
      })
    }
    setSaving(null)
  }

  async function handleRemove(pipelineId: string) {
    setRemoving(pipelineId)
    const res = await fetch(`/api/pipelines/${pipelineId}/leads/${leadId}`, { method: 'DELETE' })
    if (res.ok) {
      setAssignments(prev => prev.filter(a => a.pipeline_id !== pipelineId))
    }
    setRemoving(null)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 size={14} className="animate-spin" /> Yükleniyor...
        </div>
      </div>
    )
  }

  if (customPipelines.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
        <LayoutGrid size={15} className="text-brand-600" />
        <h2 className="text-sm font-semibold text-slate-700">Pipeline Atamaları</h2>
      </div>

      <div className="divide-y divide-slate-50">
        {customPipelines.map(pipeline => {
          const stages = (pipeline.stages ?? []).slice().sort((a, b) => a.position - b.position)
          const assignment = getAssignment(pipeline.id)
          const currentStageId = assignment?.stage_id ?? ''
          const isSaving = saving === pipeline.id
          const isRemoving = removing === pipeline.id

          return (
            <div key={pipeline.id} className="flex items-center gap-3 px-5 py-3">
              {/* Pipeline color + name */}
              <div className="flex items-center gap-2 w-36 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pipeline.color }} />
                <span className="text-sm font-medium text-slate-700 truncate">{pipeline.name}</span>
              </div>

              {/* Stage selector or "Ekle" */}
              {assignment ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <select
                      value={currentStageId}
                      onChange={e => handleAssign(pipeline.id, e.target.value)}
                      disabled={isSaving}
                      className="w-full appearance-none text-sm border border-slate-200 rounded-lg px-3 py-1.5 pr-7 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
                    >
                      {stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {isSaving && <Loader2 size={14} className="animate-spin text-brand-500 shrink-0" />}
                  <button
                    onClick={() => handleRemove(pipeline.id)}
                    disabled={isRemoving}
                    title="Bu pipeline'dan kaldır"
                    className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    defaultValue=""
                    onChange={e => { if (e.target.value) handleAssign(pipeline.id, e.target.value) }}
                    disabled={isSaving}
                    className="flex-1 appearance-none text-sm border border-dashed border-slate-300 rounded-lg px-3 py-1.5 text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
                  >
                    <option value="" disabled>Aşama seç...</option>
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {isSaving && <Loader2 size={14} className="animate-spin text-brand-500 shrink-0" />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
