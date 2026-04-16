'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle, XCircle, Clock, Phone, AlertCircle } from 'lucide-react'
import type { WorkflowRun } from '@/lib/workflow-types'

const STATUS_CONFIG: Record<WorkflowRun['status'], { label: string; icon: React.FC<any>; color: string }> = {
  pending:   { label: 'Bekliyor',    icon: Clock,         color: 'text-slate-500' },
  running:   { label: 'Çalışıyor',  icon: Loader2,       color: 'text-blue-500' },
  success:   { label: 'Başarılı',   icon: CheckCircle,   color: 'text-emerald-500' },
  failed:    { label: 'Başarısız',  icon: XCircle,       color: 'text-red-500' },
  no_answer: { label: 'Cevap Yok', icon: Phone,          color: 'text-amber-500' },
  cancelled: { label: 'İptal',      icon: AlertCircle,   color: 'text-slate-400' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

interface Props {
  workflowId: string
  workflowName: string
  onClose: () => void
}

export default function RunHistoryDrawer({ workflowId, workflowName, onClose }: Props) {
  const [runs, setRuns]     = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/workflows/${workflowId}/runs`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setRuns(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workflowId])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Çalışma Geçmişi</h3>
            <p className="text-xs text-slate-400">{workflowName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : runs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Henüz çalışma geçmişi yok.
            </p>
          ) : (
            <div className="space-y-2">
              {runs.map(run => {
                const statusConf = STATUS_CONFIG[run.status]
                const StatusIcon = statusConf.icon
                return (
                  <div key={run.id} className="bg-slate-50 rounded-xl p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          size={14}
                          className={`shrink-0 ${statusConf.color} ${run.status === 'running' ? 'animate-spin' : ''}`}
                        />
                        <div>
                          <p className="text-xs font-medium text-slate-700">
                            {run.contact_phone || 'Bilinmeyen numara'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatDate(run.created_at)} · {statusConf.label}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 capitalize">
                        {run.trigger_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Result details */}
                    {run.result && Object.keys(run.result).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-3">
                        {run.result.call_duration_seconds !== undefined && (
                          <span className="text-xs text-slate-500">
                            Süre: {Math.round(run.result.call_duration_seconds / 60)}dk
                          </span>
                        )}
                        {run.result.score !== undefined && (
                          <span className="text-xs text-slate-500">
                            Puan: {run.result.score}/5
                          </span>
                        )}
                        {run.result.next_action && (
                          <span className="text-xs text-slate-500 capitalize">
                            Sonraki: {run.result.next_action}
                          </span>
                        )}
                        {run.result.notes && (
                          <span className="text-xs text-slate-500 truncate max-w-full">
                            {run.result.notes}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
