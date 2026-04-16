import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/leads/[id]/assign — Lead atama
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser && !superAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const allowedRoles = ['admin', 'yönetici', 'satisci']
  if (orgUser && !superAdmin && !allowedRoles.includes(orgUser.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const { assigned_to, status } = await request.json()

  const updates: any = {}
  if (assigned_to !== undefined) updates.assigned_to = assigned_to || null
  if (status) updates.status = status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'assigned_to veya status gerekli' }, { status: 400 })
  }

  let query = supabase.from('leads').update(updates).eq('id', params.id)
  if (orgUser && !superAdmin) {
    query = query.eq('organization_id', orgUser.organization_id)
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
