import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_LANGUAGES = ['tr', 'de', 'en', 'ar', 'fr', 'es', 'ru', 'nl']
const TIMEZONE_RE = /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/

async function getOrgUser(userId: string) {
  const service = getServiceClient()
  const { data } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

// GET /api/settings/general — org default_language + timezone
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgUser = await getOrgUser(user.id)
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  const service = getServiceClient()
  const { data: org, error } = await service
    .from('organizations')
    .select('default_language, timezone')
    .eq('id', orgUser.organization_id)
    .single()

  if (error || !org) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  return NextResponse.json({
    default_language: org.default_language,
    timezone: org.timezone,
  })
}

// PATCH /api/settings/general — update org default_language + timezone
export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgUser = await getOrgUser(user.id)
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })

  // Only admin/yönetici can update
  if (!['admin', 'yönetici'].includes(orgUser.role)) {
    return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
  }

  const body = await req.json()
  const updates: Record<string, string> = {}

  if (body.default_language !== undefined) {
    if (!VALID_LANGUAGES.includes(body.default_language)) {
      return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 })
    }
    updates.default_language = body.default_language
  }

  if (body.timezone !== undefined) {
    if (typeof body.timezone !== 'string' || !TIMEZONE_RE.test(body.timezone)) {
      return NextResponse.json({ error: 'Geçersiz saat dilimi' }, { status: 400 })
    }
    updates.timezone = body.timezone
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }

  const service = getServiceClient()
  const { error } = await service
    .from('organizations')
    .update(updates)
    .eq('id', orgUser.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
