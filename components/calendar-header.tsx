'use client'

import { ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { formatMonthTitle } from '@/lib/time'
import { cn } from '@/lib/utils'

const VIEWS = ['Day', 'Week', 'Month'] as const
export type CalendarView = (typeof VIEWS)[number]

export function CalendarHeader({
  anchor,
  view,
  onView,
  onPrev,
  onNext,
  onToday,
}: {
  anchor: Date
  view: CalendarView
  onView: (v: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 pb-3">
      <h1 className="mr-1 text-2xl font-semibold tracking-[-0.02em]">
        {formatMonthTitle(anchor)}
      </h1>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous week"
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-panel text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="h-9 rounded-xl border border-border bg-panel px-3.5 text-sm font-medium transition-colors hover:border-brand/40"
        >
          Today
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next week"
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-panel text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative flex h-9 items-center rounded-xl border border-border bg-panel pl-3 pr-2">
          <select
            value={view}
            onChange={(e) => onView(e.target.value as CalendarView)}
            aria-label="Calendar view"
            className="appearance-none bg-transparent pr-5 text-sm font-medium outline-none"
          >
            {VIEWS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground"
            aria-hidden
          />
        </div>
        <button
          type="button"
          aria-label="Filter events"
          className={cn(
            'flex size-9 items-center justify-center rounded-xl border border-border bg-panel',
            'text-muted-foreground transition-colors hover:text-foreground',
          )}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
