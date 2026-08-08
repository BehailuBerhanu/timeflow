'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import {
  Bell,
  ChevronDown,
  CircleQuestionMark,
  FlaskConical,
  LogOut,
  Plus,
  Search,
  Settings,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/** Initials fallback when there's no avatar URL */
function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const letters =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : parts[0].slice(0, 2)
  return (
    <span className="flex size-9 items-center justify-center rounded-full bg-brand text-[13px] font-semibold text-primary-foreground dark:text-[#04160b]">
      {letters.toUpperCase()}
    </span>
  )
}

export function TopBar({
  onOpenSearch,
  onNewEvent,
}: {
  onOpenSearch: () => void
  onNewEvent: () => void
}) {
  const { pendingCount } = useStore()
  const user = useUser()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // ── Dev: manual suggestion trigger ───────────────────────────────────────
  const [devGenerating, setDevGenerating] = useState(false)
  const [devResult, setDevResult] = useState<string | null>(null)

  async function triggerSuggestion() {
    setDevGenerating(true)
    setDevResult(null)
    try {
      const res = await fetch('/api/suggestions/generate', {
        method: 'POST',
        headers: { 'X-Dev-Trigger': '1' },
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        setDevResult(`Error: ${String(data.error ?? res.status)}`)
      } else if (data.success) {
        setDevResult(`✓ Created suggestion ${String(data.suggestionId).slice(0, 8)}…`)
      } else {
        setDevResult(String(data.message ?? 'Done'))
      }
    } catch (err) {
      setDevResult(`Network error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDevGenerating(false)
      setTimeout(() => setDevResult(null), 5000)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    'You'
  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex shrink-0 items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
      <a href="/calendar" className="flex shrink-0 items-center gap-0">
        <Image
          src="/logo.png"
          alt=""
          width={78}
          height={78}
          className="size-[78px] object-contain"
          priority
        />
        <span className="text-[17px] font-semibold tracking-[-0.02em]">Timeflow</span>
      </a>

      <button
        type="button"
        onClick={onOpenSearch}
        className="group flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-border bg-panel px-3.5 text-left transition-colors hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:mx-2 sm:max-w-xl"
      >
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          Ask AI or search calendar...
        </span>
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:flex">
          <span className="text-[13px] leading-none">⌘</span> K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          onClick={onNewEvent}
          className="h-10 gap-1.5 rounded-xl px-3.5 text-sm font-medium"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">New event</span>
          <ChevronDown className="hidden size-3.5 opacity-70 sm:inline" aria-hidden />
        </Button>

        {/* Dev-only: trigger suggestion generation without the cron */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="relative hidden items-center md:flex">
            <button
              type="button"
              onClick={triggerSuggestion}
              disabled={devGenerating}
              title="[DEV] Generate suggestion now"
              aria-label="Generate suggestion now (dev only)"
              className={cn(
                'flex h-10 items-center gap-1.5 rounded-xl border border-dashed px-3 text-[12px] font-medium transition-colors',
                devGenerating
                  ? 'cursor-not-allowed border-border text-muted-foreground opacity-60'
                  : 'border-brand/40 text-brand hover:bg-brand/10',
              )}
            >
              <FlaskConical className="size-3.5 shrink-0" aria-hidden />
              <span className="hidden lg:inline">
                {devGenerating ? 'Generating…' : 'Gen suggestion'}
              </span>
            </button>
            {devResult && (
              <span className="absolute left-full ml-2 whitespace-nowrap rounded-lg border border-border bg-panel px-2.5 py-1 text-[11.5px] text-muted-foreground shadow-sm">
                {devResult}
              </span>
            )}
          </div>
        )}

        <div className="hidden items-center gap-0.5 md:flex">
          <button
            type="button"
            aria-label={`Notifications${pendingCount ? `, ${pendingCount} awaiting approval` : ''}`}
            className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Bell className="size-[18px]" aria-hidden />
            {pendingCount ? (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand ring-2 ring-background" />
            ) : null}
          </button>
          <button
            type="button"
            aria-label="Help"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <CircleQuestionMark className="size-[18px]" aria-hidden />
          </button>
          <a
            href="/settings"
            aria-label="Settings"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="size-[18px]" aria-hidden />
          </a>
        </div>

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="User menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1"
          >
            <span className="relative inline-flex">
              {/* Show skeleton while session is loading (user === undefined) */}
              {user === undefined ? (
                <span className="size-9 animate-pulse rounded-full bg-secondary" />
              ) : avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover ring-1 ring-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Initials name={displayName} />
              )}
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-brand ring-2 ring-background" />
            </span>
            <ChevronDown
              className={cn(
                'hidden size-3.5 text-muted-foreground transition-transform sm:block',
                menuOpen && 'rotate-180',
              )}
              aria-hidden
            />
          </button>

          {menuOpen && (
            <>
              {/* backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-panel shadow-lg">
                {/* Identity */}
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {displayName}
                  </p>
                  {user?.email && (
                    <p className="truncate text-[11.5px] text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="p-1.5">
                  <a
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-secondary"
                  >
                    <Settings className="size-4 text-muted-foreground" />
                    Settings
                  </a>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-secondary"
                  >
                    <LogOut className="size-4 text-muted-foreground" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
