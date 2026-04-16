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

// POST /api/admin/orgs/[id]/invite — Mevcut org'a ek kullanıcı davet et (super_admin only)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!superAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { role, note } = await request.json()
  const validRoles = ['admin', 'viewer', 'yönetici', 'satisci', 'muhasebe']
  if (!role || !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Geçerli bir rol seçin' }, { status: 400 })
  }

  const service = getServiceClient()

  // Verify org exists
  const { data: org, error: orgErr } = await service
    .from('organizations')
    .select('id, name')
    .eq('id', params.id)
    .maybeSingle()

  if (orgErr || !org) return NextResponse.json({ error: 'Organizasyon bulunamadı' }, { status: 404 })

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: tokenError } = await service
    .from('invite_tokens')
    .insert({
      token,
      organization_id: params.id,
      expires_at: expiresAt,
      is_used: false,
      role,
      note: note || null,
      created_by: user.id,
    })

  if (tokenError) return NextResponse.json({ error: tokenError.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return NextResponse.json({ invite_url: `${baseUrl}/register?token=${token}`, role })
}
