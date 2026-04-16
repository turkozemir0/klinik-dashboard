import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/conversations/[id]/takeover — AI'dan insan devralma
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get org membership + role
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

  const service = getServiceClient()

  // Verify conversation belongs to user's org
  const { data: conv } = await service
    .from('conversations')
    .select('id, organization_id, mode')
    .eq('id', params.id)
    .maybeSingle()

  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı' }, { status: 404 })

  if (orgUser && conv.organization_id !== orgUser.organization_id && !superAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await service
    .from('conversations')
    .update({
      mode: 'human',
      taken_over_by: user.id,
      taken_over_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Broadcast notification to all org members
  try {
    await service.from('notifications').insert({
      organization_id: conv.organization_id,
      user_id: null, // broadcast
      type: 'takeover',
      conversation_id: params.id,
      title: 'Konuşma devralındı',
      body: 'Bir temsilci konuşmayı devraldı.',
    })
  } catch (_) {}

  return NextResponse.json({ ok: true, mode: 'human' })
}
