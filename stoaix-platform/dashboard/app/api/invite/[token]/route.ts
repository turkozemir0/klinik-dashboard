import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Service client without cookie dependency — GET route için yeterli
function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const { token } = params

  const service = getServiceClient()

  const { data: tokenRow, error: tokenErr } = await service
    .from('invite_tokens')
    .select('id, organization_id, is_used, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (tokenErr) return NextResponse.json({ error: `DB hatası: ${tokenErr.message}` }, { status: 500 })
  if (!tokenRow) return NextResponse.json({ error: 'Token bulunamadı' }, { status: 404 })
  if (tokenRow.is_used) return NextResponse.json({ error: 'Bu davet linki daha önce kullanılmış' }, { status: 400 })
  if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ error: 'Davet linkinin süresi dolmuş' }, { status: 400 })

  const { data: org, error: orgErr } = await service
    .from('organizations')
    .select('name, sector')
    .eq('id', tokenRow.organization_id)
    .maybeSingle()

  if (orgErr || !org) return NextResponse.json({ error: 'Organizasyon bulunamadı' }, { status: 404 })

  return NextResponse.json({ org_name: org.name, sector: org.sector })
}
