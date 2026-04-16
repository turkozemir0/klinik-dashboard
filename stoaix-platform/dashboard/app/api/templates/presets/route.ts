import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── GET /api/templates/presets?sector=dental ─────────────────────────────────
// Returns preset templates, optionally filtered by sector.
// Also accepts ?purpose=followup for further filtering.

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sector  = searchParams.get('sector')
  const purpose = searchParams.get('purpose')

  const service = getServiceClient()
  let query = service
    .from('message_templates')
    .select('*')
    .eq('is_preset', true)
    .order('sector')
    .order('purpose')

  if (sector)  query = query.eq('sector', sector)
  if (purpose) query = query.eq('purpose', purpose)

  const { data: presets, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ presets })
}
