import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkEntitlement, decrementUsage } from '@/lib/entitlements'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getOrgUser(userId: string) {
  const service = getServiceClient()
  const { data } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

// ─── PATCH /api/templates/[id] ────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgUser = await getOrgUser(user.id)
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })
  if (!['admin', 'patron', 'yönetici'].includes(orgUser.role)) {
    return NextResponse.json({ error: 'Yetki yetersiz' }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const service = getServiceClient()

  // Only allow editing draft templates
  const { data: existing } = await service
    .from('message_templates')
    .select('status, organization_id')
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Template bulunamadı' }, { status: 404 })
  if (existing.status !== 'draft') {
    return NextResponse.json({ error: 'Sadece taslak templateler düzenlenebilir' }, { status: 400 })
  }

  const allowedFields: Record<string, any> = {}
  if (body.name !== undefined) {
    if (!/^[a-z0-9_]+$/.test(body.name)) {
      return NextResponse.json({ error: 'Template adı sadece küçük harf, rakam ve alt çizgi içerebilir' }, { status: 400 })
    }
    allowedFields.name = body.name
  }
  if (body.language !== undefined) allowedFields.language = body.language
  if (body.category !== undefined) {
    const validCategories = ['MARKETING', 'UTILITY', 'AUTHENTICATION']
    if (!validCategories.includes(body.category)) {
      return NextResponse.json({ error: 'Geçersiz kategori' }, { status: 400 })
    }
    allowedFields.category = body.category
  }
  if (body.components !== undefined) allowedFields.components = body.components
  allowedFields.updated_at = new Date().toISOString()

  const { data: template, error } = await service
    .from('message_templates')
    .update(allowedFields)
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template })
}

// ─── DELETE /api/templates/[id] ───────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgUser = await getOrgUser(user.id)
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })
  if (!['admin', 'patron'].includes(orgUser.role)) {
    return NextResponse.json({ error: 'Silmek için admin yetkisi gerekli' }, { status: 403 })
  }

  const service = getServiceClient()
  const { error } = await service
    .from('message_templates')
    .delete()
    .eq('id', params.id)
    .eq('organization_id', orgUser.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await decrementUsage(orgUser.organization_id, 'whatsapp_templates')
  return NextResponse.json({ ok: true })
}
