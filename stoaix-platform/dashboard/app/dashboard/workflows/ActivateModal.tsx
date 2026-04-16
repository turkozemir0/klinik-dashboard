'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Zap, AlertCircle } from 'lucide-react'
import type { TemplateWithStatus, ConfigField } from '@/lib/workflow-types'

interface Props {
  template: TemplateWithStatus
  onClose: () => void
  onSaved: () => void
}

// Interpolate {{variable}} in a string with config values
function interpolate(text: string, config: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = config[key]
    return val !== undefined && val !== '' ? String(val) : `{{${key}}}`
  })
}

function ConfigFieldInput({
  field,
  value,
  onChange,
  approvedTemplates,
  templatesLoading,
}: {
  field: ConfigField
  value: any
  onChange: (key: string, value: any) => void
  approvedTemplates: { id: string; name: string }[]
  templatesLoading: boolean
}) {
  if (field.type === 'template_picker') {
    if (templatesLoading) {
      return <div className="h-9 w-full rounded-lg bg-slate-100 animate-pulse" />
    }
    if (approvedTemplates.length === 0) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Henüz onaylı WhatsApp template&apos;iniz yok.{' '}
          <a href="/dashboard/templates" className="underline font-medium hover:text-amber-900">
            Templates sayfasından oluşturup Meta&apos;ya gönderin.
          </a>
        </div>
      )
    }
    return (
      <select
        value={String(value ?? '')}
        onChange={e => onChange(field.key, e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">-- Template seçin --</option>
        {approvedTemplates.map(t => (
          <option key={t.id} value={t.name}>{t.name}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'select') {
    return (
      <select
        value={String(value ?? field.default)}
        onChange={e => onChange(field.key, e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {field.options?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value ?? field.default)}
          onChange={e => onChange(field.key, e.target.checked)}
          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-slate-600">{field.description ?? ''}</span>
      </label>
    )
  }

  if (field.type === 'time') {
    return (
      <input
        type="time"
        value={String(value ?? field.default)}
        onChange={e => onChange(field.key, e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    )
  }

  // number or text
  return (
    <div className="flex items-center gap-2">
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={String(value ?? field.default)}
        onChange={e => onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
        min={field.type === 'number' ? 0 : undefined}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        placeholder={field.description}
      />
      {field.unit && (
        <span className="shrink-0 text-xs text-slate-400">{field.unit}</span>
      )}
    </div>
  )
}

export default function ActivateModal({ template, onClose, onSaved }: Props) {
  // Initialize config with existing values or defaults
  const [config, setConfig] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    for (const field of template.config_fields) {
      initial[field.key] = template.config?.[field.key] ?? field.default
    }
    return initial
  })

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const needsTemplate = template.channel === 'whatsapp' || template.channel === 'multi'
  const [approvedTemplates, setApprovedTemplates] = useState<{ id: string; name: string }[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  useEffect(() => {
    if (!needsTemplate) return
    setTemplatesLoading(true)
    fetch('/api/templates')
      .then(r => r.json())
      .then(d => setApprovedTemplates((d.templates ?? []).filter((t: any) => t.status === 'approved')))
      .catch(() => {})
      .finally(() => setTemplatesLoading(false))
  }, [needsTemplate])

  function handleChange(key: string, value: any) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      // If workflow already exists, PATCH; otherwise POST
      const workflowId = template.active_workflow_id
      const res = workflowId
        ? await fetch(`/api/workflows/${workflowId}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ config, is_active: true }),
          })
        : await fetch('/api/workflows', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ template_id: template.id, config, is_active: true }),
          })

      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'upgrade_required') {
          throw new Error(`Bu özellik için plan yükseltmesi gerekli (${data.feature})`)
        }
        throw new Error(data.error ?? 'Kaydedilemedi')
      }
      onSaved()
    } catch (e: any) {
      setError(e.message ?? 'Bilinmeyen hata')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-lg">
              <Zap size={16} className="text-brand-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">{template.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{template.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* WhatsApp template notice */}
        {needsTemplate && approvedTemplates.length > 0 && (
          <div className="mx-6 mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertCircle size={15} className="shrink-0 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-800">
              Bu workflow Meta&apos;da onaylı bir template gerektirir. Aşağıdan seçin.
            </p>
          </div>
        )}

        {/* Config fields */}
        <div className="px-6 py-4 space-y-4">
          {template.config_fields.length > 0 ? (
            template.config_fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  {field.label}
                </label>
                <ConfigFieldInput
                  field={field}
                  value={config[field.key]}
                  onChange={handleChange}
                  approvedTemplates={approvedTemplates}
                  templatesLoading={templatesLoading}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Bu workflow için ek konfigürasyon gerekmez.</p>
          )}
        </div>

        {/* Steps summary */}
        {template.steps_summary.length > 0 && (
          <div className="px-6 pb-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Akış Özeti</p>
            <ul className="space-y-1">
              {template.steps_summary.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[10px] font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  {interpolate(step, config)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-6 pb-2">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm hover:bg-slate-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || template.config_fields.filter(f => f.type === 'template_picker').some(f => !config[f.key])}
            className="flex-1 bg-brand-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {template.active_workflow_id ? 'Kaydet' : 'Aktif Et'}
          </button>
        </div>
      </div>
    </div>
  )
}
