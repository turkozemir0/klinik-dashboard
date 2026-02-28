import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
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
  const { pathname } = request.nextUrl;

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
    const { data: cu } = await supabase
      .from('clinic_users')
      .select('clinic_id, clinic:clinic_id(onboarding_status)')
      .eq('user_id', user.id)
      .single();

    if (!cu) {
      // Klinik yok = onay bekleniyor
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
    '/dashboard', '/dashboard/:path*',
    '/admin',     '/admin/:path*',
    '/onboarding','/onboarding/:path*',
    '/waiting',   '/login',
  ],
};
