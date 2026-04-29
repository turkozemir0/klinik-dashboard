'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Zap, AlertCircle, Info, ExternalLink, Send, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import type { TemplateWithStatus, ConfigField, SequenceStep } from '@/lib/workflow-types'
import { PURPOSE_LABELS, LANGUAGE_LABELS } from '@/lib/template-purpose-config'

interface OrgTemplate {
  id: string
  name: string
  status: string
  purpose: string | null
  components: any[] | null
}

interface PresetTemplate {
  id: string
  name: string
  language: string
  components: any[]
  purpose: string
  sector: string
}

interface Props {
  template: TemplateWithStatus
  orgSector: string
  orgLang: string
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

// Extract body text from components for preview
function getBodyPreview(components: any[]): string {
  const body = components?.find((c: any) => c.type === 'BODY')
  if (!body?.text) return ''
  return body.text.length > 100 ? body.text.slice(0, 100) + '...' : body.text
}

// Count {{1}}, {{2}}, etc. parameters in template body
function getParamCount(components: any[] | null): number {
  const bodyText = components?.find((c: any) => c.type === 'BODY')?.text ?? ''
  return (bodyText.match(/\{\{\d+\}\}/g) || []).length
}

// ─── InlinePresetSuggestions ────────────────────────────────────────────────

function InlinePresetSuggestions({
  purpose,
  orgSector,
  orgLang,
  onUsed,
}: {
  purpose: string
  orgSector: string
  orgLang: string
  onUsed: (templateName: string, paramCount: number) => void
}) {
  const [presets, setPresets] = useState<PresetTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  useEffect(() => {
    setLoading(true)
    // Fetch presets for purpose+sector+language, fallback to general
    Promise.all([
      fetch(`/api/templates/presets?purpose=${purpose}&sector=${orgSector}&language=${orgLang}`).then(r => r.json()),
      orgSector !== 'general'
        ? fetch(`/api/templates/presets?purpose=${purpose}&sector=general&language=${orgLang}`).then(r => r.json())
        : Promise.resolve({ presets: [] }),
    ])
      .then(([sectorData, generalData]) => {
        const all = [...(sectorData.presets ?? []), ...(generalData.presets ?? [])]
        // Deduplicate by id
        const seen = new Set<string>()
        setPresets(all.filter((p: PresetTemplate) => {
          if (seen.has(p.id)) return false
          seen.add(p.id)
          return true
        }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [purpose, orgSector, orgLang])

  async function handleUseAndSubmit(presetId: string) {
    setSubmitting(presetId)
    setError('')
    setWarning('')
    try {
      const res = await fetch(`/api/templates/presets/${presetId}/use-and-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok && !data.template) {
        throw new Error(data.error ?? 'Bir hata oluştu')
      }
      if (data.warning) {
        setWarning(data.warning)
      }
      const pc = getParamCount(data.template.components ?? [])
      onUsed(data.template.name, pc)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return <div className="h-16 w-full rounded-lg bg-slate-50 animate-pulse" />
  }

  if (presets.length === 0) {
    return (
      <div className="text-xs text-slate-500">
        Bu kategori için hazır şablon bulunamadı.{' '}
        <a href="/dashboard/templates" className="underline font-medium hover:text-slate-700">
          Templates sayfasından oluşturun.
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600">Hazır şablonlardan birini seçin:</p>
      {presets.map(preset => (
        <div key={preset.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700">
                {preset.name}
                <span className="ml-1.5 text-[10px] text-slate-400 font-normal">
                  {LANGUAGE_LABELS[preset.language] ?? preset.language.toUpperCase()}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                {getBodyPreview(preset.components)}
              </p>
            </div>
            <button
              onClick={() => handleUseAndSubmit(preset.id)}
              disabled={submitting !== null}
              className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              {submitting === preset.id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Send size={11} />
              )}
              Kullan & Gönder
            </button>
          </div>
        </div>
      ))}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {warning && (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
          <Info size={12} className="shrink-0 text-amber-500 mt-0.5" />
          <p className="text-[11px] text-amber-700">{warning}</p>
        </div>
      )}
      <a href="/dashboard/templates" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ExternalLink size={10} />
        Template sayfasına git
      </a>
    </div>
  )
}

// ─── TemplatePicker (3-state) ───────────────────────────────────────────────

function TemplatePicker({
  field,
  value,
  onChange,
  orgTemplates,
  templatesLoading,
  orgSector,
  orgLang,
  onTemplateCreated,
}: {
  field: ConfigField
  value: any
  onChange: (key: string, value: any) => void
  orgTemplates: OrgTemplate[]
  templatesLoading: boolean
  orgSector: string
  orgLang: string
  onTemplateCreated: () => void
}) {
  const purpose = field.template_purpose
  const [showAll, setShowAll] = useState(false)

  if (templatesLoading) {
    return <div className="h-9 w-full rounded-lg bg-slate-100 animate-pulse" />
  }

  // Filter templates by purpose
  const approvedByPurpose = purpose
    ? orgTemplates.filter(t => t.status === 'approved' && t.purpose === purpose)
    : orgTemplates.filter(t => t.status === 'approved')
  const allApproved = orgTemplates.filter(t => t.status === 'approved')
  const pendingByPurpose = purpose
    ? orgTemplates.filter(t => t.status === 'pending' && t.purpose === purpose)
    : []

  const purposeLabel = purpose ? PURPOSE_LABELS[purpose] ?? purpose : ''

  // ── State A: Approved templates exist for this purpose
  if (approvedByPurpose.length > 0) {
    const displayTemplates = showAll ? allApproved : approvedByPurpose
    return (
      <div className="space-y-1.5">
        <select
          value={String(value ?? '')}
          onChange={e => {
            const name = e.target.value
            onChange(field.key, name)
            const tpl = displayTemplates.find(t => t.name === name)
            onChange('template_param_count', getParamCount(tpl?.components ?? null))
          }}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">-- Template seçin --</option>
          {displayTemplates.map(t => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
        {!showAll && allApproved.length > approvedByPurpose.length && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
          >
            <ChevronDown size={10} />
            Tüm onaylılar ({allApproved.length})
          </button>
        )}
        {showAll && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
          >
            <ChevronUp size={10} />
            Sadece {purposeLabel} ({approvedByPurpose.length})
          </button>
        )}
      </div>
    )
  }

  // ── State B: No approved, but pending exists for this purpose
  if (pendingByPurpose.length > 0) {
    const pendingName = pendingByPurpose[0].name
    // Auto-set the config value to pending template name + param count
    if (!value) {
      const pc = getParamCount(pendingByPurpose[0].components)
      setTimeout(() => {
        onChange(field.key, pendingName)
        onChange('template_param_count', pc)
      }, 0)
    }
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex gap-2">
          <Info size={13} className="shrink-0 text-blue-500 mt-0.5" />
          <div>
            <p className="text-xs text-blue-800">
              <span className="font-medium">&quot;{pendingName}&quot;</span> Meta onay bekliyor.
            </p>
            <p className="text-[11px] text-blue-600 mt-0.5">
              İş akışını şimdi kaydedebilirsiniz — template onaylanınca otomatik çalışacak.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── State C: Nothing — show preset suggestions
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex gap-2">
          <AlertCircle size={13} className="shrink-0 text-amber-500 mt-0.5" />
          <p className="text-xs text-amber-800">
            Bu iş akışı için{purposeLabel ? ` "${purposeLabel}"` : ''} template&apos;i gerekli.
          </p>
        </div>
      </div>
      {purpose && (
        <InlinePresetSuggestions
          purpose={purpose}
          orgSector={orgSector}
          orgLang={orgLang}
          onUsed={(templateName, paramCount) => {
            onChange(field.key, templateName)
            onChange('template_param_count', paramCount)
            onTemplateCreated()
          }}
        />
      )}
      {!purpose && (
        <div className="text-xs text-slate-500">
          <a href="/dashboard/templates" className="underline font-medium hover:text-slate-700">
            Templates sayfasından oluşturup Meta&apos;ya gönderin.
          </a>
        </div>
      )}
    </div>
  )
}

// ─── ConfigFieldInput ───────────────────────────────────────────────────────

function ConfigFieldInput({
  field,
  value,
  onChange,
  orgTemplates,
  templatesLoading,
  orgSector,
  orgLang,
  onTemplateCreated,
}: {
  field: ConfigField
  value: any
  onChange: (key: string, value: any) => void
  orgTemplates: OrgTemplate[]
  templatesLoading: boolean
  orgSector: string
  orgLang: string
  onTemplateCreated: () => void
}) {
  if (field.type === 'template_picker') {
    return (
      <TemplatePicker
        field={field}
        value={value}
        onChange={onChange}
        orgTemplates={orgTemplates}
        templatesLoading={templatesLoading}
        orgSector={orgSector}
        orgLang={orgLang}
        onTemplateCreated={onTemplateCreated}
      />
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

// ─── SequenceEditor ─────────────────────────────────────────────────────────

function SequenceEditor({
  steps,
  onChange,
  orgTemplates,
  templatesLoading,
  maxSteps = 5,
}: {
  steps: SequenceStep[]
  onChange: (steps: SequenceStep[]) => void
  orgTemplates: OrgTemplate[]
  templatesLoading: boolean
  maxSteps?: number
}) {
  const approvedTemplates = orgTemplates.filter(t => t.status === 'approved')
  // Show reengagement purpose first, then the rest
  const sortedTemplates = [
    ...approvedTemplates.filter(t => t.purpose === 'reengagement'),
    ...approvedTemplates.filter(t => t.purpose !== 'reengagement'),
  ]

  function updateStep(index: number, patch: Partial<SequenceStep>) {
    const next = steps.map((s, i) => i === index ? { ...s, ...patch } : s)
    onChange(next)
  }

  function removeStep(index: number) {
    const next = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, step: i + 1 }))
    onChange(next)
  }

  function addStep() {
    const lastDelay = steps.length > 0 ? steps[steps.length - 1].delay_days : 0
    const newDelay = lastDelay > 0 ? lastDelay * 2 : 7
    onChange([...steps, { step: steps.length + 1, template: '', param_count: 1, delay_days: newDelay }])
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-600">Mesaj Sırası</label>

      {steps.map((step, i) => (
        <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
          {/* Step header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-bold">
                {step.step}
              </span>
              {i === 0 ? (
                <span className="text-xs text-slate-500">Hemen gönderilir</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    value={step.delay_days}
                    onChange={e => updateStep(i, { delay_days: Math.max(1, Number(e.target.value)) })}
                    className="w-14 border border-slate-200 rounded-md px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-xs text-slate-500">gün sonra</span>
                </div>
              )}
            </div>
            {i > 0 && (
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Adımı sil"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* Template dropdown */}
          {templatesLoading ? (
            <div className="h-8 w-full rounded-md bg-slate-100 animate-pulse" />
          ) : sortedTemplates.length > 0 ? (
            <select
              value={step.template}
              onChange={e => {
                const name = e.target.value
                const tpl = sortedTemplates.find(t => t.name === name)
                updateStep(i, { template: name, param_count: getParamCount(tpl?.components ?? null) })
              }}
              className="w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Template seçin --</option>
              {sortedTemplates.map(t => (
                <option key={t.id} value={t.name}>
                  {t.name}{t.purpose === 'reengagement' ? ' ★' : ''}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-[11px] text-slate-400">
              Onaylı template yok.{' '}
              <a href="/dashboard/templates" className="underline hover:text-slate-600">Oluşturun</a>
            </p>
          )}

          {/* Warning if no template selected */}
          {!step.template && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
              <AlertCircle size={11} className="shrink-0" />
              Template seçilmezse bu adım atlanır
            </div>
          )}
        </div>
      ))}

      {/* Add step button */}
      {steps.length < maxSteps && (
        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          <Plus size={13} />
          Adım Ekle
        </button>
      )}
    </div>
  )
}

// ─── ActivateModal ──────────────────────────────────────────────────────────

export default function ActivateModal({ template, orgSector, orgLang, onClose, onSaved }: Props) {
  const [config, setConfig] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    for (const field of template.config_fields) {
      initial[field.key] = template.config?.[field.key] ?? field.default
    }
    // Inject default sequence for drip workflows (if template defines one)
    if ((template as any).default_sequence && !template.config?.sequence) {
      initial.sequence = (template as any).default_sequence
    } else if (template.config?.sequence) {
      initial.sequence = template.config.sequence
    }
    return initial
  })

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const needsTemplate = template.channel === 'whatsapp' || template.channel === 'multi'
  const [orgTemplates, setOrgTemplates] = useState<OrgTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  const fetchOrgTemplates = useCallback(() => {
    if (!needsTemplate) return
    setTemplatesLoading(true)
    fetch('/api/templates')
      .then(r => r.json())
      .then(d => setOrgTemplates(
        (d.templates ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          purpose: t.purpose,
          components: t.components ?? null,
        }))
      ))
      .catch(() => {})
      .finally(() => setTemplatesLoading(false))
  }, [needsTemplate])

  useEffect(() => { fetchOrgTemplates() }, [fetchOrgTemplates])

  function handleChange(key: string, value: any) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const hasSequence = Boolean((template as any).default_sequence || config.sequence)

  // Check if save should be enabled
  function canSave(): boolean {
    // Sequence check: at least step 1 must have a template
    if (hasSequence && Array.isArray(config.sequence)) {
      const step1 = config.sequence[0]
      if (!step1?.template) return false
    }

    const templateFields = template.config_fields.filter(f => f.type === 'template_picker')
    for (const field of templateFields) {
      const val = config[field.key]
      if (val) continue // Has a value
      // Check if there's a pending template for this purpose
      const purpose = field.template_purpose
      if (purpose) {
        const hasPending = orgTemplates.some(t => t.status === 'pending' && t.purpose === purpose)
        if (hasPending) continue
      }
      return false // No value and no pending template
    }
    return true
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
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

        {/* Config fields */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
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
                  orgTemplates={orgTemplates}
                  templatesLoading={templatesLoading}
                  orgSector={orgSector}
                  orgLang={orgLang}
                  onTemplateCreated={fetchOrgTemplates}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Bu workflow için ek konfigürasyon gerekmez.</p>
          )}

          {/* Sequence editor for drip workflows */}
          {hasSequence && Array.isArray(config.sequence) && (
            <SequenceEditor
              steps={config.sequence}
              onChange={seq => handleChange('sequence', seq)}
              orgTemplates={orgTemplates}
              templatesLoading={templatesLoading}
            />
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
            disabled={saving || !canSave()}
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
