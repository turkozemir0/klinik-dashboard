'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Phone, RefreshCw, StopCircle, Clock,
  Save, RotateCcw, Loader2, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, ExternalLink, Eye, Lock, Plus, Trash2,
  AlertCircle,
} from 'lucide-react'
import type { WorkflowTemplate, ConfigField, SequenceStep } from '@/lib/workflow-types'
import { CONFIG_FIELD_GROUPS } from '@/lib/workflow-templates'
import { validateWorkflowConfig } from '@/lib/workflow-validation'
import type { ValidationIssue } from '@/lib/workflow-validation'
import { useLang } from '@/lib/lang-context'

interface OrgTemplate {
  id: string
  name: string
  status: string
  purpose: string | null
  components: any[] | null
}

function getBodyText(components: any[] | null): string {
  if (!components) return ''
  const body = components.find((c: any) => c.type === 'BODY')
  return body?.text ?? ''
}

// ── i18n ──────────────────────────────────────────────────────────────────────

const L = {
  back:        { tr: 'Geri', en: 'Back' },
  settings:    { tr: 'Ayarları', en: 'Settings' },
  resetBtn:    { tr: 'Varsayılana Dön', en: 'Reset to Default' },
  cancel:      { tr: 'İptal', en: 'Cancel' },
  save:        { tr: 'Kaydet', en: 'Save' },
  saving:      { tr: 'Kaydediliyor...', en: 'Saving...' },
  saved:       { tr: 'Kaydedildi!', en: 'Saved!' },
  saveFailed:  { tr: 'Kaydedilemedi', en: 'Save failed' },
  flowPreview: { tr: 'Akış Önizleme', en: 'Flow Preview' },
  hasErrors:   { tr: 'Hatalar düzeltilmeden kaydetme yapılamaz', en: 'Fix errors before saving' },
} as const

type LKey = keyof typeof L

const GROUP_ICONS: Record<string, React.FC<any>> = {
  Phone, RefreshCw, StopCircle, Clock,
}

// ── Flow Preview Steps ────────────────────────────────────────────────────────

function buildFlowSteps(config: Record<string, any>, template: WorkflowTemplate) {
  return template.steps_summary.map((step, idx) => {
    const interpolated = step.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = config[key] ?? template.config_fields.find(f => f.key === key)?.default ?? key
      // Select field → option label
      const field = template.config_fields.find(f => f.key === key)
      if (field?.options) {
        const opt = field.options.find(o => String(o.value) === String(val))
        if (opt) return opt.label
      }
      return String(val)
    })
    return { step: idx + 1, label: `Adım ${idx + 1}`, detail: interpolated }
  })
}

// ── FlowPreviewPanel ──────────────────────────────────────────────────────────

function FlowPreviewPanel({ config, template }: { config: Record<string, any>; template: WorkflowTemplate }) {
  const [collapsed, setCollapsed] = useState(false)
  const steps = buildFlowSteps(config, template)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full lg:cursor-default"
      >
        <h3 className="text-sm font-semibold text-slate-700">{L.flowPreview.tr}</h3>
        <span className="lg:hidden text-slate-400">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </span>
      </button>

      {!collapsed && (
        <div className="mt-4 space-y-0">
          {steps.map((s, idx) => (
            <div key={s.step} className="flex items-start gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-xs font-bold text-brand-700">
                  {s.step}
                </div>
                {idx < steps.length - 1 && <div className="w-px h-6 bg-slate-200" />}
              </div>
              {/* Card */}
              <div className="flex-1 bg-slate-50 rounded-lg border border-slate-100 px-3 py-2 mb-2">
                <p className="text-xs font-semibold text-slate-700">{s.label}</p>
                <p className="text-xs text-slate-500">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── SequenceEditor ────────────────────────────────────────────────────────────

function getParamCount(components: any[] | null): number {
  if (!components) return 0
  const body = components.find((c: any) => c.type === 'BODY')
  if (!body?.text) return 0
  const matches = body.text.match(/\{\{(\d+)\}\}/g)
  return matches ? new Set(matches).size : 0
}

function SequenceEditor({
  steps,
  onChange,
  orgTemplates,
  readOnly,
}: {
  steps: SequenceStep[]
  onChange: (steps: SequenceStep[]) => void
  orgTemplates: OrgTemplate[]
  readOnly?: boolean
}) {
  const approvedTemplates = orgTemplates.filter(t => t.status === 'approved')
  const sortedTemplates = [
    ...approvedTemplates.filter(t => t.purpose === 'reengagement'),
    ...approvedTemplates.filter(t => t.purpose !== 'reengagement'),
  ]

  function updateStep(index: number, patch: Partial<SequenceStep>) {
    if (readOnly) return
    const next = steps.map((s, i) => i === index ? { ...s, ...patch } : s)
    onChange(next)
  }

  function removeStep(index: number) {
    if (readOnly) return
    const next = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, step: i + 1 }))
    onChange(next)
  }

  function addStep() {
    if (readOnly) return
    const lastDelay = steps.length > 0 ? steps[steps.length - 1].delay_days : 0
    const newDelay = lastDelay > 0 ? lastDelay * 2 : 7
    onChange([...steps, { step: steps.length + 1, template: '', param_count: 1, delay_days: newDelay }])
  }

  const safeSteps: SequenceStep[] = Array.isArray(steps) ? steps : []

  return (
    <div className="space-y-3">
      {safeSteps.map((step, i) => (
        <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
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
                    disabled={readOnly}
                    className="w-14 border border-slate-200 rounded-md px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <span className="text-xs text-slate-500">gün sonra</span>
                </div>
              )}
            </div>
            {!readOnly && i > 0 && (
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

          {sortedTemplates.length > 0 ? (
            <select
              value={step.template}
              onChange={e => {
                const name = e.target.value
                const tpl = sortedTemplates.find(t => t.name === name)
                updateStep(i, { template: name, param_count: getParamCount(tpl?.components ?? null) })
              }}
              disabled={readOnly}
              className="w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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

          {!step.template && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
              <AlertCircle size={11} className="shrink-0" />
              Template seçilmezse bu adım atlanır
            </div>
          )}
        </div>
      ))}

      {!readOnly && safeSteps.length < 5 && (
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

// ── ConfigGroupPanel ──────────────────────────────────────────────────────────

function ConfigGroupPanel({
  fields,
  config,
  onChange,
  issues,
  lang,
  orgTemplates,
  isSuperAdmin,
  waProvider,
}: {
  fields: ConfigField[]
  config: Record<string, any>
  onChange: (key: string, value: any) => void
  issues: ValidationIssue[]
  lang: 'tr' | 'en'
  orgTemplates: OrgTemplate[]
  isSuperAdmin: boolean
  waProvider?: string
}) {
  // Group fields
  const groups = useMemo(() => {
    const grouped: Record<string, ConfigField[]> = {}
    for (const f of fields) {
      const g = f.group || 'other'
      if (!grouped[g]) grouped[g] = []
      grouped[g].push(f)
    }
    return grouped
  }, [fields])

  return (
    <div className="space-y-4">
      {CONFIG_FIELD_GROUPS.map(group => {
        const groupFields = groups[group.key]
        if (!groupFields?.length) return null

        const IconComp = GROUP_ICONS[group.icon] ?? Clock
        const label = lang === 'tr' ? group.label_tr : group.label_en

        return (
          <div key={group.key} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconComp size={16} className="text-brand-600" />
              <h4 className="text-sm font-semibold text-slate-700">{label}</h4>
            </div>
            <div className="space-y-3">
              {groupFields.map(field => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={config[field.key] ?? field.default}
                  onChange={(v) => onChange(field.key, v)}
                  issues={issues.filter(i => i.field === field.key)}
                  lang={lang}
                  orgTemplates={orgTemplates}
                  readOnly={field.clinic_editable === false && !isSuperAdmin}
                  waProvider={waProvider}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── FieldInput ────────────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  issues,
  lang,
  orgTemplates,
  readOnly,
  waProvider,
}: {
  field: ConfigField
  value: any
  onChange: (v: any) => void
  issues: ValidationIssue[]
  lang: 'tr' | 'en'
  orgTemplates: OrgTemplate[]
  readOnly?: boolean
  waProvider?: string
}) {
  const hasError = issues.some(i => i.severity === 'error')
  const hasWarning = issues.some(i => i.severity === 'warning')
  const borderClass = hasError ? 'border-red-300 focus:ring-red-500' : hasWarning ? 'border-amber-300 focus:ring-amber-500' : 'border-slate-200 focus:ring-brand-500'

  // sequence_editor — SequenceEditor component
  if (field.type === 'sequence_editor') {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-slate-600">{field.label}</label>
          {readOnly && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
              <Lock size={9} />
              {lang === 'tr' ? 'Stoaix ekibi tarafından ayarlanır' : 'Managed by Stoaix team'}
            </span>
          )}
        </div>
        <SequenceEditor
          steps={Array.isArray(value) ? value : []}
          onChange={onChange}
          orgTemplates={orgTemplates}
          readOnly={readOnly}
        />
      </div>
    )
  }

  // template_picker — Wasender için AI otomatik üretir, template gerekmez
  if (field.type === 'template_picker' && waProvider === 'wasender') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-medium text-emerald-800">
          {lang === 'tr' ? 'AI otomatik mesaj üretir' : 'AI generates messages automatically'}
        </p>
        <p className="text-xs text-emerald-600 mt-0.5">
          {lang === 'tr'
            ? 'WasenderAPI bağlantınız var — template seçimi gerekmez. AI, lead bilgilerine göre kişiselleştirilmiş mesaj yazar.'
            : 'You are using WasenderAPI — no template needed. AI writes a personalized message based on lead data.'}
        </p>
      </div>
    )
  }

  // template_picker — dropdown + body preview
  if (field.type === 'template_picker') {
    const purpose = field.template_purpose
    const approved = purpose
      ? orgTemplates.filter(t => t.status === 'approved' && t.purpose === purpose)
      : orgTemplates.filter(t => t.status === 'approved')
    const allApproved = orgTemplates.filter(t => t.status === 'approved')
    const selectedTpl = value ? [...approved, ...allApproved].find(t => t.name === value) : null
    const bodyText = selectedTpl ? getBodyText(selectedTpl.components) : ''

    return (
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
        {approved.length > 0 ? (
          <div className="space-y-2">
            <select
              value={String(value ?? '')}
              onChange={e => onChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${borderClass}`}
            >
              <option value="">-- Template seçin --</option>
              {approved.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
              {/* Show non-purpose approved templates as fallback */}
              {allApproved.length > approved.length && (
                <optgroup label={lang === 'tr' ? 'Diğer onaylı templateler' : 'Other approved templates'}>
                  {allApproved.filter(t => !approved.some(a => a.id === t.id)).map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Message preview */}
            {bodyText && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Eye size={11} className="text-slate-400" />
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {lang === 'tr' ? 'Mesaj Önizleme' : 'Message Preview'}
                  </p>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{bodyText}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              {lang === 'tr'
                ? 'Bu kategori için onaylı template bulunamadı.'
                : 'No approved templates found for this category.'}
            </p>
            <a
              href="/dashboard/templates"
              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium mt-1"
            >
              <ExternalLink size={10} />
              {lang === 'tr' ? 'Template sayfasına git' : 'Go to Templates'}
            </a>
          </div>
        )}
        {issues.map((issue, idx) => (
          <p key={idx} className={`text-xs mt-1 flex items-center gap-1 ${
            issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'
          }`}>
            <AlertTriangle size={10} />
            {lang === 'tr' ? issue.message_tr : issue.message_en}
          </p>
        ))}
      </div>
    )
  }

  const readOnlyClass = readOnly ? 'bg-slate-50 cursor-not-allowed' : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-slate-600">{field.label}</label>
        {readOnly && (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
            <Lock size={9} />
            {lang === 'tr' ? 'Stoaix ekibi tarafından ayarlanır' : 'Managed by Stoaix team'}
          </span>
        )}
      </div>

      {field.type === 'select' && field.options && (
        <select
          value={String(value)}
          onChange={e => !readOnly && onChange(e.target.value)}
          disabled={readOnly}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${borderClass} ${readOnlyClass}`}
        >
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {field.type === 'number' && (
        <input
          type="number"
          value={value}
          onChange={e => !readOnly && onChange(Number(e.target.value))}
          readOnly={readOnly}
          min={field.min}
          max={field.max}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${borderClass} ${readOnlyClass}`}
        />
      )}

      {field.type === 'time' && (
        <input
          type="time"
          value={value}
          onChange={e => !readOnly && onChange(e.target.value)}
          readOnly={readOnly}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${borderClass} ${readOnlyClass}`}
        />
      )}

      {field.type === 'boolean' && (
        <label className={`flex items-center gap-2 ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => !readOnly && onChange(e.target.checked)}
            disabled={readOnly}
            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 disabled:opacity-60"
          />
          <span className="text-sm text-slate-600">{field.description || ''}</span>
        </label>
      )}

      {field.type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={e => !readOnly && onChange(e.target.value)}
          readOnly={readOnly}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${borderClass} ${readOnlyClass}`}
        />
      )}

      {/* Issues */}
      {issues.map((issue, idx) => (
        <p key={idx} className={`text-xs mt-1 flex items-center gap-1 ${
          issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'
        }`}>
          <AlertTriangle size={10} />
          {lang === 'tr' ? issue.message_tr : issue.message_en}
        </p>
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WorkflowSettingsClient({
  template,
  workflowId,
  savedConfig,
  isActive,
  isSuperAdmin,
  waProvider,
}: {
  template: WorkflowTemplate
  workflowId: string
  savedConfig: Record<string, any>
  isActive: boolean
  isSuperAdmin: boolean
  waProvider?: string
}) {
  const router = useRouter()
  const { lang } = useLang()
  const l = (key: LKey) => L[key][lang]

  // Build initial config from savedConfig + defaults
  const defaultConfig = useMemo(() => {
    const defaults: Record<string, any> = {}
    for (const f of template.config_fields) {
      defaults[f.key] = f.default
    }
    return defaults
  }, [template])

  const [config, setConfig] = useState<Record<string, any>>(() => {
    const merged = { ...defaultConfig, ...savedConfig }
    // Seed sequence from default_sequence if not saved yet
    if (!merged.sequence || (Array.isArray(merged.sequence) && merged.sequence.length === 0)) {
      if (template.default_sequence?.length) {
        merged.sequence = template.default_sequence
      }
    }
    return merged
  })
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')

  // Fetch org templates for template_picker and sequence_editor fields
  const hasTemplatePicker = template.config_fields.some(f => f.type === 'template_picker' || f.type === 'sequence_editor')
  const [orgTemplates, setOrgTemplates] = useState<OrgTemplate[]>([])
  useEffect(() => {
    if (!hasTemplatePicker) return
    fetch('/api/templates')
      .then(r => r.json())
      .then(d => setOrgTemplates(
        (d.templates ?? []).map((t: any) => ({
          id: t.id, name: t.name, status: t.status,
          purpose: t.purpose, components: t.components ?? null,
        }))
      ))
      .catch(() => {})
  }, [hasTemplatePicker])

  const handleChange = useCallback((key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaveStatus('idle')
  }, [])

  const handleReset = useCallback(() => {
    setConfig({ ...defaultConfig })
    setSaveStatus('idle')
  }, [defaultConfig])

  // Validation
  const validation = useMemo(() => validateWorkflowConfig(template.id, config), [template.id, config])

  async function handleSave() {
    if (!validation.valid) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || l('saveFailed'))
      }
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (e: any) {
      setSaveError(e.message)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify({ ...defaultConfig, ...savedConfig })

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/workflows')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={16} />
            {l('back')}
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <h1 className="text-lg font-semibold text-slate-800">
            {template.name} {l('settings')}
          </h1>
          {isActive && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aktif
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          <RotateCcw size={12} />
          {l('resetBtn')}
        </button>
      </div>

      {/* Validation Banner */}
      {validation.issues.length > 0 && (
        <div className={`mb-4 rounded-xl border px-4 py-3 ${
          !validation.valid
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className={!validation.valid ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'} />
            <div className="space-y-1">
              {!validation.valid && (
                <p className="text-sm font-medium text-red-700">{l('hasErrors')}</p>
              )}
              {validation.issues.map((issue, i) => (
                <p key={i} className={`text-xs ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                  {lang === 'tr' ? issue.message_tr : issue.message_en}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Flow Preview */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <FlowPreviewPanel config={config} template={template} />
          </div>
        </div>

        {/* Right: Config Groups */}
        <div className="lg:col-span-3">
          <ConfigGroupPanel
            fields={template.config_fields}
            config={config}
            onChange={handleChange}
            issues={validation.issues}
            lang={lang}
            orgTemplates={orgTemplates}
            isSuperAdmin={isSuperAdmin}
            waProvider={waProvider}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-0 mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-sm border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
          {saveError && (
            <p className="text-sm text-red-600 mr-auto">{saveError}</p>
          )}
          {saveStatus === 'success' && (
            <p className="text-sm text-emerald-600 flex items-center gap-1 mr-auto">
              <CheckCircle2 size={14} /> {l('saved')}
            </p>
          )}
          <button
            onClick={() => router.push('/dashboard/workflows')}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {l('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !validation.valid || !hasChanges}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? l('saving') : l('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
