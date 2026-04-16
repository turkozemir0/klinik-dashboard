import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Normalize a phone number to digits-only format for storage/comparison.
 * Only strips non-digit characters — no country-specific logic.
 * Users should enter numbers with full country code (e.g. 4915123456789).
 */
function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

async function getOrgId(userId: string): Promise<string | null> {
  const { data } = await getServiceClient()
    .from('org_users')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.organization_id ?? null
}

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const { data } = await getServiceClient()
    .from('organizations')
    .select('excluded_phones')
    .eq('id', orgId)
    .single()

  return NextResponse.json({ phones: data?.excluded_phones ?? [] })
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const body = await request.json()
  const rawPhones: string[] = body.phones ?? []
  const normalized = rawPhones
    .map((p) => normalizePhone(p))
    .filter((p) => p.length >= 10)

  const { error } = await getServiceClient()
    .from('organizations')
    .update({ excluded_phones: normalized })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ phones: normalized })
}
