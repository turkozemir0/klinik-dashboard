'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit3, Check, X,
  Lock, CreditCard, Loader2, LayoutGrid,
} from 'lucide-react'
import Link from 'next/link'
import type { Pipeline, PipelineStage } from '@/lib/types'

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#22c55e',
  '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
            value === c ? 'border-slate-800 scale-110' : 'border-transparent'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

function StageRow({
  stage,
  isDefault,
  onUpdate,
  onDelete,
}: {
  stage: PipelineStage
  isDefault: boolean
  onUpdate: (id: string, updates: Partial<PipelineStage>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(stage.name)
  const [color, setColor] = useState(stage.color)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onUpdate(stage.id, { name, color })
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`"${stage.name}" aşamasını silmek istiyor musunuz? Bu aşamadaki leadler ilk aşamaya taşınacak.`)) return
    setDeleting(true)
    await onDelete(stage.id)
    setDeleting(false)
  }

  return (
    <div className="flex items-center gap-3 py-2 px-4">
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
      {editing ? (
        <div className="flex-1 flex flex-col gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
          <ColorPicker value={color} onChange={setColor} />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 text-xs text-white bg-brand-600 hover:bg-brand-700 px-2 py-1 rounded disabled:opacity-50"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              Kaydet
            </button>
            <button
              onClick={() => { setEditing(false); setName(stage.name); setColor(stage.color) }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded"
            >
              <X size={10} /> İptal
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm text-slate-700">{stage.name}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              title="Düzenle"
            >
              <Edit3 size={12} />
            </button>
            {!isDefault && !stage.is_system && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1 text-slate-400 hover:text-red-500 rounded disabled:opacity-50"
                title="Sil"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function NewStageForm({ pipelineId, onCreated }: { pipelineId: string; onCreated: (stage: PipelineStage) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6b7280')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pipelines/${pipelineId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })
      if (res.ok) {
        const data = await res.json()
        onCreated(data.stage)
        setName('')
        setColor('#6b7280')
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 px-4 py-2"
      >
        <Plus size={12} /> Aşama Ekle
      </button>
    )
  }

  return (
    <div className="px-4 py-3 space-y-2 border-t border-slate-50">
      <p className="text-xs font-medium text-slate-600">Yeni Aşama</p>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Aşama adı"
        className="w-full text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="flex items-center gap-1 text-xs text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded disabled:opacity-50"
        >
          {saving ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
          Ekle
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded"
        >
          İptal
        </button>
      </div>
    </div>
  )
}

function PipelineAccordion({
  pipeline,
  onUpdate,
  onDelete,
  onStageUpdate,
  onStageDelete,
  onStageCreate,
}: {
  pipeline: Pipeline
  onUpdate: (id: string, updates: Partial<Pipeline>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onStageUpdate: (pipelineId: string, stageId: string, updates: Partial<PipelineStage>) => Promise<void>
  onStageDelete: (pipelineId: string, stageId: string) => Promise<void>
  onStageCreate: (pipelineId: string, stage: PipelineStage) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(pipeline.name)
  const [color, setColor] = useState(pipeline.color)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSaveName() {
    setSaving(true)
    await onUpdate(pipeline.id, { name, color })
    setSaving(false)
    setEditingName(false)
  }

  async function handleDelete() {
    if (!confirm(`"${pipeline.name}" pipeline'ını silmek istiyor musunuz? Tüm lead atamaları da silinecek.`)) return
    setDeleting(true)
    await onDelete(pipeline.id)
    setDeleting(false)
  }

  const stages = pipeline.stages ?? []

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pipeline.color }} />
        {editingName ? (
          <div className="flex-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              disabled={saving}
              className="text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button
              onClick={() => { setEditingName(false); setName(pipeline.name) }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm font-medium text-slate-800">{pipeline.name}</span>
            {pipeline.is_default && (
              <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                Varsayılan
              </span>
            )}
            <span className="text-xs text-slate-400">{stages.length} aşama</span>
          </>
        )}

        {!editingName && (
          <div className="flex items-center gap-1">
            {!pipeline.is_default && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); setEditingName(true) }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  title="Yeniden adlandır"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete() }}
                  disabled={deleting}
                  className="p-1 text-slate-400 hover:text-red-500 rounded disabled:opacity-50"
                  title="Pipeline'ı sil"
                >
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </>
            )}
            {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-100">
          <div className="divide-y divide-slate-50">
            {stages.map(stage => (
              <div key={stage.id} className="group">
                <StageRow
                  stage={stage}
                  isDefault={pipeline.is_default}
                  onUpdate={(id, updates) => onStageUpdate(pipeline.id, id, updates)}
                  onDelete={(id) => onStageDelete(pipeline.id, id)}
                />
              </div>
            ))}
          </div>
          {!pipeline.is_default && (
            <NewStageForm
              pipelineId={pipeline.id}
              onCreated={(stage) => onStageCreate(pipeline.id, stage)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function NewPipelineModal({ onCreated }: { onCreated: (p: Pipeline) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'usage_limit_exceeded') {
          setError(`Plan limitine ulaştınız (max ${data.limit} pipeline).`)
        } else if (data.error === 'upgrade_required') {
          setError('Bu özellik için plan yükseltme gereklidir.')
        } else {
          setError('Oluşturulamadı. Tekrar deneyin.')
        }
        return
      }
      onCreated(data.pipeline)
      setName('')
      setColor('#6366f1')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
      >
        <Plus size={15} /> Yeni Pipeline
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Yeni Pipeline</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Pipeline adı"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Renk</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => { setOpen(false); setError('') }}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2"
            >
              İptal
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Oluştur
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PipelineSettings() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [entitlement, setEntitlement] = useState<{ enabled: boolean; limit: number | null; used: number } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/pipelines').then(r => r.json()),
      fetch('/api/billing/limits').then(r => r.json()).catch(() => null),
    ]).then(([pipeData, billing]) => {
      setPipelines(pipeData.pipelines ?? [])

      if (billing?.entitlements?.multi_pipeline) {
        const e = billing.entitlements.multi_pipeline
        setEntitlement({
          enabled: e.enabled,
          limit: e.limit ?? null,
          used: pipeData.pipelines?.length ?? 0,
        })
      }
    }).finally(() => setLoading(false))
  }, [])

  async function handleUpdate(id: string, updates: Partial<Pipeline>) {
    const res = await fetch(`/api/pipelines/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const data = await res.json()
      setPipelines(prev => prev.map(p => p.id === id ? { ...p, ...data.pipeline } : p))
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/pipelines/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPipelines(prev => prev.filter(p => p.id !== id))
    }
  }

  async function handleStageUpdate(pipelineId: string, stageId: string, updates: Partial<PipelineStage>) {
    const res = await fetch(`/api/pipelines/${pipelineId}/stages/${stageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const data = await res.json()
      setPipelines(prev => prev.map(p =>
        p.id === pipelineId
          ? { ...p, stages: p.stages?.map(s => s.id === stageId ? { ...s, ...data.stage } : s) }
          : p
      ))
    }
  }

  async function handleStageDelete(pipelineId: string, stageId: string) {
    const res = await fetch(`/api/pipelines/${pipelineId}/stages/${stageId}`, { method: 'DELETE' })
    if (res.ok) {
      setPipelines(prev => prev.map(p =>
        p.id === pipelineId
          ? { ...p, stages: p.stages?.filter(s => s.id !== stageId) }
          : p
      ))
    }
  }

  function handleStageCreate(pipelineId: string, stage: PipelineStage) {
    setPipelines(prev => prev.map(p =>
      p.id === pipelineId ? { ...p, stages: [...(p.stages ?? []), stage] } : p
    ))
  }

  function handlePipelineCreated(pipeline: Pipeline) {
    setPipelines(prev => [...prev, { ...pipeline, stages: [] }])
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-8">
        <Loader2 size={16} className="animate-spin" /> Yükleniyor...
      </div>
    )
  }

  const canCreate = !entitlement || (entitlement.enabled && (entitlement.limit === null || pipelines.length < entitlement.limit))
  const isLite = entitlement && !entitlement.enabled

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid size={16} className="text-brand-600" />
            <h2 className="text-base font-semibold text-slate-800">Pipeline Yönetimi</h2>
          </div>
          {entitlement && entitlement.enabled && entitlement.limit !== null && (
            <p className="text-xs text-slate-500">
              {pipelines.length} / {entitlement.limit} pipeline kullanılıyor
            </p>
          )}
          {entitlement && entitlement.enabled && entitlement.limit === null && (
            <p className="text-xs text-slate-500">Sınırsız pipeline</p>
          )}
        </div>
        {canCreate ? (
          <NewPipelineModal onCreated={handlePipelineCreated} />
        ) : isLite ? (
          <Link
            href="/dashboard/settings?tab=billing"
            className="flex items-center gap-2 text-sm text-slate-500 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Lock size={14} />
            <CreditCard size={14} />
            Plan Yükselt
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 opacity-50 cursor-not-allowed text-sm bg-slate-100 text-slate-400 px-4 py-2 rounded-xl"
            title={`Maksimum ${entitlement?.limit} pipeline limitine ulaştınız`}
          >
            <Plus size={15} /> Yeni Pipeline
          </button>
        )}
      </div>

      {isLite && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Çoklu pipeline özelliği Plus ve üzeri planlarda mevcuttur.{' '}
          <Link href="/dashboard/settings?tab=billing" className="font-medium underline">
            Plan yükselt
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {pipelines.map(pipeline => (
          <PipelineAccordion
            key={pipeline.id}
            pipeline={pipeline}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onStageUpdate={handleStageUpdate}
            onStageDelete={handleStageDelete}
            onStageCreate={handleStageCreate}
          />
        ))}
      </div>
    </div>
  )
}
