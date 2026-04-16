import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'

// POST /api/proposals — Yeni teklif oluştur
export async function POST(request: NextRequest) {
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

  const orgId = orgUser?.organization_id ?? null
  if (orgId) {
    const ent = await checkEntitlement(orgId, 'proposals_manage')
    if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'proposals_manage' }, { status: 403 })
  }

  const allowedRoles = ['admin', 'yönetici', 'satisci']
  if (orgUser && !superAdmin && !allowedRoles.includes(orgUser.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, total_amount, currency, status, notes, payments } = body
  let { lead_id, client_name, client_phone } = body

  if (!title) {
    return NextResponse.json({ error: 'title zorunlu' }, { status: 400 })
  }

  // lead_id yoksa yeni contact + lead oluştur
  if (!lead_id && orgId) {
    const phone = client_phone?.trim() || null
    const name = client_name?.trim() || null

    const { data: newContact, error: contactErr } = await supabase
      .from('contacts')
      .insert({
        organization_id: orgId,
        full_name: name,
        phone: phone,
        status: 'new',
        source_channel: 'manual',
      })
      .select('id')
      .single()

    if (contactErr) return NextResponse.json({ error: contactErr.message }, { status: 500 })

    const { data: newLead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        organization_id: orgId,
        contact_id: newContact.id,
        status: 'new',
        source_channel: 'voice',
      })
      .select('id')
      .single()

    if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 })

    lead_id = newLead.id
  }

  if (!lead_id) {
    return NextResponse.json({ error: 'lead_id zorunlu veya müşteri bilgisi eksik' }, { status: 400 })
  }

  // Lead'in org'a ait olduğunu doğrula + isim değiştiyse contacts güncelle
  if (orgId) {
    const { data: lead } = await supabase
      .from('leads')
      .select('organization_id, contact_id')
      .eq('id', lead_id)
      .maybeSingle()

    if (!lead || lead.organization_id !== orgId) {
      return NextResponse.json({ error: 'Lead bulunamadı' }, { status: 404 })
    }

    if (client_name?.trim() && lead.contact_id) {
      await supabase
        .from('contacts')
        .update({ full_name: client_name.trim() })
        .eq('id', lead.contact_id)
        .eq('organization_id', orgId)
    }
  }

  const { data: proposal, error } = await supabase
    .from('proposals')
    .insert({
      organization_id: orgId,
      lead_id,
      created_by: user.id,
      title: title.trim(),
      description: description || null,
      total_amount: parseFloat(total_amount) || 0,
      currency: currency || 'TRY',
      status: status || 'draft',
      notes: notes || null,
      client_name: client_name?.trim() || null,
      client_phone: client_phone?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ödeme takvimi
  if (payments?.length && proposal?.id) {
    const paymentRows = payments.map((p: any) => ({
      organization_id: orgId,
      proposal_id: proposal.id,
      amount: parseFloat(p.amount),
      due_date: p.due_date,
      notes: p.notes || null,
    }))
    await supabase.from('payment_schedules').insert(paymentRows)
  }

  return NextResponse.json({ ok: true, id: proposal.id }, { status: 201 })
}
