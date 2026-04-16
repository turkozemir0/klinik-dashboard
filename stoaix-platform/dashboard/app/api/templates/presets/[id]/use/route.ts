import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── POST /api/templates/presets/[id]/use ─────────────────────────────────────
// Copies a preset template to the org's template list (status: draft).
// Body: { name_override?: string }  — optionally rename the copy

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()

  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!orgUser) return NextResponse.json({ error: 'Org bulunamadı' }, { status: 403 })
  if (!['admin', 'patron', 'yönetici'].includes(orgUser.role)) {
    return NextResponse.json({ error: 'Yetki yetersiz' }, { status: 403 })
  }

  // Fetch the preset
  const { data: preset } = await service
    .from('message_templates')
    .select('*')
    .eq('id', params.id)
    .eq('is_preset', true)
    .single()

  if (!preset) return NextResponse.json({ error: 'Preset bulunamadı' }, { status: 404 })

  let body: any = {}
  try { body = await req.json() } catch {}

  // Use name_override or generate a unique name based on preset name
  let name = body.name_override ?? preset.name
  // Remove sector prefix if present, add org-specific suffix
  // e.g. dental_followup_v1 → followup_v1 (cleaner for the org)
  name = name.replace(/^(dental|hair|aesthetics|general)_/, '')

  // Check if name already exists for this org, append _2, _3 etc if so
  const { data: existing } = await service
    .from('message_templates')
    .select('name')
    .eq('organization_id', orgUser.organization_id)
    .like('name', `${name}%`)

  if (existing && existing.length > 0) {
    name = `${name}_${existing.length + 1}`
  }

  const { data: template, error } = await service
    .from('message_templates')
    .insert({
      organization_id: orgUser.organization_id,
      name,
      language:   preset.language,
      category:   preset.category,
      components: preset.components,
      status:     'draft',
      is_preset:  false,
      sector:     preset.sector,
      purpose:    preset.purpose,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Bu isimde bir template zaten var' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ template }, { status: 201 })
}
