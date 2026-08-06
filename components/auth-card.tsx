'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Moon, Sun } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { OAuthButtons } from '@/components/oauth-buttons'
import { cn } from '@/lib/utils'

// ── Small brand mark ──────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <div className="flex items-center gap-0">
      <Image
        src="/logo.png"
        alt=""
        width={78}
        height={78}
        className="size-[78px] object-contain"
        priority
      />
      <span className="text-[19px] font-semibold tracking-[-0.02em] text-foreground">
        Timeflow
      </span>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
    />
  )
}

// ── Copy per mode ─────────────────────────────────────────────────────────────

const COPY = {
  login: {
    heading: 'Sign in to Timeflow',
    subtext: 'Your AI calendar — sign in to get started.',
    switchText: "Don't have an account?",
    switchLink: '/signup',
    switchLabel: 'Sign Up',
  },
  signup: {
    heading: 'Create your Timeflow account',
    subtext: 'Start organizing your schedule with AI.',
    switchText: 'Already have an account?',
    switchLink: '/login',
    switchLabel: 'Sign In',
  },
} as const

// ── AuthCard ──────────────────────────────────────────────────────────────────

export function AuthCard({ mode }: { mode: 'login' | 'signup' }) {
  const { state, toggleTheme } = useStore()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(errorParam)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [validationMsg, setValidationMsg] = useState<string | null>(null)

  // Strip the ?error= from the URL so a refresh doesn't re-show it
  useEffect(() => {
    if (errorParam) {
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [errorParam])

  const copy = COPY[mode]

  // Basic email format check: local@domain
  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationMsg(null)
    setError(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setValidationMsg('Please enter your email address.')
      return
    }
    if (!isValidEmail(trimmed)) {
      setValidationMsg('Please enter a valid email address.')
      return
    }

    setEmailLoading(true)
    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (otpError) {
      setError(otpError.message)
      setEmailLoading(false)
    } else {
      setEmailSent(true)
      setEmailLoading(false)
    }
  }

  return (
    // Full-viewport centering wrapper
    <div className="relative flex min-h-dvh w-full items-center justify-center bg-background px-4 py-12 text-foreground">

      {/* Theme toggle — top-right corner */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {state.theme === 'dark' ? (
          <Sun className="size-[18px]" aria-hidden />
        ) : (
          <Moon className="size-[18px]" aria-hidden />
        )}
      </button>

      {/* Card column */}
      <div className="flex w-full max-w-[440px] flex-col gap-6">

        {/* Brand */}
        <div className="flex justify-center">
          <BrandMark />
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-panel p-8 shadow-sm">

          {/* Heading */}
          <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-foreground">
            {copy.heading}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">{copy.subtext}</p>

          {/* URL-driven error banner */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[12.5px] text-destructive"
            >
              {error}
            </div>
          )}

          {/* ── Email section ── */}
          <div className="mt-5">
            {emailSent ? (
              <div
                role="status"
                className="rounded-lg border border-border bg-secondary px-4 py-3 text-[13px] text-foreground"
              >
                ✉️ Check your email for a sign-in link
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} noValidate className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@work-email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setValidationMsg(null)
                    }}
                    disabled={emailLoading}
                    className={cn(
                      'h-11 w-full rounded-xl border border-border bg-background px-4 text-[13.5px] text-foreground',
                      'placeholder:text-muted-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                      'disabled:cursor-not-allowed disabled:opacity-60',
                      'transition-colors',
                    )}
                  />
                  {validationMsg && (
                    <p role="alert" className="text-[12px] text-destructive">
                      {validationMsg}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={emailLoading}
                  aria-busy={emailLoading}
                  className={cn(
                    'flex h-11 w-full items-center justify-center gap-2.5 rounded-xl',
                    'bg-primary text-[13.5px] font-semibold text-primary-foreground',
                    'transition-colors hover:opacity-90 active:opacity-80',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                  )}
                >
                  {emailLoading ? (
                    <>
                      <Spinner />
                      Sending…
                    </>
                  ) : (
                    'Continue with Email'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="relative my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11.5px] font-medium text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* ── OAuth buttons ── */}
          <OAuthButtons oauthError={oauthError} onError={setOauthError} />

          {/* ── Legal footer ── */}
          <p className="mt-5 text-center text-[11.5px] text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* ── Switch link ── */}
        <p className="text-center text-[13px] text-muted-foreground">
          {copy.switchText}{' '}
          <Link
            href={copy.switchLink}
            className="font-medium text-foreground underline underline-offset-2 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {copy.switchLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
