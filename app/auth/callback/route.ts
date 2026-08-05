import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase exchanges the OAuth code for a session here, then redirects
 * the user into the app.
 *
 * We use createServerClient directly (instead of our helper) so we can
 * collect the cookies it sets and forward them onto the redirect response.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const cookieStore = await cookies()
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(incoming) {
          // Collect them so we can apply them to the redirect response
          for (const cookie of incoming) {
            cookiesToSet.push(cookie)
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

  // Build the redirect and forward all session cookies onto it
  const redirectUrl = next.startsWith('/') ? `${origin}${next}` : origin
  const response = NextResponse.redirect(redirectUrl)

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  }

  return response
}
