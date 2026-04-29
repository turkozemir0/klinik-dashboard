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

// GET — org detail (crm_config, channel_config dahil)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = getServiceClient()
  const { data: org, error } = await service
    .from('organizations')
    .select('id, name, slug, sector, status, phone, email, city, channel_config, crm_config, working_hours, default_language, timezone, created_at')
    .eq('id', params.id)
    .single()

  if (error || !org) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  // Plan bilgisini ekle (voice language tier check için)
  const { data: sub } = await service
    .from('org_subscriptions')
    .select('plan_id, status')
    .eq('organization_id', params.id)
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ ...org, _plan: sub?.plan_id ?? 'legacy' })
}

// PATCH — channel_config ve/veya crm_config güncelle
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { channel_config, crm_config, status, default_language, timezone } = body

  const updates: Record<string, unknown> = {}
  if (channel_config !== undefined) updates.channel_config = channel_config
  if (crm_config !== undefined) updates.crm_config = crm_config
  if (status !== undefined) updates.status = status
  if (default_language !== undefined) updates.default_language = default_language
  if (timezone !== undefined) updates.timezone = timezone

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }

  const service = getServiceClient()
  const { error } = await service
    .from('organizations')
    .update(updates)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — organizasyonu ve ilişkili tüm kayıtları sil
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orgId = params.id
  const service = getServiceClient()

  // Org var mı kontrol et
  const { data: org } = await service.from('organizations').select('id').eq('id', orgId).maybeSingle()
  if (!org) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  // Konuşma id'lerini al (messages için gerekli)
  const { data: convRows } = await service.from('conversations').select('id').eq('organization_id', orgId)
  const convIds = (convRows ?? []).map(r => r.id)

  // Lead id'lerini al (follow_up_tasks, handoff_logs için)
  const { data: leadRows } = await service.from('leads').select('id').eq('organization_id', orgId)
  const leadIds = (leadRows ?? []).map(r => r.id)

  // Workflow id'lerini al (workflow_runs için)
  const { data: wfRows } = await service.from('org_workflows').select('id').eq('organization_id', orgId)
  const wfIds = (wfRows ?? []).map(r => r.id)

  // Silme sırası: bağımlı tablolardan başla
  if (convIds.length > 0) {
    await service.from('messages').delete().in('conversation_id', convIds)
  }
  if (leadIds.length > 0) {
    await service.from('handoff_logs').delete().in('lead_id', leadIds)
    await service.from('follow_up_tasks').delete().in('lead_id', leadIds)
  }
  if (wfIds.length > 0) {
    await service.from('workflow_runs').delete().in('workflow_id', wfIds)
  }

  // Direkt organization_id'li tablolar
  const directTables = [
    'satisfaction_surveys',
    'appointments',
    'call_queue',
    'org_workflows',
    'crm_sync_logs',
    'voice_calls',
    'conversations',
    'leads',
    'contacts',
    'knowledge_items',
    'intake_schemas',
    'agent_playbooks',
    'billing_events',
    'billing_subscriptions',
    'usage_records',
    'org_users',
    'invite_tokens',
  ]

  for (const table of directTables) {
    const { error } = await service.from(table as any).delete().eq('organization_id', orgId)
    if (error && !error.message.includes('does not exist')) {
      console.error(`[DELETE org] ${table} hatası:`, error.message)
    }
  }

  // Son olarak organizasyonu sil
  const { error: orgError } = await service.from('organizations').delete().eq('id', orgId)
  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
