import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const server = createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve org_id
  const { data: orgUser } = await server
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const sb = getServiceClient()
  const { data: org } = await sb
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const capiConfig = org?.channel_config?.meta_capi || null

  return NextResponse.json({
    connected: capiConfig?.active === true,
    pixel_id: capiConfig?.pixel_id || null,
    setup_method: capiConfig?.setup_method || null,
    connected_at: capiConfig?.connected_at || null,
  })
}
