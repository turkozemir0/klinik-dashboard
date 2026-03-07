import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ── demo.stoaix.com hostname routing ──────────────────────────────────────
  if (hostname === 'demo.stoaix.com') {
    const isLoginPage = pathname === '/login';

    if (!isLoginPage) {
      const demoAuth = request.cookies.get('demo_auth')?.value;
      if (demoAuth !== process.env.DEMO_AUTH_SECRET) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Rewrite to /demo/* paths so Next.js serves app/demo/
    if (!pathname.startsWith('/demo')) {
      const rewritePath = pathname === '/' ? '/demo' : '/demo' + pathname;
      return NextResponse.rewrite(new URL(rewritePath, request.url));
    }

    return NextResponse.next({ request });
  }

  // ── panel.stoaix.com: /demo auth check ────────────────────────────────────
  if (pathname === '/demo' || (pathname.startsWith('/demo/') && pathname !== '/demo/login')) {
    const demoAuth = request.cookies.get('demo_auth')?.value;
    if (demoAuth !== process.env.DEMO_AUTH_SECRET) {
      return NextResponse.redirect(new URL('/demo/login', request.url));
    }
    return NextResponse.next({ request });
  }

  // ── panel.stoaix.com: Supabase auth ───────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Giriş yapmamış → login
  if (!user && (
    pathname === '/dashboard' || pathname.startsWith('/dashboard/') ||
    pathname === '/admin'     || pathname.startsWith('/admin/') ||
    pathname === '/onboarding'|| pathname.startsWith('/onboarding/') ||
    pathname === '/waiting'
  )) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Giriş yapmış + login → nereye?
  if (user && pathname === '/login') {
    const { data: adminRow } = await supabase
      .from('super_admin_users').select('id').eq('user_id', user.id).single();
    if (adminRow) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    const { data: cu } = await supabase
      .from('clinic_users')
      .select('clinic_id, clinic:clinic_id(onboarding_status)')
      .eq('user_id', user.id)
      .single();

    if (!cu) {
      return NextResponse.redirect(new URL('/waiting', request.url));
    }

    const clinic = cu.clinic as any;
    if (clinic?.onboarding_status !== 'completed') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // /admin → super_admin kontrolü
  if (user && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    const { data: adminRow } = await supabase
      .from('super_admin_users').select('id').eq('user_id', user.id).single();
    if (!adminRow) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/',
    '/dashboard', '/dashboard/:path*',
    '/admin',     '/admin/:path*',
    '/onboarding','/onboarding/:path*',
    '/waiting',   '/login',
    '/demo',      '/demo/:path*',
  ],
};
