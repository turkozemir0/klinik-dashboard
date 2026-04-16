import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (body.all && body.org_id) {
    // Verify caller belongs to this org (or is super admin)
    const [{ data: orgUser }, { data: superAdmin }] = await Promise.all([
      supabase.from('org_users').select('organization_id').eq('user_id', user.id).eq('organization_id', body.org_id).maybeSingle(),
      supabase.from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle(),
    ])
    if (!orgUser && !superAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Mark all unread notifications for this user in this org
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('organization_id', body.org_id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .is('read_at', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.ids?.length) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', body.ids)
      .or(`user_id.is.null,user_id.eq.${user.id}`)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'ids veya all gerekli' }, { status: 400 })
}
