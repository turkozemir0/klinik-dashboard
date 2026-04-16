import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/proposals/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('proposals')
    .select('*, payment_schedules(*)')
    .eq('id', params.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })

  return NextResponse.json(data)
}

// PATCH /api/proposals/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  const allowedRoles = ['admin', 'yönetici', 'satisci']
  const { data: superAdmin } = await supabase.from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle()
  if (!superAdmin && (!orgUser || !allowedRoles.includes(orgUser.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const allowed = ['title', 'description', 'total_amount', 'currency', 'status', 'notes', 'sent_at', 'accepted_at', 'signed_at']
  const updates: any = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { error } = await supabase.from('proposals').update(updates).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE /api/proposals/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase.from('org_users').select('role').eq('user_id', user.id).maybeSingle()
  const { data: superAdmin } = await supabase.from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle()

  if (!superAdmin && (!orgUser || !['admin', 'yönetici'].includes(orgUser.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('proposals').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
