import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { demoWriteBlock } from '@/lib/demo-guard'
import { normalizePhone } from '@/lib/phone-utils'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const { full_name, phone: rawPhone, email, source_channel, status, notes, assigned_to } = body

  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    return NextResponse.json({ error: 'full_name zorunlu' }, { status: 400 })
  }

  // Normalize phone
  let phone = ''
  if (rawPhone) {
    const normalized = normalizePhone(String(rawPhone))
    if (!normalized) {
      return NextResponse.json({ error: 'Telefon numarası tanınamadı. Örnek formatlar: 0555 123 4567, +905551234567' }, { status: 400 })
    }
    phone = normalized
  }

  // Email basic validation (optional)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Geçersiz e-posta formatı' }, { status: 400 })
  }

  const service = getServiceClient()
  const orgId = orgUser.organization_id

  // Dedup: if phone provided, look for existing contact in same org
  let contactId: string | null = null
  let isExistingContact = false

  if (phone) {
    const { data: existing } = await service
      .from('contacts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('phone', phone)
      .maybeSingle()

    if (existing) {
      contactId = existing.id
      isExistingContact = true
      // Update name/email if provided
      const updates: any = {}
      if (full_name) updates.full_name = full_name.trim()
      if (email) updates.email = email.trim()
      if (Object.keys(updates).length > 0) {
        await service.from('contacts').update(updates).eq('id', contactId)
      }
    }
  }

  // Create new contact if not found
  if (!contactId) {
    const { data: newContact, error: contactErr } = await service
      .from('contacts')
      .insert({
        organization_id: orgId,
        full_name: full_name.trim(),
        phone: phone || null,
        email: email ? email.trim() : null,
        source_channel: source_channel || 'manual',
        status: 'new',
      })
      .select('id')
      .single()

    if (contactErr) {
      return NextResponse.json({ error: 'Contact oluşturulamadı: ' + contactErr.message }, { status: 500 })
    }
    contactId = newContact.id
  }

  // Create lead
  const leadStatus = status || 'new'
  const { data: newLead, error: leadErr } = await service
    .from('leads')
    .insert({
      organization_id: orgId,
      contact_id: contactId,
      source_channel: source_channel || 'manual',
      status: leadStatus,
      qualification_score: 0,
      collected_data: {},
      notes: notes || null,
      assigned_to: assigned_to || null,
    })
    .select('id')
    .single()

  if (leadErr) {
    return NextResponse.json({ error: 'Lead oluşturulamadı: ' + leadErr.message }, { status: 500 })
  }

  // Assign to default pipeline
  try {
    const { data: pipeline } = await service
      .from('pipelines')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_default', true)
      .maybeSingle()

    if (pipeline) {
      const { data: stage } = await service
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', pipeline.id)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (stage) {
        await service.from('lead_pipeline_stages').insert({
          lead_id: newLead.id,
          pipeline_id: pipeline.id,
          stage_id: stage.id,
          moved_by: user.id,
        })
      }
    }
  } catch (_) {
    // Non-critical
  }

  return NextResponse.json({
    lead_id: newLead.id,
    contact_id: contactId,
    is_existing_contact: isExistingContact,
  }, { status: 201 })
}
