'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Search, Sparkles } from 'lucide-react'
import { Modal } from './modal'
import { useStore } from '@/lib/store'
import { formatRange } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/lib/types'

/**
 * ⌘K surface. Anything that isn't a matched event is treated as a prompt for the
 * assistant, which keeps the single input doing double duty like the reference.
 */
export function CommandPalette({
  open,
  onClose,
  onOpenEvent,
  onAsk,
}: {
  open: boolean
  onClose: () => void
  onOpenEvent: (event: CalendarEvent) => void
  onAsk: (prompt: string) => void
}) {
  const { visibleEvents } = useStore()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return [...visibleEvents]
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 6)
    }
    return visibleEvents
      .filter((e) => e.title.toLowerCase().includes(q))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 6)
  }, [visibleEvents, query])

  const trimmed = query.trim()

  function ask() {
    if (!trimmed) return
    onAsk(trimmed)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} label="Search calendar or ask AI" align="top">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              e.preventDefault()
              ask()
            }
          }}
          placeholder="Ask AI or search calendar..."
          aria-label="Search calendar or ask the assistant"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          ESC
        </kbd>
      </div>

      <div className="max-h-[320px] overflow-y-auto p-2">
        {trimmed ? (
          <button
            type="button"
            onClick={ask}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-secondary"
          >
            <Sparkles className="size-4 shrink-0 text-brand" strokeWidth={2.2} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
              Ask the assistant: &ldquo;{trimmed}&rdquo;
            </span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        ) : null}

        <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {trimmed ? 'Matching events' : 'Upcoming'}
        </p>

        {matches.length ? (
          <ul>
            {matches.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => {
                    onOpenEvent(event)
                    onClose()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary"
                >
                  <span
                    data-tone={event.tone}
                    aria-hidden
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-md',
                      'bg-[var(--chip-bg)] text-[var(--chip-rail)]',
                    )}
                  >
                    <CalendarDays className="size-3.5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">
                      {event.title}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {new Date(event.start).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      &middot; {formatRange(event.start, event.end)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2.5 py-4 text-[13px] text-muted-foreground">
            No events match that. Press Enter to ask the assistant instead.
          </p>
        )}
      </div>
    </Modal>
  )
}
