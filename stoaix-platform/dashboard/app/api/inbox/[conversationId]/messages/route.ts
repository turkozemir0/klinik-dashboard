import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  if (!UUID_RE.test(params.conversationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Fetch conversation to verify org access
  const { data: conv } = await service
    .from('conversations')
    .select('id, organization_id')
    .eq('id', params.conversationId)
    .maybeSingle()
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check access: org_user or super_admin
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (orgUser && orgUser.organization_id !== conv.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!orgUser) {
    const { data: sa } = await service
      .from('super_admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!sa) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: messages, error } = await service
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: messages ?? [] })
}
