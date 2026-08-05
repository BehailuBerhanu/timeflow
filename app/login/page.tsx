'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/** Inline Google "G" logo — no external image needed */
function GoogleLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      aria-hidden
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(errorParam)

  // Clear the error from the URL once we've shown it
  useEffect(() => {
    if (errorParam) {
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [errorParam])

  async function signInWithGoogle() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
    // On success the browser follows the redirect — no further handling needed
  }

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background text-foreground">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 px-6">
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand">
            <Sparkles className="size-6 text-primary-foreground dark:text-[#04160b]" strokeWidth={2.2} />
          </div>
          <div className="text-center">
            <h1 className="text-[22px] font-bold tracking-[-0.02em]">Timeflow</h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              AI calendar that asks before it acts
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-border bg-panel p-6 shadow-sm">
          <h2 className="mb-1 text-[15px] font-semibold">Sign in to continue</h2>
          <p className="mb-5 text-[12.5px] text-muted-foreground">
            Your events and tasks stay in your browser — we only need your identity.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-[12.5px] text-destructive">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-secondary text-[13.5px] font-medium text-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
            ) : (
              <GoogleLogo />
            )}
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>
        </div>

        <p className="text-center text-[11.5px] text-muted-foreground">
          Demo mode — no data leaves your browser.
        </p>
      </div>
    </div>
  )
}
