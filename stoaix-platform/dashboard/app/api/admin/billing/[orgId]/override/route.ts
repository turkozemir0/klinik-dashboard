import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  const service = getServiceClient()
  const { data } = await service
    .from('super_admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

// POST — Feature override ekle / güncelle
export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { feature_key, enabled, limit_override, reason, expires_at } = body

  if (!feature_key) {
    return NextResponse.json({ error: 'feature_key zorunlu' }, { status: 400 })
  }

  // enabled = null ise override kaldır
  if (enabled === null || enabled === undefined) {
    const service = getServiceClient()
    const { error } = await service
      .from('org_entitlement_overrides')
      .delete()
      .eq('organization_id', params.orgId)
      .eq('feature_key', feature_key)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'deleted' })
  }

  const validReasons = ['admin_grant', 'admin_revoke', 'promo']
  if (reason && !validReasons.includes(reason)) {
    return NextResponse.json({ error: 'Geçersiz reason' }, { status: 400 })
  }

  const service = getServiceClient()

  const upsertData: any = {
    organization_id: params.orgId,
    feature_key,
    enabled: Boolean(enabled),
    reason: reason ?? 'admin_grant',
    updated_at: new Date().toISOString(),
  }

  if (limit_override !== undefined && limit_override !== null && limit_override !== '') {
    upsertData.limit_override = Number(limit_override)
  } else {
    upsertData.limit_override = null
  }

  if (expires_at !== undefined && expires_at !== null && expires_at !== '') {
    upsertData.expires_at = expires_at
  } else {
    upsertData.expires_at = null
  }

  const { data, error } = await service
    .from('org_entitlement_overrides')
    .upsert(upsertData, {
      onConflict: 'organization_id,feature_key',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, action: 'upserted', data })
}

// DELETE — Override'ı tamamen kaldır
export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { feature_key } = body

  if (!feature_key) {
    return NextResponse.json({ error: 'feature_key zorunlu' }, { status: 400 })
  }

  const service = getServiceClient()
  const { error } = await service
    .from('org_entitlement_overrides')
    .delete()
    .eq('organization_id', params.orgId)
    .eq('feature_key', feature_key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
