import { createClient as createSupabase } from '@supabase/supabase-js'
import Link from 'next/link'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const PLAN_PRICES: Record<string, number> = {
  lite: 79,
  plus: 149,
  advanced: 299,
  agency: 499,
  legacy: 0,
}

const PLAN_LABELS: Record<string, string> = {
  legacy: 'Legacy',
  lite: 'Lite',
  plus: 'Plus',
  advanced: 'Advanced',
  agency: 'Agency',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
  grace_period: 'bg-orange-100 text-orange-700',
  legacy: 'bg-slate-100 text-slate-500',
  canceled: 'bg-slate-100 text-slate-500',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  trialing: 'Trial',
  past_due: 'Gecikmiş',
  suspended: 'Askıya Alındı',
  grace_period: 'Tolerans',
  legacy: 'Legacy',
  canceled: 'İptal',
}

export default async function AdminBillingPage() {
  const service = getServiceClient()

  const { data: orgs } = await service
    .from('organizations')
    .select('id, name, slug, sector, status')
    .order('name', { ascending: true })

  const { data: subs } = await service
    .from('org_subscriptions')
    .select('organization_id, plan_id, status, stripe_customer_id, current_period_end, trial_ends_at')

  const subsByOrg: Record<string, any> = {}
  for (const sub of subs ?? []) {
    subsByOrg[sub.organization_id] = sub
  }

  // Metric hesapları
  const totalOrgs = orgs?.length ?? 0

  let mrr = 0
  let trialCount = 0
  let legacyCount = 0

  for (const org of orgs ?? []) {
    const sub = subsByOrg[org.id]
    const planId = sub?.plan_id ?? 'legacy'
    const subStatus = sub?.status ?? 'legacy'

    if (subStatus === 'active') {
      mrr += PLAN_PRICES[planId] ?? 0
    }
    if (subStatus === 'trialing') trialCount++
    if (planId === 'legacy' || subStatus === 'legacy') legacyCount++
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Organizasyon abonelik ve plan yönetimi</p>
      </div>

      {/* Metric Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Toplam Org</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalOrgs}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Aylık Gelir (MRR)</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            ₺{mrr.toLocaleString('tr-TR')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Trial Org</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{trialCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Legacy Org</p>
          <p className="text-3xl font-bold text-slate-500 mt-1">{legacyCount}</p>
        </div>
      </div>

      {/* Org Tablosu */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Organizasyonlar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Org Adı</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Durum</th>
                <th className="px-4 py-3 text-right font-medium">MRR Katkısı</th>
                <th className="px-4 py-3 text-left font-medium">Trial Bitiş</th>
                <th className="px-4 py-3 text-center font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(orgs ?? []).map((org) => {
                const sub = subsByOrg[org.id]
                const planId = sub?.plan_id ?? 'legacy'
                const subStatus = sub?.status ?? 'legacy'
                const mrrKontribu = subStatus === 'active' ? (PLAN_PRICES[planId] ?? 0) : 0
                const trialEnds = sub?.trial_ends_at
                  ? new Date(sub.trial_ends_at).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'

                const badgeClass = STATUS_BADGE[subStatus] ?? 'bg-slate-100 text-slate-500'
                const statusLabel = STATUS_LABELS[subStatus] ?? subStatus

                return (
                  <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{org.name}</p>
                        <p className="text-xs text-slate-400">{org.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-700 font-medium">
                        {PLAN_LABELS[planId] ?? planId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={mrrKontribu > 0 ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                        {mrrKontribu > 0 ? `₺${mrrKontribu}` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{trialEnds}</td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/billing/${org.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        Yönet
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {(orgs?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Henüz organizasyon yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
