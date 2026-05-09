import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { demoWriteBlock } from '@/lib/demo-guard'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leadId = params.id
  if (!leadId || !/^[0-9a-f-]{36}$/i.test(leadId)) {
    return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 })
  }

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser) return NextResponse.json({ error: 'No organization found' }, { status: 403 })

  const allowedRoles = ['admin', 'yönetici', 'satisci']
  if (!allowedRoles.includes(orgUser.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const blocked = demoWriteBlock(orgUser.organization_id)
  if (blocked) return blocked

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { notes, collected_data, qualification_score } = body

  // At least one field required
  if (notes === undefined && collected_data === undefined && qualification_score === undefined) {
    return NextResponse.json({ error: 'En az bir alan gerekli: notes, collected_data, qualification_score' }, { status: 400 })
  }

  const service = getServiceClient()

  // Verify lead belongs to this org
  const { data: lead } = await service
    .from('leads')
    .select('id, organization_id, assigned_to')
    .eq('id', leadId)
    .eq('organization_id', orgUser.organization_id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead bulunamadı' }, { status: 404 })

  // satisci can only edit their own assigned leads
  if (orgUser.role === 'satisci' && lead.assigned_to !== user.id) {
    return NextResponse.json({ error: 'Sadece size atanmış lead\'leri düzenleyebilirsiniz' }, { status: 403 })
  }

  // Build update
  const updates: any = {}
  if (notes !== undefined) updates.notes = notes
  if (collected_data !== undefined) {
    if (typeof collected_data !== 'object' || Array.isArray(collected_data)) {
      return NextResponse.json({ error: 'collected_data bir obje olmalı' }, { status: 400 })
    }
    updates.collected_data = collected_data
  }
  if (qualification_score !== undefined) {
    const score = Number(qualification_score)
    if (isNaN(score) || score < 0 || score > 100) {
      return NextResponse.json({ error: 'qualification_score 0-100 arası olmalı' }, { status: 400 })
    }
    updates.qualification_score = score
  }

  const { error } = await service
    .from('leads')
    .update(updates)
    .eq('id', leadId)

  if (error) {
    return NextResponse.json({ error: 'Güncelleme başarısız: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
