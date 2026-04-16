import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/proposals/lead-info?lead_id=xxx
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lead_id = request.nextUrl.searchParams.get('lead_id')
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('leads')
    .select('id, contact:contacts(full_name, phone)')
    .eq('id', lead_id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Lead bulunamadı' }, { status: 404 })

  const contact = (data as any).contact
  return NextResponse.json({
    lead_id: data.id,
    full_name: contact?.full_name ?? null,
    phone: contact?.phone ?? null,
  })
}
