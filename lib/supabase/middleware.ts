import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/** Paths that render without a session. */
function isPublicPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/avatars') ||
    pathname.startsWith('/placeholder')
  )
}

/**
 * Refreshes the session cookie on every request and handles auth redirects.
 * Called from the root proxy.ts.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes need no session work at all — the landing page in particular
  // must render for visitors who have never signed in.
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Without credentials there is no session to read. Fail open rather than
  // throwing on every request, so the app stays browsable in demo mode.
  if (!url || !anonKey) {
    console.warn(
      `[proxy] Supabase env vars missing — skipping auth for ${pathname}. ` +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sign-in.',
    )
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        supabaseResponse = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options)
        }
      },
    },
  })

  // Refresh the session — do NOT remove this await.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    const next = request.nextUrl.pathname
    redirectUrl.pathname = '/login'
    if (next !== '/login') {
      redirectUrl.searchParams.set('next', next)
    }
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
