import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import Papa from 'papaparse'
import { normalizePhone } from '@/lib/phone-utils'
import { checkEntitlement, incrementUsage } from '@/lib/entitlements'
import { demoWriteBlock } from '@/lib/demo-guard'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const MAX_ROWS = 3500
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const DEDUP_BATCH = 500  // PostgREST URL limit safe
const INSERT_CHUNK = 500 // Supabase bulk insert chunk

// Tags sütunundan source_channel tespit et (GHL export uyumlu)
function detectSource(tagValue: string): string {
  const t = tagValue.toLowerCase()
  if (t.includes('whatsapp')) return 'whatsapp'
  if (t.includes('instagram')) return 'instagram'
  if (t.includes('web')) return 'web'
  if (t) return tagValue.trim()
  return 'import'
}

// POST /api/import — CSV lead import (bulk optimized, GHL uyumlu)
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
  if (orgUser && !superAdmin && !['admin', 'yönetici'].includes(orgUser.role)) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  const orgId = orgUser?.organization_id
  if (!orgId) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 400 })

  const blocked = demoWriteBlock(orgId)
  if (blocked) return blocked

  const ent = await checkEntitlement(orgId, 'leads_import_csv')
  if (!ent.enabled) return NextResponse.json({ error: 'upgrade_required', feature: 'leads_import_csv' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'CSV dosyası gerekli' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Dosya boyutu 10MB sınırını aşıyor' }, { status: 400 })

  const phoneCol      = (formData.get('phone_col') as string)      || 'Phone'
  const firstNameCol  = (formData.get('first_name_col') as string)  || (formData.get('name_col') as string) || 'First Name'
  const lastNameCol   = (formData.get('last_name_col') as string)   || 'Last Name'
  const emailCol      = (formData.get('email_col') as string)       || 'Email'
  const sourceCol     = (formData.get('source_col') as string)      || 'Tags'
  const defaultCC     = (formData.get('default_cc') as string)      || '90'

  const csvText = await file.text()
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })

  if (parsed.errors.length > 0 && !parsed.data.length) {
    return NextResponse.json({ error: 'CSV parse hatası: ' + parsed.errors[0].message }, { status: 400 })
  }

  const allRows = parsed.data as Record<string, string>[]
  const rows = allRows.slice(0, MAX_ROWS)
  const totalRows = rows.length

  const service = getServiceClient()

  // Create import job
  const { data: job, error: jobErr } = await service
    .from('import_jobs')
    .insert({
      organization_id: orgId,
      created_by: user.id,
      status: 'processing',
      total_rows: totalRows,
      source_filename: file.name,
    })
    .select('id')
    .single()

  if (jobErr || !job) return NextResponse.json({ error: 'Job oluşturulamadı' }, { status: 500 })

  // Step 1: Normalize all rows
  type NRow = { phone: string | null; email: string | null; full_name: string; source: string; rowNum: number }
  const normalized: NRow[] = []
  let errorCount = 0
  const errorDetails: { row: number; error: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    const phone = normalizePhone(row[phoneCol] || '', defaultCC)
    const email = (row[emailCol] || '').trim().toLowerCase() || null
    const firstName = (row[firstNameCol] || '').trim()
    const lastName  = lastNameCol ? (row[lastNameCol] || '').trim() : ''
    const full_name = [firstName, lastName].filter(Boolean).join(' ')
    const source = sourceCol && row[sourceCol] ? detectSource(row[sourceCol]) : 'import'

    if (!phone && !email) {
      errorDetails.push({ row: rowNum, error: 'Telefon veya e-posta gerekli' })
      errorCount++
      continue
    }
    normalized.push({ phone, email, full_name, source, rowNum })
  }

  // Step 2: Bulk dedup — batched IN queries (500 per query, PostgREST safe)
  const phones = Array.from(new Set(normalized.filter(r => r.phone).map(r => r.phone as string)))
  const emails = Array.from(new Set(normalized.filter(r => r.email).map(r => r.email as string)))

  const existingPhones = new Set<string>()
  const existingEmails = new Set<string>()

  for (let i = 0; i < phones.length; i += DEDUP_BATCH) {
    const { data } = await service
      .from('contacts')
      .select('phone')
      .eq('organization_id', orgId)
      .in('phone', phones.slice(i, i + DEDUP_BATCH))
    data?.forEach(r => r.phone && existingPhones.add(r.phone))
  }

  for (let i = 0; i < emails.length; i += DEDUP_BATCH) {
    const { data } = await service
      .from('contacts')
      .select('email')
      .eq('organization_id', orgId)
      .in('email', emails.slice(i, i + DEDUP_BATCH))
    data?.forEach(r => r.email && existingEmails.add(r.email))
  }

  // Step 3: Filter out duplicates
  let duplicateCount = 0
  const toInsert = normalized.filter(r => {
    const isDup = (r.phone && existingPhones.has(r.phone)) || (r.email && existingEmails.has(r.email))
    if (isDup) { duplicateCount++; return false }
    return true
  })

  // Step 4: Bulk insert contacts + leads in chunks
  let insertedCount = 0

  for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
    const chunk = toInsert.slice(i, i + INSERT_CHUNK)

    const contactRows = chunk.map(r => ({
      organization_id: orgId,
      full_name: r.full_name || null,
      phone: r.phone || null,
      email: r.email || null,
      source_channel: r.source,
      status: 'new',
    }))

    const { data: inserted, error: contactErr } = await service
      .from('contacts')
      .insert(contactRows)
      .select('id')

    if (contactErr || !inserted?.length) {
      errorCount += chunk.length
      continue
    }

    const leadRows = inserted.map((c, idx) => ({
      organization_id: orgId,
      contact_id: c.id,
      status: 'new',
      qualification_score: 5,
      source_channel: chunk[idx]?.source ?? 'import',
      collected_data: { _bulk_import: true },
    }))

    await service.from('leads').insert(leadRows)
    insertedCount += inserted.length

    await service
      .from('import_jobs')
      .update({ processed_rows: i + inserted.length })
      .eq('id', job.id)
  }

  // Step 5: Complete job
  await service
    .from('import_jobs')
    .update({
      status: errorCount === totalRows ? 'failed' : 'completed',
      processed_rows: totalRows,
      inserted_count: insertedCount,
      duplicate_count: duplicateCount,
      error_count: errorCount,
      completed_at: new Date().toISOString(),
    })
    .eq('id', job.id)

  if (insertedCount > 0) await incrementUsage(orgId, 'leads_import_csv', insertedCount)

  return NextResponse.json({
    ok: true,
    job_id: job.id,
    total_rows: totalRows,
    inserted_count: insertedCount,
    duplicate_count: duplicateCount,
    error_count: errorCount,
    truncated: allRows.length > MAX_ROWS,
  })
}
