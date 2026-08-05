import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (!code) {
    console.error('[auth/callback] No code param — redirecting to login')
    return NextResponse.redirect(`${origin}/login`)
  }

  const cookieStore = await cookies()

  // Build the redirect response first so we can write cookies onto it
  const redirectUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}/home`
  const response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Write session cookies directly onto the redirect response
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          }
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Could not sign in. Please try again.')}`,
    )
  }

  console.log('[auth/callback] Session exchanged successfully, redirecting to', redirectUrl)
  return response
}
