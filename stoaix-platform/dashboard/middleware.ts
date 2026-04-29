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
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/demo') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/'
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
    .select('id, role, organizations(onboarding_status, is_demo)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (orgUser) {
    const org = orgUser.organizations as unknown as { onboarding_status: string; is_demo?: boolean } | null
    const onboardingCompleted = org?.onboarding_status === 'completed'
    const isDemo = org?.is_demo === true
    const userRole = orgUser.role

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

    // Role-based route restrictions
    const restrictedForMuhasebe = [
      '/dashboard/knowledge', '/dashboard/agent', '/dashboard/settings', '/dashboard/billing',
      '/dashboard/conversations', '/dashboard/calls', '/dashboard/followup', '/dashboard/support',
    ]
    // satisci: billing erişemez, diğer her yere erişebilir
    const restrictedForSatisci = [
      '/dashboard/billing',
    ]

    if (userRole === 'muhasebe') {
      const isRestricted = restrictedForMuhasebe.some(p => pathname.startsWith(p))
      if (isRestricted) return NextResponse.redirect(new URL('/dashboard', request.url))
    } else if (userRole === 'satisci') {
      const isRestricted = restrictedForSatisci.some(p => pathname.startsWith(p))
      if (isRestricted) return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
  }

  // Neither super admin nor org user → /login
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico|.*\\.html).*)'],
}
