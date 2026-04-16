import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/conversations/[id]/release — İnsan'dan AI'a geri bırakma
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
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

  const service = getServiceClient()

  const { data: conv } = await service
    .from('conversations')
    .select('id, organization_id, mode, taken_over_by')
    .eq('id', params.id)
    .maybeSingle()

  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı' }, { status: 404 })

  if (orgUser && conv.organization_id !== orgUser.organization_id && !superAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only the person who took over, or admin/patron, can release
  const canRelease =
    superAdmin ||
    conv.taken_over_by === user.id ||
    ['admin', 'yönetici'].includes(orgUser?.role ?? '')

  if (!canRelease) {
    return NextResponse.json({ error: 'Sadece devralan kişi veya admin bırakabilir' }, { status: 403 })
  }

  const { error } = await service
    .from('conversations')
    .update({
      mode: 'ai',
      taken_over_by: null,
      taken_over_at: null,
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, mode: 'ai' })
}
