import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — rıza durumunu kontrol et (zorunlu consent'ler verilmiş mi?)
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: records } = await service
    .from('consent_records')
    .select('consent_type, version, accepted_at')
    .eq('user_id', user.id)
    .order('accepted_at', { ascending: false })

  const types = records?.map(r => r.consent_type) ?? []
  const hasPrivacy = types.includes('privacy_policy')
  const hasDataProcessing = types.includes('data_processing')

  return NextResponse.json({
    consented: hasPrivacy && hasDataProcessing,
    records: records ?? [],
  })
}

// POST — rıza kaydet
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { privacy_policy, data_processing, marketing } = body

  if (!privacy_policy || !data_processing) {
    return NextResponse.json({ error: 'Zorunlu rızalar eksik' }, { status: 400 })
  }

  // Org ID al
  const { data: orgUser } = await supabase
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? null
  const ua = req.headers.get('user-agent') ?? null
  const version = '2026-04-15'
  const org_id = orgUser?.organization_id ?? null

  const service = getServiceClient()
  const toInsert = [
    { user_id: user.id, org_id, consent_type: 'privacy_policy', version, ip_address: ip, user_agent: ua },
    { user_id: user.id, org_id, consent_type: 'data_processing', version, ip_address: ip, user_agent: ua },
  ]
  if (marketing) {
    toInsert.push({ user_id: user.id, org_id, consent_type: 'marketing', version, ip_address: ip, user_agent: ua })
  }

  const { error } = await service.from('consent_records').insert(toInsert)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
