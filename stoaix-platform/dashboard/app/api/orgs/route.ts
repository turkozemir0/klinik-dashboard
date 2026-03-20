import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!superAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, slug, sector } = await request.json()
  if (!name || !slug || !sector) return NextResponse.json({ error: 'name, slug ve sector zorunlu' }, { status: 400 })

  const normalizedSlug = String(slug).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const trimmedName = String(name).trim()
  const trimmedSector = String(sector).trim()

  if (!trimmedName || !normalizedSlug || !trimmedSector) {
    return NextResponse.json({ error: 'Geçerli name, slug ve sector zorunlu' }, { status: 400 })
  }

  const service = getServiceClient()

  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({ name: trimmedName, slug: normalizedSlug, sector: trimmedSector, status: 'onboarding', onboarding_status: 'not_started' })
    .select('id')
    .single()

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: tokenError } = await service
    .from('invite_tokens')
    .insert({ token, organization_id: org.id, expires_at: expiresAt, is_used: false })

  if (tokenError) return NextResponse.json({ error: tokenError.message }, { status: 500 })

  // data/<slug>/source.config.json lokal geliştirmede manuel oluşturulur;
  // Vercel (read-only FS) ortamında dosya yazımı yapılmaz.

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return NextResponse.json({ org_id: org.id, invite_url: `${baseUrl}/register?token=${token}` })
}
