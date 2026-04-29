import { createServerClient } from '@supabase/ssr'
import { createClient as sbAdmin } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const email = process.env.DEMO_USER_EMAIL
  const password = process.env.DEMO_USER_PASSWORD
  const demoOrgId = process.env.DEMO_ORG_ID

  if (!email || !password || !demoOrgId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Create Supabase SSR client (sets auth cookies on response)
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  // Sign out any existing session first
  await supabase.auth.signOut()

  // Sign in as demo user
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('[demo-session] sign-in error:', error.message)
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Log visit (service client)
  try {
    const service = sbAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
    const ua = req.headers.get('user-agent')?.slice(0, 255) || ''

    await service.from('demo_visits').insert({
      ref_code: ref,
      ip_hash: ipHash,
      user_agent: ua,
    })
  } catch (e) {
    console.error('[demo-session] visit log error:', e)
  }

  // Build redirect response
  const response = NextResponse.redirect(new URL('/dashboard', req.url))

  // Set demo_ref cookie for rate limiting
  response.cookies.set('demo_ref', ref, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 hours
  })

  return response
}
