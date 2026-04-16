import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/proposals/[id]/payments
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('proposal_id', params.id)
    .order('due_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/proposals/[id]/payments — Taksit ekle
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase.from('org_users').select('organization_id, role').eq('user_id', user.id).maybeSingle()
  const { data: superAdmin } = await supabase.from('super_admin_users').select('id').eq('user_id', user.id).maybeSingle()

  const allowedRoles = ['admin', 'yönetici', 'muhasebe']
  if (!superAdmin && (!orgUser || !allowedRoles.includes(orgUser.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { amount, due_date, notes } = await request.json()
  if (!amount || !due_date) return NextResponse.json({ error: 'amount ve due_date zorunlu' }, { status: 400 })

  // Get organization_id from proposal
  const { data: proposal } = await supabase.from('proposals').select('organization_id').eq('id', params.id).maybeSingle()
  if (!proposal) return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })

  const { data, error } = await supabase
    .from('payment_schedules')
    .insert({
      organization_id: proposal.organization_id,
      proposal_id: params.id,
      amount: parseFloat(amount),
      due_date,
      notes: notes || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}
