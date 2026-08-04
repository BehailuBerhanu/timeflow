'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EventChip } from './event-chip'
import { useStore } from '@/lib/store'
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  DEFAULT_SCROLL_HOUR,
  GRID_HEIGHT,
  HOUR_HEIGHT,
  eventsForDay,
  formatHourLabel,
  formatTime,
  isSameDay,
  layoutDay,
  minutesSinceMidnight,
  snap15,
  timezoneLabel,
} from '@/lib/time'
import type { CalendarEvent } from '@/lib/types'

export function DayView({
  anchor,
  onOpenEvent,
}: {
  anchor: Date
  onOpenEvent: (event: CalendarEvent) => void
}) {
  const { visibleEvents, createQuickEvent } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = (DEFAULT_SCROLL_HOUR - DAY_START_HOUR) * HOUR_HEIGHT
  }, [])

  const hours = useMemo(
    () =>
      Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i),
    [],
  )

  const laid = useMemo(
    () => layoutDay(eventsForDay(visibleEvents, anchor)),
    [visibleEvents, anchor],
  )

  const isToday = now ? isSameDay(anchor, now) : false
  const nowOffset =
    now && isToday
      ? ((minutesSinceMidnight(now) - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT
      : null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-canvas">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-panel px-4 py-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold">
            {anchor.toLocaleDateString('en-US', { weekday: 'long' })}
          </h2>
          <span className="text-[13px] text-muted-foreground">
            {anchor.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </span>
          {isToday ? (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-text">
              Today
            </span>
          ) : null}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          {timezoneLabel()}
        </span>
      </div>

      <div ref={scrollRef} className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[56px_minmax(0,1fr)]">
          <div className="relative" style={{ height: GRID_HEIGHT }}>
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {i === 0 ? '' : formatHourLabel(hour)}
              </div>
            ))}
            {nowOffset !== null && now ? (
              <div
                className="absolute right-1.5 -translate-y-1/2 px-1 text-[10px] font-semibold text-brand"
                style={{ top: nowOffset }}
              >
                {formatTime(now)}
              </div>
            ) : null}
          </div>

          <div
            className="relative border-l border-grid-line-strong"
            style={{ height: GRID_HEIGHT }}
            onDoubleClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const minutes = snap15(
                ((e.clientY - rect.top) / HOUR_HEIGHT) * 60 + DAY_START_HOUR * 60,
              )
              const created = createQuickEvent(
                anchor,
                Math.floor(minutes / 60),
                minutes % 60,
              )
              onOpenEvent(created)
            }}
          >
            {hours.map((hour, i) => (
              <div
                key={hour}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 border-t border-grid-line"
                style={{ top: i * HOUR_HEIGHT }}
              />
            ))}

            {laid.map(({ event, top, height, left, width }) => (
              <div
                key={event.id}
                className="absolute px-2"
                style={{
                  top,
                  height,
                  left: `${left * 100}%`,
                  width: `${width * 100}%`,
                  zIndex: 10,
                }}
              >
                <EventChip
                  event={event}
                  compact={height < 44}
                  onOpen={() => onOpenEvent(event)}
                />
              </div>
            ))}

            {nowOffset !== null ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                style={{ top: nowOffset }}
              >
                <span className="size-[7px] -translate-x-1/2 rounded-full bg-brand" />
                <span className="h-px flex-1 bg-brand/70" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
