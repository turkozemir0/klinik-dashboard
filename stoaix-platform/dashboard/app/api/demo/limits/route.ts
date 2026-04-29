import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const LIMITS: Record<string, { withRef: number; noRef: number; label_tr: string }> = {
  voice_minutes:    { withRef: 10, noRef: 3,  label_tr: 'Sesli arama' },
  chatbot_messages: { withRef: 30, noRef: 10, label_tr: 'Chat mesajı' },
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if demo org
  const service = sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: orgUser } = await service
    .from('org_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgUser || orgUser.organization_id !== process.env.DEMO_ORG_ID) {
    return NextResponse.json({ error: 'Not a demo account' }, { status: 403 })
  }

  // Get ref from cookie
  const refCode = cookies().get('demo_ref')?.value || '_no_ref'
  const today = new Date().toISOString().slice(0, 10)

  // Fetch all demo_usage rows for today
  const { data: usageRows } = await service
    .from('demo_usage')
    .select('metric, value')
    .eq('ref_code', refCode)
    .eq('date', today)

  const metrics = Object.entries(LIMITS).map(([key, cfg]) => {
    const limit = refCode === '_no_ref' ? cfg.noRef : cfg.withRef
    const used = Number(usageRows?.find(r => r.metric === key)?.value ?? 0)
    return {
      key,
      label: cfg.label_tr,
      limit,
      used,
      remaining: Math.max(0, limit - used),
    }
  })

  return NextResponse.json({ metrics })
}
