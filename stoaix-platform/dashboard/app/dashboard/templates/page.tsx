'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, Send, Trash2, RefreshCw, MessageSquare, Copy, ChevronDown } from 'lucide-react'
import TemplateModal from '@/components/templates/TemplateModal'
import { createClient } from '@/lib/supabase/client'

type TemplateStatus = 'draft' | 'pending' | 'approved' | 'rejected'

interface Template {
  id:               string
  name:             string
  language:         string
  category:         string
  components:       any[]
  status:           TemplateStatus
  is_preset:        boolean
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

const PURPOSE_LABELS: Record<string, string> = {
  followup:             'Takip',
  reengagement:         'Yeniden Bağlama',
  unsubscribe:          'Listeden Çıkma',
  appointment_reminder: 'Randevu Hatırlatma',
  other:                'Diğer',
}

const SECTOR_LABELS: Record<string, string> = {
  dental:     '🦷 Diş Kliniği',
  hair:       '💇 Saç Ekimi',
  aesthetics: '✨ Estetik',
  general:    '📋 Genel',
}

const SECTOR_GROUPS = ['dental', 'hair', 'aesthetics', 'general']

// ─── Preset Card ──────────────────────────────────────────────────────────────

function PresetCard({ preset, onUse }: { preset: Template; onUse: (id: string) => void }) {
  const [using, setUsing] = useState(false)

  async function handleUse() {
    setUsing(true)
    await onUse(preset.id)
    setUsing(false)
  }

  const bodyText = preset.components.find((c) => c.type === 'BODY')?.text ?? ''
  const purposeLabel = PURPOSE_LABELS[preset.purpose ?? ''] ?? preset.purpose

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-500 truncate">{preset.name}</p>
          {purposeLabel && (
            <span className="inline-block mt-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
              {purposeLabel}
            </span>
          )}
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
  submitting,
  deleting,
}: {
  template:   Template
  onSubmit:   (id: string) => void
  onDelete:   (id: string) => void
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
        {(isDraft || isRejected) && (
          <button
            onClick={() => onSubmit(template.id)}
            disabled={submitting === template.id}
            className="flex items-center gap-1.5 text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {submitting === template.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Meta&apos;ya Gönder
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
  const [tab, setTab]               = useState<'presets' | 'mine'>('presets')
  const [templates, setTemplates]   = useState<Template[]>([])
  const [presets, setPresets]       = useState<Template[]>([])
  const [orgSector, setOrgSector]   = useState<string>('general')
  const [activeSector, setActiveSector] = useState<string>('all')
  const [loading, setLoading]       = useState(true)
  const [presetsLoading, setPresetsLoading] = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [error, setError]           = useState('')

  // Load org sector
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: orgUser } = await supabase
        .from('org_users').select('organization_id').eq('user_id', user.id).maybeSingle()
      if (!orgUser) return
      const { data: org } = await supabase
        .from('organizations').select('sector').eq('id', orgUser.organization_id).single()
      if (org?.sector) {
        setOrgSector(org.sector)
        setActiveSector(org.sector)
      }
    })
  }, [])

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      if (res.ok) setTemplates(data.templates ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

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
    setTemplates((prev) => [template, ...prev])
    setShowModal(false)
  }

  async function submit(id: string) {
    setSubmitting(id)
    setError('')
    try {
      const res = await fetch(`/api/templates/${id}/submit`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gönderim başarısız')
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, status: 'pending' } : t))
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

  // Filter presets by active sector
  const filteredPresets = activeSector === 'all'
    ? presets
    : presets.filter((p) => p.sector === activeSector)

  // Group presets by sector for display
  const presetsBySector = SECTOR_GROUPS.reduce((acc, sector) => {
    const items = filteredPresets.filter((p) => p.sector === sector)
    if (items.length > 0) acc[sector] = items
    return acc
  }, {} as Record<string, Template[]>)

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
          {/* Sector filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
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
            <div className="space-y-6">
              {Object.entries(presetsBySector).map(([sector, items]) => (
                <div key={sector}>
                  <h3 className="text-sm font-semibold text-slate-500 mb-3">
                    {SECTOR_LABELS[sector] ?? sector}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((p) => (
                      <PresetCard key={p.id} preset={p} onUse={usePreset} />
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(presetsBySector).length === 0 && (
                <p className="text-center text-slate-400 py-12">Hazır şablon bulunamadı.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── My Templates Tab ── */}
      {tab === 'mine' && (
        <>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
              <Loader2 size={18} className="animate-spin" /> Yükleniyor...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Henüz template yok</p>
              <p className="text-sm text-slate-400 mt-1">
                Hazır Şablonlar sekmesinden bir şablon seçin veya "Yeni Template" ile kendiniz oluşturun.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {templates.map((t) => (
                <MyTemplateCard
                  key={t.id}
                  template={t}
                  onSubmit={submit}
                  onDelete={remove}
                  submitting={submitting}
                  deleting={deleting}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <TemplateModal
          onClose={() => setShowModal(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
