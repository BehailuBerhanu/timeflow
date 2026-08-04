'use client'

import Image from 'next/image'
import { Bell, ChevronDown, CircleQuestionMark, Plus, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PEOPLE } from '@/lib/seed-data'
import { useStore } from '@/lib/store'

export function TopBar({
  onOpenSearch,
  onNewEvent,
}: {
  onOpenSearch: () => void
  onNewEvent: () => void
}) {
  const { pendingCount } = useStore()
  const me = PEOPLE[0]

  return (
    <header className="flex shrink-0 items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
      <a href="/" className="flex shrink-0 items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand text-[13px] font-bold text-primary-foreground dark:text-[#04160b]">
          25
        </span>
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

        <div className="flex items-center gap-1">
          <span className="relative inline-flex">
            <Image
              src={me.avatar}
              alt={me.name}
              width={36}
              height={36}
              className="size-9 rounded-full object-cover ring-1 ring-border"
            />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-brand ring-2 ring-background" />
          </span>
          <ChevronDown
            className="hidden size-3.5 text-muted-foreground sm:block"
            aria-hidden
          />
        </div>
      </div>
    </header>
  )
}
