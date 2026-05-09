import { NextRequest, NextResponse } from 'next/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkEntitlement } from '@/lib/entitlements'
import { demoWriteBlock } from '@/lib/demo-guard'
import { normalizePhone } from '@/lib/phone-utils'

function getServiceClient() {
  return sbAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const VALID_LANGUAGES = ['tr', 'en', 'ar', 'de', 'ru', 'fr', 'es', 'it', 'pt', 'zh']
const MULTILANG_LANGUAGES = ['ar', 'de', 'ru', 'fr', 'es', 'it', 'pt', 'zh'] // non-TR/EN need entitlement

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contactId = params.id
  if (!contactId || !/^[0-9a-f-]{36}$/i.test(contactId)) {
    return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { preferred_language, full_name, phone: rawPhone, email } = body

  // Validate language value if provided
  if (preferred_language !== undefined && preferred_language !== null && !VALID_LANGUAGES.includes(preferred_language)) {
    return NextResponse.json({ error: 'Invalid language. Valid: ' + VALID_LANGUAGES.join(', ') + ' or null' }, { status: 400 })
  }

  // Normalize phone
  let phone = rawPhone
  if (phone !== undefined && phone !== null && phone !== '') {
    const normalized = normalizePhone(String(phone))
    if (!normalized) {
      return NextResponse.json({ error: 'Telefon numarası tanınamadı. Örnek: 0555 123 4567, +905551234567' }, { status: 400 })
    }
    phone = normalized
  }

  // Validate email if provided
  if (email !== undefined && email !== null && email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Geçersiz e-posta formatı' }, { status: 400 })
  }

  const service = getServiceClient()

  // Get org_id from user's org_users
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!orgUser) {
    return NextResponse.json({ error: 'No organization found' }, { status: 403 })
  }

  // Role guard for name/phone/email edits
  if ((full_name !== undefined || phone !== undefined || email !== undefined)) {
    const editRoles = ['admin', 'yönetici', 'satisci']
    if (!editRoles.includes(orgUser.role)) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }
  }

  const blocked = demoWriteBlock(orgUser.organization_id)
  if (blocked) return blocked

  // Verify contact belongs to this org
  const { data: contact } = await service
    .from('contacts')
    .select('id, organization_id')
    .eq('id', contactId)
    .eq('organization_id', orgUser.organization_id)
    .maybeSingle()

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  // Entitlement guard — non-TR/EN languages require multi_language_voice
  if (preferred_language && MULTILANG_LANGUAGES.includes(preferred_language)) {
    const ent = await checkEntitlement(orgUser.organization_id, 'multi_language_voice')
    if (!ent.enabled) {
      return NextResponse.json(
        { error: 'Multi-language voice not available on your plan' },
        { status: 403 }
      )
    }
  }

  // Build update object
  const updates: any = {}
  if (preferred_language !== undefined) updates.preferred_language = preferred_language
  if (full_name !== undefined) updates.full_name = full_name ? full_name.trim() : full_name
  if (phone !== undefined) updates.phone = phone || null
  if (email !== undefined) updates.email = email ? email.trim() : null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'En az bir alan gerekli' }, { status: 400 })
  }

  // Update contact
  const { error } = await service
    .from('contacts')
    .update(updates)
    .eq('id', contactId)

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
