import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function resolveOrgId(req: NextRequest): Promise<string | null> {
  const server = createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return null

  const { data: sa } = await server
    .from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle()
  if (sa) {
    const orgId = req.nextUrl.searchParams.get('org_id')
    if (orgId) return orgId
    const { data: firstOrg } = await server
      .from('organizations').select('id').eq('status', 'active')
      .order('created_at', { ascending: true }).limit(1).maybeSingle()
    return firstOrg?.id ?? null
  }

  const { data: ou } = await server
    .from('org_users').select('organization_id').eq('user_id', user.id).maybeSingle()
  return ou?.organization_id ?? null
}

// GET — manuel görevleri listele
export async function GET(req: NextRequest) {
  const orgId = await resolveOrgId(req)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ent = await checkEntitlement(orgId, 'followup_manual')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'followup_manual' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') // 'pending' | 'done' | null (hepsi)

  const sb = getServiceClient()
  let query = sb
    .from('follow_up_tasks')
    .select(`
      id, task_type, scheduled_at, status, variables, created_at, channel,
      contact:contacts(id, full_name, phone)
    `)
    .eq('organization_id', orgId)
    .eq('task_type', 'sales_notify')
    .order('scheduled_at', { ascending: true })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

// POST — yeni manuel görev oluştur
export async function POST(req: NextRequest) {
  const orgId = await resolveOrgId(req)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ent = await checkEntitlement(orgId, 'followup_manual')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'followup_manual' }, { status: 403 })

  const body = await req.json()
  const { note, action_type, scheduled_at, contact_name, contact_phone, contact_id, lead_id } = body as {
    note:           string
    action_type:    'call' | 'whatsapp' | 'offer' | 'other'
    scheduled_at:   string
    contact_name?:  string
    contact_phone?: string
    contact_id?:    string
    lead_id?:       string
  }

  if (!note?.trim())     return NextResponse.json({ error: 'note zorunlu' }, { status: 400 })
  if (!scheduled_at)     return NextResponse.json({ error: 'scheduled_at zorunlu' }, { status: 400 })
  if (!action_type)      return NextResponse.json({ error: 'action_type zorunlu' }, { status: 400 })

  const sb = getServiceClient()
  const { data, error } = await sb
    .from('follow_up_tasks')
    .insert({
      organization_id: orgId,
      task_type:       'sales_notify',
      channel:         'manual',
      status:          'pending',
      scheduled_at,
      contact_id:      contact_id ?? null,
      lead_id:         lead_id    ?? null,
      variables: {
        note: note.trim(),
        action_type,
        ...(contact_name  ? { contact_name }  : {}),
        ...(contact_phone ? { contact_phone } : {}),
      },
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
