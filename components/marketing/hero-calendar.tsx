'use client'

import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MinusCircle,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { EventChip } from '@/components/event-chip'
import { HOUR_HEIGHT, WEEKDAYS } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/lib/types'

/**
 * A static, non-interactive rendering of the real week grid. Dates are frozen
 * literals so the SSR and client markup always agree, and the chips are the
 * production <EventChip /> so the marketing shot can never drift from the app.
 *
 * Week of Sun May 18 – Sat May 24, 2025. "Today" is Tue May 20.
 */

/** first / last hour shown in the hero crop */
const VIEW_START = 8
const VIEW_END = 19

const DAYS = [
  { label: WEEKDAYS[0], date: 18 },
  { label: WEEKDAYS[1], date: 19 },
  { label: WEEKDAYS[2], date: 20, today: true },
  { label: WEEKDAYS[3], date: 21 },
  { label: WEEKDAYS[4], date: 22 },
  { label: WEEKDAYS[5], date: 23 },
  { label: WEEKDAYS[6], date: 24 },
]

/** dayIndex 0 = Sun … 6 = Sat */
const EVENTS: { dayIndex: number; event: CalendarEvent }[] = [
  {
    dayIndex: 1,
    event: {
      id: 'h-standup',
      title: 'Standup',
      start: '2025-05-19T08:00:00',
      end: '2025-05-19T08:30:00',
      calendarId: 'work',
      tone: 'teal',
      attendees: [],
    },
  },
  {
    dayIndex: 2,
    event: {
      id: 'h-deep-work',
      title: 'Deep Work',
      start: '2025-05-20T08:00:00',
      end: '2025-05-20T10:30:00',
      calendarId: 'work',
      tone: 'green',
      attendees: [],
      focus: true,
      focusProgress: 0.62,
      aiTouched: true,
    },
  },
  {
    dayIndex: 2,
    event: {
      id: 'h-team-sync',
      title: 'Team Sync',
      start: '2025-05-20T14:00:00',
      end: '2025-05-20T15:00:00',
      calendarId: 'work',
      tone: 'blue',
      attendees: [],
    },
  },
  {
    dayIndex: 3,
    event: {
      id: 'h-1on1',
      title: '1:1 — Maya',
      start: '2025-05-21T17:45:00',
      end: '2025-05-21T18:30:00',
      calendarId: 'work',
      tone: 'violet',
      attendees: [],
    },
  },
  {
    dayIndex: 4,
    event: {
      id: 'h-product-sync',
      title: 'Product Sync',
      start: '2025-05-22T08:00:00',
      end: '2025-05-22T09:00:00',
      calendarId: 'work',
      tone: 'blue',
      attendees: [],
    },
  },
  {
    dayIndex: 5,
    event: {
      id: 'h-retro',
      title: 'Sprint Retro',
      start: '2025-05-23T17:15:00',
      end: '2025-05-23T18:15:00',
      calendarId: 'work',
      tone: 'teal',
      attendees: [],
    },
  },
  {
    dayIndex: 6,
    event: {
      id: 'h-design-review',
      title: 'Design Review',
      start: '2025-05-24T15:00:00',
      end: '2025-05-24T16:00:00',
      calendarId: 'work',
      tone: 'amber',
      attendees: [],
    },
  },
]

/** the slot Timeflow is proposing to move Team Sync into */
const GHOST = { dayIndex: 2, startHour: 16.5, endHour: 17.5 }

function offsetTop(hours: number) {
  return (hours - VIEW_START) * HOUR_HEIGHT
}

function hourLabel(hour: number) {
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

function toHours(iso: string) {
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60
}

const HOURS = Array.from({ length: VIEW_END - VIEW_START }, (_, i) => VIEW_START + i)

// ─── the approval diff overlay ────────────────────────────────────────────────

const DIFF_ROWS = [
  { icon: MinusCircle, label: 'Title', before: 'Team Sync', after: 'Team Sync', changed: false },
  { icon: CalendarDays, label: 'Date', before: 'Tue, May 20', after: 'Tue, May 20', changed: false },
  { icon: Clock, label: 'Time', before: '2:00 – 3:00 PM', after: '4:30 – 5:30 PM', changed: true },
  { icon: Calendar, label: 'Calendar', before: 'Work', after: 'Work', changed: false },
]

function SourceMark({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="flex size-5 items-center justify-center rounded-[6px] border border-border bg-panel text-[9px] font-bold leading-none"
      style={{ color }}
    >
      {label}
    </span>
  )
}

function DiffColumn({ side }: { side: 'before' | 'after' }) {
  const isAfter = side === 'after'
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <p
        className={cn(
          'font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em]',
          isAfter ? 'text-brand-text' : 'text-muted-foreground',
        )}
      >
        {isAfter ? 'After (proposed)' : 'Before'}
      </p>
      <div className="flex flex-col gap-2.5">
        {DIFF_ROWS.map((row) => {
          const Icon = row.icon
          const value = isAfter ? row.after : row.before
          const highlight = row.changed
          return (
            <div key={row.label} className="flex items-center gap-2">
              <Icon className="size-3.5 shrink-0 text-muted-foreground/70" strokeWidth={1.8} />
              <span className="w-[52px] shrink-0 text-[11.5px] text-muted-foreground">
                {row.label}
              </span>
              <span
                className={cn(
                  'min-w-0 truncate text-[12px] font-medium tabular-nums',
                  highlight
                    ? isAfter
                      ? 'text-brand-text'
                      : 'text-foreground/55 line-through decoration-foreground/25'
                    : 'text-foreground',
                )}
              >
                {value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ApprovalOverlay() {
  return (
    <div className="w-[min(100%,29rem)] rounded-2xl border border-border bg-popover/95 p-5 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.45)] backdrop-blur-md">
      {/* header */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft">
          <Sparkles className="size-4 text-brand" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-[-0.015em] text-foreground">
            Protect Deep Work Block
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            Timeflow drafted this change to protect your focus time.
          </p>
        </div>
        <span className="mt-0.5 flex size-6 items-center justify-center rounded-md text-muted-foreground">
          <X className="size-3.5" strokeWidth={2} />
        </span>
      </div>

      {/* diff */}
      <div className="relative mt-4 flex items-stretch gap-4 rounded-xl border border-border bg-secondary/40 p-4">
        <DiffColumn side="before" />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-panel"
        >
          <ArrowRight className="size-3 text-brand" strokeWidth={2.4} />
        </span>
        <span aria-hidden className="w-px shrink-0 bg-border" />
        <DiffColumn side="after" />
      </div>

      {/* sources */}
      <div className="mt-3.5 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <SourceMark label="GC" color="#4285f4" />
          <SourceMark label="N" color="#8a8f8c" />
        </div>
        <p className="text-[11.5px] text-muted-foreground">
          based on your Google Calendar and Notion
        </p>
      </div>

      {/* actions */}
      <div className="mt-4 flex items-center gap-2">
        <span className="flex h-9 flex-1 items-center justify-center rounded-lg border border-border text-[13px] font-medium text-muted-foreground">
          Dismiss
        </span>
        <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground">
          Approve &amp; apply
          <Check className="size-3.5" strokeWidth={2.8} />
        </span>
      </div>
    </div>
  )
}

// ─── the grid ─────────────────────────────────────────────────────────────────

export function HeroCalendar() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none select-none overflow-hidden rounded-2xl border border-border bg-canvas shadow-[0_30px_80px_-40px_rgb(0_0_0/0.5)]"
      >
        {/* toolbar */}
        <div className="flex items-center gap-3 border-b border-border bg-panel px-4 py-3">
          <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-foreground">
            May 18 – 24, 2025
          </p>
          <span className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground">
            Today
          </span>
          <span className="ml-auto flex items-center gap-1">
            <span className="flex size-6 items-center justify-center rounded-md border border-border text-muted-foreground">
              <ChevronLeft className="size-3.5" />
            </span>
            <span className="flex size-6 items-center justify-center rounded-md border border-border text-muted-foreground">
              <ChevronRight className="size-3.5" />
            </span>
          </span>
        </div>

        {/* day header */}
        <div className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))] border-b border-border bg-panel">
          <div />
          {DAYS.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1 border-l border-border py-2.5"
            >
              <span
                className={cn(
                  'font-mono text-[9px] font-semibold uppercase tracking-[0.1em]',
                  day.today ? 'text-brand' : 'text-muted-foreground',
                )}
              >
                {day.label}
              </span>
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-[13px] font-medium tabular-nums',
                  day.today ? 'bg-brand text-primary-foreground' : 'text-foreground',
                )}
              >
                {day.date}
              </span>
            </div>
          ))}
        </div>

        {/* body */}
        <div className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))]">
          {/* hour gutter */}
          <div className="relative" style={{ height: offsetTop(VIEW_END) }}>
            {HOURS.map((hour) => (
              <span
                key={hour}
                className="absolute right-2 -translate-y-1/2 font-mono text-[9.5px] font-medium tabular-nums text-muted-foreground"
                style={{ top: offsetTop(hour) }}
              >
                {hour === VIEW_START ? '' : hourLabel(hour)}
              </span>
            ))}
          </div>

          {/* day columns */}
          <div
            className="relative col-span-7 grid grid-cols-7"
            style={{ height: offsetTop(VIEW_END) }}
          >
            {HOURS.map((hour) => (
              <span
                key={hour}
                className="pointer-events-none absolute inset-x-0 border-t border-grid-line"
                style={{ top: offsetTop(hour) }}
              />
            ))}

            {DAYS.map((day, dayIndex) => (
              <div key={day.date} className="relative border-l border-grid-line-strong">
                {EVENTS.filter((e) => e.dayIndex === dayIndex).map(({ event }) => {
                  const start = toHours(event.start)
                  const end = toHours(event.end)
                  const height = Math.max(24, (end - start) * HOUR_HEIGHT - 3)
                  return (
                    <div
                      key={event.id}
                      className="absolute inset-x-0 px-[3px]"
                      style={{ top: offsetTop(start), height }}
                    >
                      <EventChip event={event} compact={height < 44} onOpen={() => {}} />
                    </div>
                  )
                })}

                {/* proposed slot, drawn as a dashed ghost */}
                {dayIndex === GHOST.dayIndex ? (
                  <div
                    className="absolute inset-x-0 px-[3px]"
                    style={{
                      top: offsetTop(GHOST.startHour),
                      height: (GHOST.endHour - GHOST.startHour) * HOUR_HEIGHT - 3,
                    }}
                  >
                    <div className="flex h-full flex-col justify-center gap-0.5 rounded-lg border border-dashed border-brand/55 bg-brand-soft/60 px-2">
                      <span className="truncate text-[11.5px] font-semibold leading-tight text-brand-text">
                        Team Sync
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-brand-text/75">
                        Proposed
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {/* now line */}
            <span
              className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
              style={{ top: offsetTop(12.6) }}
            >
              <span className="size-[6px] -translate-x-1/2 rounded-full bg-brand" />
              <span className="h-px flex-1 bg-brand/60" />
            </span>
          </div>
        </div>
      </div>

      {/* the approval card, floating over the grid */}
      <div className="absolute inset-x-0 top-[22%] flex justify-center px-4 sm:px-8">
        <ApprovalOverlay />
      </div>

      <p className="sr-only">
        A week view of a calendar for May 18 to 24, 2025. Timeflow has drafted a change titled
        “Protect Deep Work Block” that moves Team Sync on Tuesday, May 20 from 2:00–3:00 PM to
        4:30–5:30 PM, based on Google Calendar and Notion. The change is waiting for approval and
        can be dismissed or applied.
      </p>

      {/* reassurance pill */}
      <div className="mt-5 flex justify-center">
        <span className="flex items-center gap-2 rounded-full border border-brand/25 bg-brand-soft px-3.5 py-2 text-[12.5px] font-medium text-brand-text">
          <ShieldCheck className="size-3.5" strokeWidth={2.2} aria-hidden />
          You approve. Timeflow applies.
        </span>
      </div>
    </div>
  )
}
