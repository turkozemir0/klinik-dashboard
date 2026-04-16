import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Temporary utility route — subscribe an org's Instagram account to webhook messages
// Usage: POST /api/admin/instagram/subscribe  { "org_id": "..." }

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { org_id } = await req.json()
  if (!org_id) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const supabase = getServiceClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('channel_config')
    .eq('id', org_id)
    .single()

  const creds    = (org?.channel_config as any)?.instagram?.credentials
  const fbPageId = creds?.fb_page_id ?? creds?.page_id   // prefer Facebook Page ID, fallback to page_id
  const token    = creds?.access_token

  if (!fbPageId || !token) {
    return NextResponse.json({ error: 'Missing fb_page_id or access_token in channel_config' }, { status: 400 })
  }

  const url = `https://graph.facebook.com/v19.0/${fbPageId}/subscribed_apps?subscribed_fields=messages&access_token=${token}`
  const res = await fetch(url, { method: 'POST' })
  const data = await res.json()

  return NextResponse.json({ status: res.status, data })
}
