import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// DELETE /api/instagram/disconnect
// Removes Instagram credentials from org's channel_config
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const orgId = orgUser?.organization_id
  if (!orgId) return NextResponse.json({ error: 'org_id bulunamadı' }, { status: 400 })

  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  if (!org) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 404 })

  const channelConfig = (org.channel_config ?? {}) as Record<string, unknown>

  const { error } = await service
    .from('organizations')
    .update({ channel_config: { ...channelConfig, instagram: { active: false } } })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
