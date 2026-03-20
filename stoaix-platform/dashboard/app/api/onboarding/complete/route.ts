import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  const orgId = orgUser.organization_id

  const { data: org, error } = await service
    .from('organizations')
    .update({ status: 'active', onboarding_status: 'completed' })
    .eq('id', orgId)
    .select('name')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Playbook yoksa minimal bir kayıt oluştur
  const { data: existing } = await service
    .from('agent_playbooks')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!existing) {
    await service.from('agent_playbooks').insert({
      organization_id: orgId,
      name: org?.name ?? 'AI Asistan',
      channel: 'voice',
      system_prompt_template: '',
      hard_blocks: [],
      routing_rules: [],
      is_active: true,
    })
  }

  return NextResponse.json({ ok: true })
}
