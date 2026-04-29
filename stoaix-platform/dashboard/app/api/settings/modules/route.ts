import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-templates'
import { demoWriteBlock } from '@/lib/demo-guard'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getOrgId(userId: string): Promise<string | null> {
  const service = getServiceClient()
  const { data } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.organization_id ?? null
}

// GET /api/settings/modules — Org'un feature listesi + plan status + user overrides
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const { data: sub } = await service
    .from('org_subscriptions')
    .select('plan_id, status')
    .eq('organization_id', orgId)
    .maybeSingle()

  const planId = sub?.plan_id ?? 'legacy'
  const isLegacy = planId === 'legacy'

  const [{ data: features }, planEntsResult, { data: overrides }] = await Promise.all([
    service.from('features').select('key, module, name, is_boolean').order('module').order('key'),
    isLegacy
      ? Promise.resolve({ data: [] as any[] })
      : service.from('plan_entitlements').select('feature_key, enabled, limit_value').eq('plan_id', planId),
    service
      .from('org_entitlement_overrides')
      .select('feature_key, enabled, reason')
      .eq('organization_id', orgId),
  ])

  const planMap: Record<string, any> = {}
  for (const e of planEntsResult.data ?? []) {
    planMap[e.feature_key] = e
  }

  const overrideMap: Record<string, any> = {}
  for (const o of overrides ?? []) {
    overrideMap[o.feature_key] = o
  }

  const result = (features ?? []).map(f => {
    const planEnt = planMap[f.key]
    const override = overrideMap[f.key]

    const planEnabled = isLegacy ? true : (planEnt?.enabled ?? false)
    const planLimit = isLegacy ? null : (planEnt?.limit_value ?? null)
    const userDisabled = !!(override?.reason === 'user_disabled' && override?.enabled === false)
    const effectiveEnabled = planEnabled && !userDisabled

    return {
      key: f.key,
      module: f.module,
      name: f.name,
      plan_enabled: planEnabled,
      plan_limit: planLimit,
      user_disabled: userDisabled,
      effective_enabled: effectiveEnabled,
    }
  })

  return NextResponse.json(result)
}

// POST /api/settings/modules — Feature toggle (kullanıcı kapat/aç)
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const blocked = demoWriteBlock(orgId)
  if (blocked) return blocked

  const body = await req.json()
  const { feature_key, enabled } = body

  if (!feature_key || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'feature_key ve enabled zorunlu' }, { status: 400 })
  }

  const service = getServiceClient()

  if (!enabled) {
    // Kapat: user_disabled override ekle
    await service.from('org_entitlement_overrides').upsert({
      organization_id: orgId,
      feature_key,
      enabled: false,
      reason: 'user_disabled',
    }, { onConflict: 'organization_id,feature_key' })

    // Bu feature_key'e bağlı workflow'ları otomatik deaktif et
    const relatedTemplateIds = WORKFLOW_TEMPLATES
      .filter(t => t.required_feature === feature_key)
      .map(t => t.id)

    if (relatedTemplateIds.length > 0) {
      await service
        .from('org_workflows')
        .update({ is_active: false })
        .eq('organization_id', orgId)
        .in('template_id', relatedTemplateIds)
    }
  } else {
    // Aç: sadece user_disabled override'ı kaldır (admin override'larını dokunma)
    const { data: existing } = await service
      .from('org_entitlement_overrides')
      .select('reason')
      .eq('organization_id', orgId)
      .eq('feature_key', feature_key)
      .maybeSingle()

    if (existing?.reason === 'user_disabled') {
      await service
        .from('org_entitlement_overrides')
        .delete()
        .eq('organization_id', orgId)
        .eq('feature_key', feature_key)
    }
  }

  return NextResponse.json({ ok: true })
}
