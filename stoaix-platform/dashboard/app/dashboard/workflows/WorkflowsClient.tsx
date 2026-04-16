'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Phone, MessageSquare, ArrowLeftRight, Zap,
  ToggleLeft, ToggleRight, Settings2, Clock, Lock,
  CreditCard, Loader2, RefreshCw, Play,
} from 'lucide-react'
import Link from 'next/link'
import type { TemplateWithStatus } from '@/lib/workflow-types'
import type { WorkflowCategory } from '@/lib/workflow-types'
import ActivateModal from './ActivateModal'
import RunHistoryDrawer from './RunHistoryDrawer'

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<WorkflowCategory | 'all', string> = {
  all:            'Tümü',
  outbound_voice: 'Sesli Giden',
  chatbot:        'Chatbot',
  sync:           'Senkron (V+C)',
}

const CATEGORY_ICONS: Record<WorkflowCategory, React.FC<any>> = {
  outbound_voice: Phone,
  chatbot:        MessageSquare,
  sync:           ArrowLeftRight,
}

// ── WorkflowCard ──────────────────────────────────────────────────────────────

function WorkflowCard({
  template,
  onEdit,
  onToggle,
  onRunHistory,
  onManualRun,
  toggling,
}: {
  template: TemplateWithStatus
  onEdit: (t: TemplateWithStatus) => void
  onToggle: (id: string, current: boolean) => void
  onRunHistory: (id: string, name: string) => void
  onManualRun: (t: TemplateWithStatus) => void
  toggling: string | null
}) {
  const Icon = CATEGORY_ICONS[template.category] ?? Zap
  const locked = !template.plan_allowed
  const workflowId = template.active_workflow_id

  return (
    <div className={`bg-white rounded-xl border ${locked ? 'border-slate-100' : 'border-slate-200'} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 shrink-0 p-2 rounded-lg ${locked ? 'bg-slate-50' : 'bg-brand-50'}`}>
            <Icon size={16} className={locked ? 'text-slate-300' : 'text-brand-600'} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold text-sm ${locked ? 'text-slate-400' : 'text-slate-800'}`}>
                {template.name}
              </h3>
              {!locked && template.is_active && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${locked ? 'text-slate-300' : 'text-slate-500'}`}>
              {template.description}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {locked ? (
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-1 text-xs text-brand-600 font-medium hover:text-brand-700"
            >
              <Lock size={12} />
              <CreditCard size={12} />
              Yükselt
            </Link>
          ) : workflowId ? (
            <button
              onClick={() => onToggle(workflowId, template.is_active)}
              disabled={toggling === workflowId}
              title={template.is_active ? 'Pasife al' : 'Aktif et'}
              className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              {toggling === workflowId ? (
                <Loader2 size={22} className="animate-spin" />
              ) : template.is_active ? (
                <ToggleRight size={26} className="text-emerald-500" />
              ) : (
                <ToggleLeft size={26} className="text-slate-300" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {!locked && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onEdit(template)}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Settings2 size={12} />
            {workflowId ? 'Düzenle' : 'Kur & Aktif Et'}
          </button>

          {workflowId && (
            <button
              onClick={() => onRunHistory(workflowId, template.name)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Clock size={12} />
              Geçmiş
            </button>
          )}

          {workflowId && template.is_active && (
            <button
              onClick={() => onManualRun(template)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Play size={12} />
              Manuel Çalıştır
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── ManualRunModal ────────────────────────────────────────────────────────────

function ManualRunModal({
  template,
  onClose,
}: {
  template: TemplateWithStatus
  onClose: () => void
}) {
  const [phone, setPhone]     = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  async function run() {
    if (!phone.trim()) { setError('Telefon numarası zorunlu'); return }
    setRunning(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/trigger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: template.active_workflow_id, phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Çalıştırılamadı')
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-1">Manuel Çalıştır</h3>
        <p className="text-sm text-slate-500 mb-4">{template.name}</p>

        {success ? (
          <div className="text-center py-4 text-emerald-600 text-sm font-medium">Tetiklendi!</div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Telefon Numarası <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+905551234567"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm hover:bg-slate-50"
              >
                İptal
              </button>
              <button
                onClick={run}
                disabled={running}
                className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Çalıştır
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WorkflowsClient() {
  const [templates, setTemplates]     = useState<TemplateWithStatus[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeCategory, setActiveCategory] = useState<WorkflowCategory | 'all'>('all')
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithStatus | null>(null)
  const [manualRunTemplate, setManualRunTemplate] = useState<TemplateWithStatus | null>(null)
  const [historyWorkflow, setHistoryWorkflow]     = useState<{ id: string; name: string } | null>(null)
  const [toggling, setToggling]       = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workflows/templates')
      if (res.ok) setTemplates(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  async function handleToggle(workflowId: string, current: boolean) {
    setToggling(workflowId)
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_active: !current }),
      })
      await fetchTemplates()
    } finally {
      setToggling(null)
    }
  }

  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  const categories: Array<WorkflowCategory | 'all'> = ['all', 'outbound_voice', 'chatbot', 'sync']

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap size={22} className="text-brand-600" />
          <h1 className="text-xl font-semibold text-slate-800">İş Akışları</h1>
        </div>
        <button
          onClick={fetchTemplates}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Yenile
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-100 p-5 h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Bu kategoride template bulunamadı.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(template => (
            <WorkflowCard
              key={template.id}
              template={template}
              onEdit={setEditingTemplate}
              onToggle={handleToggle}
              onRunHistory={(id, name) => setHistoryWorkflow({ id, name })}
              onManualRun={setManualRunTemplate}
              toggling={toggling}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {editingTemplate && (
        <ActivateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSaved={() => { setEditingTemplate(null); fetchTemplates() }}
        />
      )}

      {manualRunTemplate && (
        <ManualRunModal
          template={manualRunTemplate}
          onClose={() => setManualRunTemplate(null)}
        />
      )}

      {historyWorkflow && (
        <RunHistoryDrawer
          workflowId={historyWorkflow.id}
          workflowName={historyWorkflow.name}
          onClose={() => setHistoryWorkflow(null)}
        />
      )}
    </div>
  )
}
