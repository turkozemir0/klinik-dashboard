import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function DELETE(req: NextRequest) {
  const server = createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await server
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser || !['admin', 'patron', 'yönetici'].includes(orgUser.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orgId = orgUser.organization_id
  const sb = getServiceClient()

  const { data: org } = await sb
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  const existingConfig = org?.channel_config || {}
  const updatedConfig = {
    ...existingConfig,
    meta_capi: {
      ...(existingConfig.meta_capi || {}),
      active: false,
    },
  }

  const { error } = await sb
    .from('organizations')
    .update({ channel_config: updatedConfig })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  return NextResponse.json({ success: true })
}
