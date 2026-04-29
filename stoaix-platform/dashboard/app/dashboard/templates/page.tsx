'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, Send, Trash2, RefreshCw, MessageSquare, Copy, Pencil, Zap, Star } from 'lucide-react'
import TemplateModal from '@/components/templates/TemplateModal'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/lib/org-context'
import {
  TEMPLATE_PURPOSES,
  PURPOSE_LABELS,
  PURPOSE_WORKFLOW_NAMES,
  LANGUAGE_LABELS,
  SECTOR_LABELS,
  SECTOR_GROUPS,
} from '@/lib/template-purpose-config'

type TemplateStatus = 'draft' | 'pending' | 'approved' | 'rejected'

interface Template {
  id:               string
  name:             string
  language:         string
  category:         string
  components:       any[]
  status:           TemplateStatus
  is_preset:        boolean
  is_recommended:   boolean
  sector:           string | null
  purpose:          string | null
  meta_template_id: string | null
  rejection_reason: string | null
  created_at:       string
}

const STATUS_BADGE: Record<TemplateStatus, { label: string; className: string }> = {
  draft:    { label: 'Taslak',     className: 'bg-slate-100 text-slate-600' },
  pending:  { label: 'Beklemede',  className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Onaylı',     className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-600' },
}

// ─── Preset Card ──────────────────────────────────────────────────────────────

function PresetCard({ preset, onUse }: { preset: Template; onUse: (id: string) => void }) {
  const [using, setUsing] = useState(false)

  async function handleUse() {
    setUsing(true)
    await onUse(preset.id)
    setUsing(false)
  }

  const bodyText = preset.components.find((c) => c.type === 'BODY')?.text ?? ''

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-500 truncate">{preset.name}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {preset.is_recommended && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0">
                <Star size={8} fill="currentColor" />
                Sistem Önerisi
              </span>
            )}
            {preset.sector && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {SECTOR_LABELS[preset.sector] ?? preset.sector}
              </span>
            )}
            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full uppercase">
              {preset.language}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 line-clamp-3 flex-1">
        {bodyText}
      </p>
      <button
        onClick={handleUse}
        disabled={using}
        className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        {using ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
        Kullan &amp; Düzenle
      </button>
    </div>
  )
}

// ─── My Template Card ─────────────────────────────────────────────────────────

function MyTemplateCard({
  template,
  onSubmit,
  onDelete,
  onEdit,
  submitting,
  deleting,
}: {
  template:   Template
  onSubmit:   (id: string) => void
  onDelete:   (id: string) => void
  onEdit:     (template: Template) => void
  submitting: string | null
  deleting:   string | null
}) {
  const badge      = STATUS_BADGE[template.status] ?? STATUS_BADGE.draft
  const isDraft    = template.status === 'draft'
  const isRejected = template.status === 'rejected'
  const bodyText   = template.components.find((c) => c.type === 'BODY')?.text ?? ''
  const purposeLabel = PURPOSE_LABELS[template.purpose ?? ''] ?? template.purpose

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-slate-800 truncate">{template.name}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {purposeLabel && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{purposeLabel}</span>
            )}
            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full uppercase">
              {template.language}
            </span>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 line-clamp-3">
        {bodyText || <span className="text-slate-300 italic">İçerik yok</span>}
      </p>

      {isRejected && template.rejection_reason && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          Red sebebi: {template.rejection_reason}
        </p>
      )}

      <div className="flex items-center gap-2 mt-auto">
        {isDraft && (
          <button
            onClick={() => onEdit(template)}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil size={12} /> Düzenle
          </button>
        )}
        {(isDraft || isRejected) && (
          <button
            onClick={() => onSubmit(template.id)}
            disabled={submitting === template.id}
            className="flex items-center gap-1.5 text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {submitting === template.id ? (
              <><Loader2 size={12} className="animate-spin" /> Meta&apos;ya gönderiliyor...</>
            ) : (
              <><Send size={12} /> Meta&apos;ya Gönder</>
            )}
          </button>
        )}
        <button
          onClick={() => onDelete(template.id)}
          disabled={deleting === template.id || template.status === 'pending'}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 disabled:opacity-40 transition-colors"
          title={template.status === 'pending' ? 'Onay bekleyen template silinemez' : 'Sil'}
        >
          {deleting === template.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          Sil
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const { orgId: ctxOrgId } = useOrg()
  const [tab, setTab]               = useState<'presets' | 'mine'>('presets')
  const [templates, setTemplates]   = useState<Template[]>([])
  const [presets, setPresets]       = useState<Template[]>([])
  const [orgSector, setOrgSector]   = useState<string>('general')
  const [orgLang, setOrgLang]       = useState<string>('tr')
  const [activeSector, setActiveSector] = useState<string>('all')
  const [activeLang, setActiveLang]     = useState<string>('auto')
  const [activePurpose, setActivePurpose] = useState<string>('all')
  const [loading, setLoading]       = useState(true)
  const [presetsLoading, setPresetsLoading] = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  // Load org sector + language
  useEffect(() => {
    if (!ctxOrgId) return
    const supabase = createClient()
    supabase
      .from('organizations').select('sector, ai_persona').eq('id', ctxOrgId).single()
      .then(({ data: org }) => {
        if (org?.sector) {
          setOrgSector(org.sector)
          setActiveSector(org.sector)
        }
        const lang = (org?.ai_persona as any)?.language
        if (lang) setOrgLang(lang)
      })
  }, [ctxOrgId])

  // Sync template statuses from Meta, then reload
  const syncFromMeta = useCallback(async () => {
    try {
      await fetch('/api/templates/sync', { method: 'POST' })
    } catch { /* ignore sync errors */ }
  }, [])

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      await syncFromMeta()
      const res = await fetch('/api/templates')
      const data = await res.json()
      if (res.ok) setTemplates(data.templates ?? [])
    } finally {
      setLoading(false)
    }
  }, [syncFromMeta])

  const loadPresets = useCallback(async () => {
    setPresetsLoading(true)
    try {
      const res = await fetch('/api/templates/presets')
      const data = await res.json()
      if (res.ok) setPresets(data.presets ?? [])
    } finally {
      setPresetsLoading(false)
    }
  }, [])

  useEffect(() => { loadTemplates(); loadPresets() }, [loadTemplates, loadPresets])

  async function usePreset(id: string) {
    setError('')
    const res = await fetch(`/api/templates/presets/${id}/use`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Kullanılamadı'); return }
    setTemplates((prev) => [data.template, ...prev])
    setTab('mine')
  }

  function onSaved(template: Template, _submitted?: boolean) {
    if (editingTemplate) {
      setTemplates((prev) => prev.map((t) => t.id === template.id ? template : t))
    } else {
      setTemplates((prev) => [template, ...prev])
    }
    setShowModal(false)
    setEditingTemplate(null)
  }

  function openEdit(template: Template) {
    setEditingTemplate(template)
    setShowModal(true)
  }

  async function submit(id: string) {
    setSubmitting(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/templates/${id}/submit`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gönderim başarısız')
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, status: 'pending' } : t))
      setSuccess('Template Meta\'ya gönderildi! Onay süreci genellikle birkaç dakika ile 24 saat arasında sürer.')
      setTimeout(() => setSuccess(''), 8000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Bu template silinsin mi?')) return
    setDeleting(id)
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  // ── Presets filtering: language + sector, grouped by purpose ──
  const effectiveLang = activeLang === 'auto' ? orgLang : activeLang
  const filteredPresets = presets.filter((p) => {
    if (activeLang !== 'all' && p.language !== effectiveLang) return false
    if (activeSector !== 'all' && p.sector !== activeSector) return false
    return true
  })

  const presetsByPurpose = TEMPLATE_PURPOSES.reduce((acc, purpose) => {
    const items = filteredPresets
      .filter((p) => p.purpose === purpose)
      .sort((a, b) => (b.is_recommended ? 1 : 0) - (a.is_recommended ? 1 : 0))
    if (items.length > 0) acc[purpose] = items
    return acc
  }, {} as Record<string, Template[]>)

  // ── Reactivation step sub-grouping helpers ──
  const STEP_LABELS: Record<number, string> = {
    1: 'Adım 1 — Nazik Hatırlatma',
    2: 'Adım 2 — Değer Hatırlatma',
    3: 'Adım 3 — Sosyal Kanıt',
    4: 'Adım 4 — Özel Teklif',
    5: 'Adım 5 — Son Bildirim',
  }

  function getStepNumber(name: string): number | null {
    const m = name.match(/_reactivation_s(\d+)_/)
    return m ? parseInt(m[1]) : null
  }

  // ── My Templates filtering: by purpose ──
  const filteredMyTemplates = activePurpose === 'all'
    ? templates
    : templates.filter((t) => t.purpose === activePurpose)

  const myTemplatesByPurpose = TEMPLATE_PURPOSES.reduce((acc, purpose) => {
    const items = filteredMyTemplates.filter((t) => t.purpose === purpose)
    if (items.length > 0) acc[purpose] = items
    return acc
  }, {} as Record<string, Template[]>)

  // Status summary for My Templates purpose group headers
  function statusSummary(items: Template[]): string {
    const approved = items.filter((t) => t.status === 'approved').length
    const pending  = items.filter((t) => t.status === 'pending').length
    const draft    = items.filter((t) => t.status === 'draft').length
    const parts: string[] = []
    if (approved) parts.push(`${approved} Onaylı`)
    if (pending)  parts.push(`${pending} Beklemede`)
    if (draft)    parts.push(`${draft} Taslak`)
    return parts.join(', ')
  }

  const langLabel = activeLang === 'auto'
    ? `${LANGUAGE_LABELS[orgLang] ?? orgLang}`
    : activeLang === 'all' ? 'Tümü' : LANGUAGE_LABELS[activeLang] ?? activeLang

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare size={22} className="text-brand-600" />
          <div>
            <h1 className="text-xl font-semibold text-slate-800">WhatsApp Templateler</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Meta onaylı template mesajlar — 24 saat dışında da gönderebilirsiniz.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadTemplates(); loadPresets() }}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Yenile"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={15} />
            Yeni Template
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0"><path d="M8 1a7 7 0 110 14A7 7 0 018 1zm2.354 4.646a.5.5 0 00-.708 0L7 8.293 6.354 7.646a.5.5 0 10-.708.708l1 1a.5.5 0 00.708 0l3-3a.5.5 0 000-.708z" fill="currentColor"/></svg>
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('presets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'presets' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Hazır Şablonlar
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'mine' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Templatelerim
          {templates.length > 0 && (
            <span className="bg-brand-100 text-brand-700 text-xs px-1.5 py-0.5 rounded-full">
              {templates.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Presets Tab ── */}
      {tab === 'presets' && (
        <>
          {/* Language filter */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="text-xs text-slate-400 self-center mr-1">Dil:</span>
            {(['auto', 'tr', 'en', 'de', 'all'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  activeLang === lang
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {lang === 'auto'
                  ? `Otomatik (${(LANGUAGE_LABELS[orgLang] ?? orgLang).substring(0, 2).toUpperCase()})`
                  : lang === 'all'
                  ? 'Tümü'
                  : LANGUAGE_LABELS[lang] ?? lang}
              </button>
            ))}
          </div>

          {/* Sector filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            <span className="text-xs text-slate-400 self-center mr-1">Sektör:</span>
            <button
              onClick={() => setActiveSector('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                activeSector === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Tümü
            </button>
            {SECTOR_GROUPS.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSector(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  activeSector === s
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {SECTOR_LABELS[s]}
              </button>
            ))}
          </div>

          {presetsLoading ? (
            <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
              <Loader2 size={18} className="animate-spin" /> Yükleniyor...
            </div>
          ) : (
            <div className="space-y-8">
              {TEMPLATE_PURPOSES.map((purpose) => {
                const items = presetsByPurpose[purpose]
                if (!items) return null
                const workflows = PURPOSE_WORKFLOW_NAMES[purpose] ?? []

                // ── Reactivation step sub-grouping ──
                if (purpose === 'reengagement') {
                  const stepGroups: Record<number, Template[]> = {}
                  const general: Template[] = []
                  items.forEach((p) => {
                    const step = getStepNumber(p.name)
                    if (step) {
                      if (!stepGroups[step]) stepGroups[step] = []
                      stepGroups[step].push(p)
                    } else {
                      general.push(p)
                    }
                  })
                  const stepNums = Object.keys(stepGroups).map(Number).sort((a, b) => a - b)

                  return (
                    <div key={purpose}>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-700">
                          {PURPOSE_LABELS[purpose] ?? purpose}
                        </h3>
                        {workflows.map((wf) => (
                          <span key={wf} className="inline-flex items-center gap-1 text-[10px] bg-brand-50 text-brand-600 border border-brand-100 rounded-full px-2 py-0.5">
                            <Zap size={8} />{wf}
                          </span>
                        ))}
                      </div>
                      {general.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-slate-400 font-medium mb-2">Genel</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {general.map((p) => <PresetCard key={p.id} preset={p} onUse={usePreset} />)}
                          </div>
                        </div>
                      )}
                      {stepNums.map((step) => (
                        <div key={step} className="mb-4">
                          <p className="text-xs text-slate-400 font-medium mb-2">{STEP_LABELS[step] ?? `Adım ${step}`}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {stepGroups[step].map((p) => <PresetCard key={p.id} preset={p} onUse={usePreset} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }

                return (
                  <div key={purpose}>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-700">
                        {PURPOSE_LABELS[purpose] ?? purpose}
                      </h3>
                      {workflows.map((wf) => (
                        <span
                          key={wf}
                          className="inline-flex items-center gap-1 text-[10px] bg-brand-50 text-brand-600 border border-brand-100 rounded-full px-2 py-0.5"
                        >
                          <Zap size={8} />
                          {wf}
                        </span>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {items.map((p) => (
                        <PresetCard key={p.id} preset={p} onUse={usePreset} />
                      ))}
                    </div>
                  </div>
                )
              })}
              {Object.keys(presetsByPurpose).length === 0 && (
                <p className="text-center text-slate-400 py-12">
                  {activeLang !== 'all'
                    ? `${langLabel} dilinde hazır şablon bulunamadı.`
                    : 'Hazır şablon bulunamadı.'}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── My Templates Tab ── */}
      {tab === 'mine' && (
        <>
          {/* Purpose filter chips */}
          <div className="flex gap-2 mb-5 flex-wrap">
            <button
              onClick={() => setActivePurpose('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                activePurpose === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Tümü
            </button>
            {TEMPLATE_PURPOSES.filter((p) => p !== 'other').map((purpose) => (
              <button
                key={purpose}
                onClick={() => setActivePurpose(purpose)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  activePurpose === purpose
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {PURPOSE_LABELS[purpose]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
              <Loader2 size={18} className="animate-spin" /> Yükleniyor...
            </div>
          ) : filteredMyTemplates.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Henüz template yok</p>
              <p className="text-sm text-slate-400 mt-1">
                Hazır Şablonlar sekmesinden bir şablon seçin veya &quot;Yeni Template&quot; ile kendiniz oluşturun.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {TEMPLATE_PURPOSES.map((purpose) => {
                const items = myTemplatesByPurpose[purpose]
                if (!items) return null
                return (
                  <div key={purpose}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-slate-700">
                        {PURPOSE_LABELS[purpose] ?? purpose}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {statusSummary(items)}
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {items.map((t) => (
                        <MyTemplateCard
                          key={t.id}
                          template={t}
                          onSubmit={submit}
                          onDelete={remove}
                          onEdit={openEdit}
                          submitting={submitting}
                          deleting={deleting}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
              {/* Templates with no purpose or unlisted purpose */}
              {filteredMyTemplates.filter((t) => !t.purpose || !TEMPLATE_PURPOSES.includes(t.purpose as any)).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Diğer</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredMyTemplates
                      .filter((t) => !t.purpose || !TEMPLATE_PURPOSES.includes(t.purpose as any))
                      .map((t) => (
                        <MyTemplateCard
                          key={t.id}
                          template={t}
                          onSubmit={submit}
                          onDelete={remove}
                          onEdit={openEdit}
                          submitting={submitting}
                          deleting={deleting}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showModal && (
        <TemplateModal
          onClose={() => { setShowModal(false); setEditingTemplate(null) }}
          onSaved={onSaved}
          editTemplate={editingTemplate}
        />
      )}
    </div>
  )
}
