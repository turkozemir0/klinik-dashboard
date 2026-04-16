import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// DELETE /api/calendar/disconnect
// Removes Google Calendar tokens from channel_config.calendar
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgUser) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

  const { data: org } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgUser.organization_id)
    .single()

  const channelConfig = (org?.channel_config ?? {}) as Record<string, unknown>

  // Remove calendar entirely from channel_config
  const { calendar: _removed, ...rest } = channelConfig as any

  const { error } = await service
    .from('organizations')
    .update({ channel_config: rest })
    .eq('id', orgUser.organization_id)

  if (error) {
    console.error('[calendar/disconnect] db update failed:', error)
    return NextResponse.json({ error: 'Kayıt hatası' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
