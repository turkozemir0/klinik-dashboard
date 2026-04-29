import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

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

  // Trigger sets moved_by=NULL (system). Override with actual user for manual moves.
  if (status) {
    try {
      const svc = sbAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const orgId = orgUser?.organization_id
      if (orgId) {
        const { data: pipeline } = await svc
          .from('pipelines')
          .select('id')
          .eq('organization_id', orgId)
          .eq('is_default', true)
          .maybeSingle()

        if (pipeline) {
          await svc
            .from('lead_pipeline_stages')
            .update({ moved_by: user.id, moved_at: new Date().toISOString() })
            .eq('lead_id', params.id)
            .eq('pipeline_id', pipeline.id)
        }
      }
    } catch (_) {
      // Non-critical: don't block main response
    }
  }

  return NextResponse.json({ ok: true })
}
