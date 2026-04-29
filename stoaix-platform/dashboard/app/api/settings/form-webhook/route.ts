import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { demoWriteBlock } from '@/lib/demo-guard'
import { randomBytes } from 'crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getOrgId(userId: string): Promise<string | null> {
  const { data } = await getServiceClient()
    .from('org_users')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.organization_id ?? null
}

// ─── GET — return current webhook config ─────────────────────────────────────

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const { data } = await getServiceClient()
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  const config = (data?.channel_config as any) ?? {}
  const forms = config.website_forms ?? {}

  return NextResponse.json({
    active: forms.active ?? false,
    api_key: forms.api_key ?? null,
    default_country_code: forms.default_country_code ?? '90',
    field_mapping: forms.field_mapping ?? {},
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.stoaix.com'}/api/public/form-submit`,
  })
}

// ─── POST — create/regenerate API key + update field mapping ────────────────

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const blocked = demoWriteBlock(orgId)
  if (blocked) return blocked

  const body = await request.json()
  const service = getServiceClient()

  // Fetch current channel_config to preserve other keys
  const { data: orgData } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  const existingConfig = (orgData?.channel_config as any) ?? {}
  const existingForms = existingConfig.website_forms ?? {}

  // Generate new API key if requested or if none exists
  const generateNew = body.regenerate_key === true || !existingForms.api_key
  const apiKey = generateNew ? randomBytes(24).toString('hex') : existingForms.api_key

  // Validate field_mapping
  const allowedTargets = new Set(['full_name', 'phone', 'email', 'city', 'country'])
  const fieldMapping: Record<string, string> = {}
  if (body.field_mapping && typeof body.field_mapping === 'object') {
    for (const [formField, target] of Object.entries(body.field_mapping)) {
      if (typeof formField === 'string' && typeof target === 'string' && allowedTargets.has(target)) {
        fieldMapping[formField.slice(0, 100)] = target
      }
    }
  }

  const defaultCC = typeof body.default_country_code === 'string'
    ? body.default_country_code.replace(/\D/g, '').slice(0, 5) || '90'
    : existingForms.default_country_code ?? '90'

  const updatedConfig = {
    ...existingConfig,
    website_forms: {
      active: true,
      api_key: apiKey,
      default_country_code: defaultCC,
      field_mapping: Object.keys(fieldMapping).length > 0 ? fieldMapping : (existingForms.field_mapping ?? {}),
    },
  }

  const { error } = await service
    .from('organizations')
    .update({ channel_config: updatedConfig })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    active: true,
    api_key: apiKey,
    default_country_code: defaultCC,
    field_mapping: updatedConfig.website_forms.field_mapping,
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.stoaix.com'}/api/public/form-submit`,
    key_regenerated: generateNew,
  })
}

// ─── DELETE — deactivate webhook ─────────────────────────────────────────────

export async function DELETE() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const blocked = demoWriteBlock(orgId)
  if (blocked) return blocked

  const service = getServiceClient()

  const { data: orgData } = await service
    .from('organizations')
    .select('channel_config')
    .eq('id', orgId)
    .single()

  const existingConfig = (orgData?.channel_config as any) ?? {}

  const updatedConfig = {
    ...existingConfig,
    website_forms: {
      ...existingConfig.website_forms,
      active: false,
    },
  }

  const { error } = await service
    .from('organizations')
    .update({ channel_config: updatedConfig })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ active: false })
}
