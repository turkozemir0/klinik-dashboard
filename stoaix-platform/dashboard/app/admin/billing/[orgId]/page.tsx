'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient as createSupabase } from '@supabase/supabase-js'

// Not: Bu 'use client' sayfasında Supabase'e direkt ulaşamayız service key ile.
// Veri çekme işlemlerini API route üzerinden yapıyoruz.

const PLAN_LABELS: Record<string, string> = {
  legacy: 'Legacy',
  essential: 'Essential',
  professional: 'Professional',
  business: 'Business',
  custom: 'Custom',
}

const PLAN_BADGE: Record<string, string> = {
  legacy: 'bg-slate-100 text-slate-500',
  essential: 'bg-sky-100 text-sky-700',
  professional: 'bg-violet-100 text-violet-700',
  business: 'bg-orange-100 text-orange-700',
  custom: 'bg-rose-100 text-rose-700',
}

const REASON_LABELS: Record<string, string> = {
  admin_grant: 'Admin İzni',
  admin_revoke: 'Admin Kısıtlama',
  promo: 'Promosyon',
}

const OVERRIDE_BADGE: Record<string, string> = {
  admin_grant: 'bg-green-100 text-green-700',
  admin_revoke: 'bg-red-100 text-red-700',
  promo: 'bg-purple-100 text-purple-700',
}

interface Feature {
  key: string
  module: string
  name: string
  is_boolean: boolean
  usage_metric: string | null
}

interface Override {
  id: string
  feature_key: string
  enabled: boolean
  limit_override: number | null
  reason: string
  expires_at: string | null
  created_at: string
}

interface PlanEntitlement {
  feature_key: string
  enabled: boolean
  limit_value: number | null
}

interface OrgData {
  id: string
  name: string
  slug: string
  sector: string
  status: string
}

interface SubData {
  plan_id: string
  status: string
  stripe_customer_id: string | null
  current_period_end: string | null
  trial_ends_at: string | null
}

const emptyForm = {
  feature_key: '',
  enabled: true,
  limit_override: '',
  reason: 'admin_grant',
  expires_at: '',
}

export default function OrgBillingPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string

  const [org, setOrg] = useState<OrgData | null>(null)
  const [sub, setSub] = useState<SubData | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [overrides, setOverrides] = useState<Override[]>([])
  const [entitlements, setEntitlements] = useState<PlanEntitlement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingOverride, setEditingOverride] = useState<Override | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  // Offer modal state
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerForm, setOfferForm] = useState({ plan_id: 'professional', interval: 'monthly', discount_percent: '' })
  const [offerLoading, setOfferLoading] = useState(false)
  const [offerUrl, setOfferUrl] = useState<string | null>(null)
  const [offerCopied, setOfferCopied] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/billing/${orgId}/detail`)
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Veri alınamadı')
      }
      const data = await res.json()
      setOrg(data.org)
      setSub(data.sub)
      setFeatures(data.features ?? [])
      setOverrides(data.overrides ?? [])
      setEntitlements(data.entitlements ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function openAddModal() {
    setEditingOverride(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  function openEditModal(override: Override) {
    setEditingOverride(override)
    setForm({
      feature_key: override.feature_key,
      enabled: override.enabled as any,
      limit_override: override.limit_override !== null ? String(override.limit_override) : '',
      reason: override.reason ?? 'admin_grant',
      expires_at: override.expires_at ? override.expires_at.slice(0, 10) : '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.feature_key) return
    setSaving(true)
    try {
      const body: any = {
        feature_key: form.feature_key,
        enabled: form.enabled,
        reason: form.reason,
      }
      if (form.limit_override !== '') {
        body.limit_override = Number(form.limit_override)
      }
      if (form.expires_at !== '') {
        body.expires_at = form.expires_at
      }

      const res = await fetch(`/api/admin/billing/${orgId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Kayıt başarısız')
      }

      setShowModal(false)
      await fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleOffer() {
    setOfferLoading(true)
    setOfferUrl(null)
    try {
      const body: any = { plan_id: offerForm.plan_id, interval: offerForm.interval }
      if (offerForm.discount_percent !== '') {
        body.discount_percent = Number(offerForm.discount_percent)
      }
      const res = await fetch(`/api/admin/billing/${orgId}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Link oluşturulamadı')
      setOfferUrl(j.checkout_url)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setOfferLoading(false)
    }
  }

  function copyOfferUrl() {
    if (!offerUrl) return
    navigator.clipboard.writeText(offerUrl).then(() => {
      setOfferCopied(true)
      setTimeout(() => setOfferCopied(false), 2000)
    })
  }

  async function handleDelete(featureKey: string) {
    if (!confirm(`"${featureKey}" override'ını kaldırmak istiyor musunuz?`)) return
    setDeletingKey(featureKey)
    try {
      const res = await fetch(`/api/admin/billing/${orgId}/override`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_key: featureKey }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Silme başarısız')
      }
      await fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeletingKey(null)
    }
  }

  const planId = sub?.plan_id ?? 'legacy'

  // Entitlement map (plan default'ları)
  const entitlementMap: Record<string, PlanEntitlement> = {}
  for (const e of entitlements) {
    entitlementMap[e.feature_key] = e
  }

  // Override map
  const overrideMap: Record<string, Override> = {}
  for (const o of overrides) {
    overrideMap[o.feature_key] = o
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-slate-400 text-sm">Yükleniyor...</div>
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm">
          {error ?? 'Org bulunamadı'}
        </div>
      </div>
    )
  }

  // Modüllere göre grupla
  const modules: Record<string, Feature[]> = {}
  for (const f of features) {
    if (!modules[f.module]) modules[f.module] = []
    modules[f.module].push(f)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/billing')}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Geri
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PLAN_BADGE[planId] ?? 'bg-slate-100 text-slate-500'}`}>
              {PLAN_LABELS[planId] ?? planId}
            </span>
            {sub && (
              <span className="text-xs text-slate-400">
                {sub.status}
                {sub.current_period_end && ` — ${new Date(sub.current_period_end).toLocaleDateString('tr-TR')}'e kadar`}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">{org.slug} · {org.sector}</p>
        </div>
        <div className="flex items-center gap-2">
          {planId === 'legacy' && (
            <button
              onClick={() => { setOfferUrl(null); setOfferForm({ plan_id: 'professional', interval: 'monthly', discount_percent: '' }); setShowOfferModal(true) }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Plan Teklifi Gönder
            </button>
          )}
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Override Ekle
          </button>
        </div>
      </div>

      {/* Stripe Bilgi */}
      {sub?.stripe_customer_id && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs text-slate-500">
          Stripe Customer: <span className="font-mono font-medium text-slate-700">{sub.stripe_customer_id}</span>
        </div>
      )}

      {/* Feature Override Tablosu */}
      <div className="space-y-6">
        {Object.entries(modules).map(([moduleName, moduleFeatures]) => (
          <div key={moduleName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{moduleName}</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-50">
                  <th className="px-5 py-2 text-left font-medium">Özellik</th>
                  <th className="px-4 py-2 text-center font-medium">Plan Default</th>
                  <th className="px-4 py-2 text-center font-medium">Geçerli Override</th>
                  <th className="px-4 py-2 text-center font-medium">Limit</th>
                  <th className="px-4 py-2 text-left font-medium">Bitiş</th>
                  <th className="px-4 py-2 text-center font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {moduleFeatures.map((feature) => {
                  const planDefault = entitlementMap[feature.key]
                  const override = overrideMap[feature.key]

                  return (
                    <tr key={feature.key} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-slate-700">{feature.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{feature.key}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {planDefault ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            planDefault.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {planDefault.enabled
                              ? (planDefault.limit_value !== null ? `✓ (${planDefault.limit_value})` : '✓')
                              : '—'}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {override ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            OVERRIDE_BADGE[override.reason] ?? 'bg-slate-100 text-slate-500'
                          }`}>
                            {override.enabled ? '✓ Aktif' : '✗ Kısıtlı'}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">Override yok</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-slate-500 text-xs">
                          {override?.limit_override !== null && override?.limit_override !== undefined
                            ? override.limit_override
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-400 text-xs">
                          {override?.expires_at
                            ? new Date(override.expires_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : override ? 'Süresiz' : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => override ? openEditModal(override) : (() => {
                              setForm({ ...emptyForm, feature_key: feature.key })
                              setEditingOverride(null)
                              setShowModal(true)
                            })()}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                          >
                            {override ? 'Düzenle' : 'Override'}
                          </button>
                          {override && (
                            <button
                              onClick={() => handleDelete(feature.key)}
                              disabled={deletingKey === feature.key}
                              className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {deletingKey === feature.key ? '...' : 'Kaldır'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        {features.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-10 text-center text-slate-400 text-sm">
            Özellik bulunamadı.
          </div>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Plan Teklifi Oluştur</h2>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Plan</label>
                <select
                  value={offerForm.plan_id}
                  onChange={e => setOfferForm(f => ({ ...f, plan_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="essential">Essential — $79/ay</option>
                  <option value="professional">Professional — $149/ay</option>
                  <option value="business">Business — $299/ay</option>
                  <option value="custom">Custom — Görüşmeli</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ödeme Periyodu</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOfferForm(f => ({ ...f, interval: 'monthly' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      offerForm.interval === 'monthly'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Aylık
                  </button>
                  <button
                    onClick={() => setOfferForm(f => ({ ...f, interval: 'annual' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      offerForm.interval === 'annual'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Yıllık (%20 indirim)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ek İndirim <span className="text-slate-400">(% — boş bırakılabilir)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={offerForm.discount_percent}
                  onChange={e => setOfferForm(f => ({ ...f, discount_percent: e.target.value }))}
                  placeholder="ör: 20"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="mt-1 text-xs text-slate-400">Girilirse Stripe'ta tek kullanımlık bir kupon oluşturulur.</p>
              </div>

              {offerUrl && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-600">Ödeme Linki</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={offerUrl}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 font-mono truncate"
                    />
                    <button
                      onClick={copyOfferUrl}
                      className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors whitespace-nowrap"
                    >
                      {offerCopied ? '✓ Kopyalandı' : 'Kopyala'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Bu link müşteriye iletilecek. 24 saat geçerlidir.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowOfferModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={handleOffer}
                disabled={offerLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {offerLoading ? 'Oluşturuluyor...' : 'Link Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingOverride ? 'Override Düzenle' : 'Override Ekle'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Feature Key */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Özellik</label>
                {editingOverride ? (
                  <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 font-mono border border-slate-200">
                    {form.feature_key}
                  </div>
                ) : (
                  <select
                    value={form.feature_key}
                    onChange={e => setForm(f => ({ ...f, feature_key: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Özellik seçin...</option>
                    {features.map(f => (
                      <option key={f.key} value={f.key}>
                        {f.name} ({f.key})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Enabled Toggle */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Durum</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setForm(f => ({ ...f, enabled: true }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      form.enabled
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, enabled: false }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      !form.enabled
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Kısıtlı
                  </button>
                </div>
              </div>

              {/* Limit Override */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Limit Override <span className="text-slate-400">(boş bırakılırsa planın limiti geçerli)</span>
                </label>
                <input
                  type="number"
                  value={form.limit_override}
                  onChange={e => setForm(f => ({ ...f, limit_override: e.target.value }))}
                  placeholder="ör: 100"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sebep</label>
                <select
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin_grant">Admin İzni</option>
                  <option value="admin_revoke">Admin Kısıtlama</option>
                  <option value="promo">Promosyon</option>
                </select>
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Bitiş Tarihi <span className="text-slate-400">(boş = süresiz)</span>
                </label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.feature_key}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
