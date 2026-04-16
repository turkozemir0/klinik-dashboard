import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/proposals/[id]/payments/[pid] — Ödeme al
export async function PATCH(request: NextRequest, { params }: { params: { id: string; pid: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase.from('org_users').select('role').eq('user_id', user.id).maybeSingle()
  const { data: superAdmin } = await supabase.from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle()

  const allowedRoles = ['admin', 'yönetici', 'muhasebe']
  if (!superAdmin && (!orgUser || !allowedRoles.includes(orgUser.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const updates: any = {}

  if ('status' in body) updates.status = body.status
  if (body.status === 'paid' && !body.paid_at) updates.paid_at = new Date().toISOString()
  if ('paid_at' in body) updates.paid_at = body.paid_at
  if ('notes' in body) updates.notes = body.notes

  const { error } = await supabase
    .from('payment_schedules')
    .update(updates)
    .eq('id', params.pid)
    .eq('proposal_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
