'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import {
  WEEKDAYS,
  addDays,
  eventsForDay,
  formatTime,
  isSameDay,
  startOfWeek,
} from '@/lib/time'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/lib/types'

/** Six-week grid covering the anchor's month, Sunday-first. */
function monthMatrix(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const gridStart = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

export function MonthView({
  anchor,
  onOpenEvent,
}: {
  anchor: Date
  onOpenEvent: (event: CalendarEvent) => void
}) {
  const { visibleEvents } = useStore()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => setNow(new Date()), [])

  const cells = useMemo(() => monthMatrix(anchor), [anchor])
  const month = anchor.getMonth()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-canvas">
      <div className="grid shrink-0 grid-cols-7 border-b border-border bg-panel">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="border-l border-border py-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground first:border-l-0"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="scrollbar-slim grid min-h-0 flex-1 grid-cols-7 grid-rows-6 overflow-y-auto">
        {cells.map((day) => {
          const dayEvents = eventsForDay(visibleEvents, day)
          const outside = day.getMonth() !== month
          const isToday = now ? isSameDay(day, now) : false
          const shown = dayEvents.slice(0, 3)
          const overflow = dayEvents.length - shown.length

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex min-h-[92px] flex-col gap-1 border-b border-l border-grid-line p-1.5',
                outside && 'bg-secondary/30',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-medium tabular-nums',
                  isToday && 'bg-brand text-primary-foreground dark:text-[#04160b]',
                  !isToday && outside && 'text-muted-foreground/60',
                  !isToday && !outside && 'text-foreground',
                )}
              >
                {day.getDate()}
              </span>

              <div className="flex min-w-0 flex-col gap-0.5">
                {shown.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    data-tone={event.tone}
                    onClick={() => onOpenEvent(event)}
                    className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-[var(--chip-bg)]"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full bg-[var(--chip-rail)]"
                    />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-4">
                      {event.title}
                    </span>
                    <span className="hidden shrink-0 text-[10px] text-muted-foreground xl:inline">
                      {formatTime(new Date(event.start)).replace(':00', '')}
                    </span>
                  </button>
                ))}
                {overflow > 0 ? (
                  <span className="px-1 text-[10px] font-medium text-muted-foreground">
                    +{overflow} more
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
