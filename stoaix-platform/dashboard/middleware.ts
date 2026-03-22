import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public paths
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/')
  ) {
    return supabaseResponse
  }

  // Not logged in → /login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check super admin
  const { data: superAdmin } = await supabase
    .from('super_admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (superAdmin) {
    return supabaseResponse
  }

  // Check org user with onboarding status
  const { data: orgUser } = await supabase
    .from('org_users')
    .select('id, organizations(onboarding_status)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (orgUser) {
    const org = orgUser.organizations as unknown as { onboarding_status: string } | null
    const onboardingCompleted = org?.onboarding_status === 'completed'

    // Org users cannot access /admin
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Onboarding not completed → only allow /onboarding
    if (!onboardingCompleted) {
      if (pathname.startsWith('/onboarding')) {
        return supabaseResponse
      }
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Onboarding completed → redirect away from /onboarding
    if (pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
  }

  // Neither super admin nor org user → /login
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico).*)'],
}
