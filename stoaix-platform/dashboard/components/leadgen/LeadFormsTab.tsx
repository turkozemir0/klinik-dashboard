'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Settings2, ChevronLeft,
  AlertCircle, CheckSquare, Square, ExternalLink, RefreshCw,
} from 'lucide-react'
import { useLang } from '@/lib/lang-context'

interface MetaForm {
  id: string
  name: string
  status: string
  leads_count: number
  locale: string
}

interface LeadFieldData {
  name: string
  values: string[]
}

interface Lead {
  id: string
  created_time: string
  field_data: LeadFieldData[]
  ad_name?: string
  campaign_name?: string
}

// ─── Helper: is within last 24h ─────────────────────────────────────────────
function isNew(createdTime: string) {
  return Date.now() - new Date(createdTime).getTime() < 24 * 60 * 60 * 1000
}

// ─── Helper: extract field value ────────────────────────────────────────────
function fieldVal(lead: Lead, name: string): string {
  const f = lead.field_data?.find(
    (d) => d.name.toLowerCase() === name.toLowerCase()
  )
  return f?.values?.[0] ?? ''
}

// ─── Form Card ──────────────────────────────────────────────────────────────
function FormCard({
  form,
  newCount,
  previewLeads,
  onSelect,
  lang,
}: {
  form: MetaForm
  newCount: number
  previewLeads: Lead[]
  onSelect: () => void
  lang: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{form.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {form.locale && (
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full uppercase">
                {form.locale}
              </span>
            )}
            <span className="text-xs text-slate-400">
              {form.leads_count ?? 0} {lang === 'tr' ? 'lead' : 'leads'}
            </span>
          </div>
        </div>
        {newCount > 0 && (
          <span className="shrink-0 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {newCount} {lang === 'tr' ? 'yeni' : 'new'}
          </span>
        )}
      </div>

      {/* Preview list */}
      {previewLeads.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
          {previewLeads.slice(0, 5).map((lead) => {
            const name = fieldVal(lead, 'full_name') || fieldVal(lead, 'first_name') || fieldVal(lead, 'ad_soyad') || '—'
            const phone = fieldVal(lead, 'phone_number') || fieldVal(lead, 'telefon') || ''
            return (
              <div key={lead.id} className="flex items-center gap-2 text-sm">
                {isNew(lead.created_time) && (
                  <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
                <span className="text-slate-700 truncate flex-1">{name}</span>
                {phone && <span className="text-slate-400 text-xs font-mono">{phone}</span>}
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={onSelect}
        className="mt-auto flex items-center justify-center gap-2 w-full bg-brand-50 text-brand-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
      >
        <ExternalLink size={14} />
        {lang === 'tr' ? 'Tümünü Gör' : 'View All'}
      </button>
    </div>
  )
}

// ─── Lead Detail Table ──────────────────────────────────────────────────────
function LeadTable({
  formName,
  leads,
  loading,
  hasMore,
  onLoadMore,
  onBack,
  lang,
}: {
  formName: string
  leads: Lead[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onBack: () => void
  lang: string
}) {
  const knownFields = ['full_name', 'first_name', 'last_name', 'ad_soyad', 'phone_number', 'telefon', 'email', 'e-posta', 'city', 'şehir']
  const extraFields: string[] = []
  for (const lead of leads) {
    for (const f of lead.field_data ?? []) {
      const lower = f.name.toLowerCase()
      if (!knownFields.includes(lower) && !extraFields.includes(f.name)) {
        extraFields.push(f.name)
      }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-lg font-semibold text-slate-800 truncate">{formName}</h2>
        <span className="text-sm text-slate-400">{leads.length} lead</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                  {lang === 'tr' ? 'Ad Soyad' : 'Name'}
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                  {lang === 'tr' ? 'Telefon' : 'Phone'}
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                  {lang === 'tr' ? 'Şehir' : 'City'}
                </th>
                {extraFields.slice(0, 3).map((f) => (
                  <th key={f} className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">{f}</th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                  {lang === 'tr' ? 'Reklam' : 'Ad'}
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                  {lang === 'tr' ? 'Tarih' : 'Date'}
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const name = fieldVal(lead, 'full_name') || fieldVal(lead, 'first_name') || fieldVal(lead, 'ad_soyad') || '—'
                const phone = fieldVal(lead, 'phone_number') || fieldVal(lead, 'telefon') || ''
                const email = fieldVal(lead, 'email') || fieldVal(lead, 'e-posta') || ''
                const city = fieldVal(lead, 'city') || fieldVal(lead, 'şehir') || ''
                const _isNew = isNew(lead.created_time)
                return (
                  <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {_isNew && (
                          <span className="shrink-0 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            {lang === 'tr' ? 'YENİ' : 'NEW'}
                          </span>
                        )}
                        <span className="text-slate-800">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">{phone}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{email}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{city}</td>
                    {extraFields.slice(0, 3).map((f) => (
                      <td key={f} className="px-4 py-3 text-slate-600 whitespace-nowrap">{fieldVal(lead, f)}</td>
                    ))}
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap max-w-[180px] truncate">
                      {lead.ad_name || lead.campaign_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(lead.created_time).toLocaleString('tr-TR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                )
              })}
              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan={8 + Math.min(extraFields.length, 3)} className="px-4 py-12 text-center text-slate-400">
                    {lang === 'tr' ? 'Bu formda henüz lead yok.' : 'No leads in this form yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 py-6">
          <Loader2 size={16} className="animate-spin" />
          {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onLoadMore}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium px-4 py-2 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors"
          >
            {lang === 'tr' ? 'Daha Fazla Yükle' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Form Picker Modal ──────────────────────────────────────────────────────
function FormPicker({
  forms,
  selected,
  onSave,
  onClose,
  saving,
  lang,
}: {
  forms: MetaForm[]
  selected: string[]
  onSave: (ids: string[]) => void
  onClose: () => void
  saving: boolean
  lang: string
}) {
  const [picked, setPicked] = useState<string[]>(selected)

  function toggle(id: string) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">
            {lang === 'tr' ? 'Lead Form Seçimi' : 'Select Lead Forms'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {lang === 'tr'
              ? `Dashboard'da görmek istediğiniz formları seçin (max 5). ${picked.length}/5 seçili.`
              : `Choose forms to display on dashboard (max 5). ${picked.length}/5 selected.`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
          {forms.map((form) => {
            const isSelected = picked.includes(form.id)
            const isDisabled = !isSelected && picked.length >= 5
            return (
              <button
                key={form.id}
                onClick={() => toggle(form.id)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-brand-50 border border-brand-200'
                    : isDisabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                {isSelected ? (
                  <CheckSquare size={18} className="text-brand-600 shrink-0" />
                ) : (
                  <Square size={18} className="text-slate-300 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{form.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {form.locale && (
                      <span className="text-xs text-slate-400 uppercase">{form.locale}</span>
                    )}
                    <span className="text-xs text-slate-400">
                      {form.leads_count ?? 0} lead
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      form.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {form.status}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
          {forms.length === 0 && (
            <p className="text-center text-slate-400 py-8">
              {lang === 'tr' ? 'Facebook sayfanızda lead form bulunamadı.' : 'No lead forms found on your Facebook page.'}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            {lang === 'tr' ? 'İptal' : 'Cancel'}
          </button>
          <button
            onClick={() => onSave(picked)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {lang === 'tr' ? 'Kaydet' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Tab Component ─────────────────────────────────────────────────────
export default function LeadFormsTab() {
  const { lang } = useLang()

  const [status, setStatus] = useState<'loading' | 'no_instagram' | 'no_forms' | 'ready'>('loading')
  const [activeFormIds, setActiveFormIds] = useState<string[]>([])
  const [allForms, setAllForms] = useState<MetaForm[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [pickerForms, setPickerForms] = useState<MetaForm[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [syncMsg, setSyncMsg] = useState('')

  // Per-form lead data
  const [formLeads, setFormLeads] = useState<Record<string, Lead[]>>({})
  const [formLeadsLoading, setFormLeadsLoading] = useState<Record<string, boolean>>({})

  // Detail view
  const [detailFormId, setDetailFormId] = useState<string | null>(null)
  const [detailLeads, setDetailLeads] = useState<Lead[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailCursor, setDetailCursor] = useState<string | null>(null)

  // ── Load config on mount ──
  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/leadgen/config')
      const data = await res.json()
      if (res.ok) {
        const ids: string[] = data.active_form_ids ?? []
        setActiveFormIds(ids)
        if (ids.length === 0) {
          setStatus('no_forms')
        } else {
          setStatus('ready')
        }
      } else if (data.error === 'instagram_not_connected') {
        setStatus('no_instagram')
      }
    } catch {
      setStatus('no_instagram')
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  // ── Sync on mount (fire-and-forget) ──
  useEffect(() => {
    if (status !== 'ready' || activeFormIds.length === 0) return
    fetch('/api/leadgen/sync', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.synced && data.synced > 0) {
          setSyncMsg(
            lang === 'tr'
              ? `${data.synced} yeni lead eklendi`
              : `${data.synced} new leads synced`
          )
          setTimeout(() => setSyncMsg(''), 5000)
        }
      })
      .catch(() => {})
  }, [status, activeFormIds.length, lang])

  // ── Load form metadata + preview leads when ready ──
  useEffect(() => {
    if (status !== 'ready' || activeFormIds.length === 0) return

    fetch('/api/leadgen/forms')
      .then((r) => r.json())
      .then((data) => {
        if (data.forms) {
          const filtered = (data.forms as MetaForm[]).filter((f) => activeFormIds.includes(f.id))
          setAllForms(filtered)
        }
      })
      .catch(() => {})

    for (const formId of activeFormIds) {
      setFormLeadsLoading((prev) => ({ ...prev, [formId]: true }))
      fetch(`/api/leadgen/forms/${formId}/leads?limit=5`)
        .then((r) => r.json())
        .then((data) => {
          setFormLeads((prev) => ({ ...prev, [formId]: data.leads ?? [] }))
        })
        .catch(() => {})
        .finally(() => {
          setFormLeadsLoading((prev) => ({ ...prev, [formId]: false }))
        })
    }
  }, [status, activeFormIds])

  // ── Open form picker ──
  async function openPicker() {
    setPickerLoading(true)
    setShowPicker(true)
    try {
      const res = await fetch('/api/leadgen/forms')
      const data = await res.json()
      if (res.ok) {
        setPickerForms(data.forms ?? [])
      } else if (data.error === 'instagram_not_connected') {
        setStatus('no_instagram')
        setShowPicker(false)
      } else {
        setError(data.error ?? 'Form listesi alınamadı')
        setShowPicker(false)
      }
    } catch {
      setError(lang === 'tr' ? 'Bağlantı hatası' : 'Connection error')
      setShowPicker(false)
    } finally {
      setPickerLoading(false)
    }
  }

  // ── Save selected forms ──
  async function saveForms(ids: string[]) {
    setSaving(true)
    try {
      const res = await fetch('/api/leadgen/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_ids: ids }),
      })
      if (res.ok) {
        setActiveFormIds(ids)
        setShowPicker(false)
        setStatus(ids.length > 0 ? 'ready' : 'no_forms')
        setFormLeads({})
        setAllForms([])
      } else {
        const data = await res.json()
        setError(data.error ?? 'Kayıt başarısız')
      }
    } catch {
      setError(lang === 'tr' ? 'Bağlantı hatası' : 'Connection error')
    } finally {
      setSaving(false)
    }
  }

  // ── Refresh: reload data + trigger sync ──
  function handleRefresh() {
    setFormLeads({})
    setAllForms([])
    setSyncMsg('')
    loadConfig()
    // Also trigger sync
    fetch('/api/leadgen/sync', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.synced && data.synced > 0) {
          setSyncMsg(
            lang === 'tr'
              ? `${data.synced} yeni lead eklendi`
              : `${data.synced} new leads synced`
          )
          setTimeout(() => setSyncMsg(''), 5000)
        }
      })
      .catch(() => {})
  }

  // ── Detail view: load leads for a form ──
  async function openDetail(formId: string) {
    setDetailFormId(formId)
    setDetailLeads([])
    setDetailCursor(null)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/leadgen/forms/${formId}/leads?limit=25`)
      const data = await res.json()
      setDetailLeads(data.leads ?? [])
      setDetailCursor(data.paging?.cursors?.after ?? null)
    } catch {
      setError(lang === 'tr' ? 'Lead\'ler yüklenemedi' : 'Failed to load leads')
    } finally {
      setDetailLoading(false)
    }
  }

  async function loadMoreDetail() {
    if (!detailFormId || !detailCursor) return
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/leadgen/forms/${detailFormId}/leads?limit=25&after=${encodeURIComponent(detailCursor)}`)
      const data = await res.json()
      setDetailLeads((prev) => [...prev, ...(data.leads ?? [])])
      setDetailCursor(data.paging?.cursors?.after ?? null)
    } catch {
      setError(lang === 'tr' ? 'Daha fazla yüklenemedi' : 'Failed to load more')
    } finally {
      setDetailLoading(false)
    }
  }

  const detailFormMeta = allForms.find((f) => f.id === detailFormId)

  return (
    <div>
      {/* Controls row */}
      {status === 'ready' && !detailFormId && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500">
            {lang === 'tr'
              ? `${activeFormIds.length} form bağlı`
              : `${activeFormIds.length} forms connected`}
          </p>
          <div className="flex items-center gap-2">
            {syncMsg && (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                {syncMsg}
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              title={lang === 'tr' ? 'Yenile' : 'Refresh'}
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={openPicker}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Settings2 size={15} />
              {lang === 'tr' ? 'Form Ayarları' : 'Form Settings'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ── State: Loading ── */}
      {status === 'loading' && (
        <div className="flex items-center justify-center gap-2 text-slate-400 py-20">
          <Loader2 size={20} className="animate-spin" />
          {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      )}

      {/* ── State: No Instagram ── */}
      {status === 'no_instagram' && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 mb-4">
            <AlertCircle size={28} className="text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            {lang === 'tr' ? 'Instagram/Facebook Bağlantısı Gerekli' : 'Instagram/Facebook Connection Required'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {lang === 'tr'
              ? 'Lead formlarını görüntülemek için önce Instagram/Facebook hesabınızı bağlamanız gerekiyor. Bu bağlantı Facebook sayfanıza erişim sağlar.'
              : 'You need to connect your Instagram/Facebook account first to view lead forms.'}
          </p>
          <a
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            {lang === 'tr' ? 'Entegrasyonlara Git' : 'Go to Settings'}
          </a>
        </div>
      )}

      {/* ── State: No Forms Selected ── */}
      {status === 'no_forms' && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-4">
            <Settings2 size={28} className="text-brand-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            {lang === 'tr' ? 'Lead Form Seçin' : 'Select Lead Forms'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {lang === 'tr'
              ? 'Dashboard\'da görüntülemek istediğiniz Facebook Lead formlarını seçin. En fazla 5 form seçebilirsiniz.'
              : 'Choose which Facebook Lead forms to display on your dashboard. You can select up to 5 forms.'}
          </p>
          <button
            onClick={openPicker}
            disabled={pickerLoading}
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {pickerLoading ? <Loader2 size={15} className="animate-spin" /> : <Settings2 size={15} />}
            {lang === 'tr' ? 'Form Seç' : 'Select Forms'}
          </button>
        </div>
      )}

      {/* ── State: Ready — Detail View ── */}
      {status === 'ready' && detailFormId && (
        <LeadTable
          formName={detailFormMeta?.name ?? detailFormId}
          leads={detailLeads}
          loading={detailLoading}
          hasMore={!!detailCursor}
          onLoadMore={loadMoreDetail}
          onBack={() => setDetailFormId(null)}
          lang={lang}
        />
      )}

      {/* ── State: Ready — Cards View ── */}
      {status === 'ready' && !detailFormId && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeFormIds.map((formId) => {
            const meta = allForms.find((f) => f.id === formId)
            const leads = formLeads[formId] ?? []
            const newCount = leads.filter((l) => isNew(l.created_time)).length
            const isLoading = formLeadsLoading[formId]

            return (
              <div key={formId}>
                {isLoading && !meta ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-center gap-2 text-slate-400 h-48">
                    <Loader2 size={16} className="animate-spin" />
                    {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                  </div>
                ) : (
                  <FormCard
                    form={meta ?? { id: formId, name: `Form ${formId}`, status: 'ACTIVE', leads_count: 0, locale: '' }}
                    newCount={newCount}
                    previewLeads={leads}
                    onSelect={() => openDetail(formId)}
                    lang={lang}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Form Picker Modal ── */}
      {showPicker && (
        <FormPicker
          forms={pickerForms}
          selected={activeFormIds}
          onSave={saveForms}
          onClose={() => setShowPicker(false)}
          saving={saving}
          lang={lang}
        />
      )}
    </div>
  )
}
