import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import OpenAI from 'openai'

function getServiceClient() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(_req: NextRequest) {
  // --- Auth: super_admin only ---
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: admin } = await service
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!admin) return NextResponse.json({ error: 'Forbidden — super_admin only' }, { status: 403 })

  // --- Fetch docs without embeddings ---
  const { data: docs, error: fetchErr } = await service
    .from('support_docs')
    .select('id, title, content')
    .is('embedding', null)
    .eq('is_active', true)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!docs || docs.length === 0) {
    return NextResponse.json({ message: 'No docs need embedding', updated: 0 })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  let updated = 0
  const errors: string[] = []

  for (const doc of docs) {
    try {
      const input = `${doc.title}\n\n${doc.content}`
      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
      })

      const embedding = res.data[0].embedding

      const { error: updateErr } = await service
        .from('support_docs')
        .update({ embedding })
        .eq('id', doc.id)

      if (updateErr) {
        errors.push(`${doc.title}: ${updateErr.message}`)
      } else {
        updated++
      }
    } catch (err: any) {
      errors.push(`${doc.title}: ${err.message}`)
    }
  }

  return NextResponse.json({
    message: `Embedding complete: ${updated}/${docs.length} docs updated`,
    updated,
    total: docs.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
