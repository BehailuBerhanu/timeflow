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
  WEEKDAYS,
  addMinutes,
  atTime,
  durationMinutes,
  eventsForDay,
  formatHourLabel,
  formatTime,
  isSameDay,
  layoutDay,
  minutesSinceMidnight,
  snap15,
  timezoneLabel,
  toLocalISO,
  weekDays,
} from '@/lib/time'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/lib/types'

type DragState = {
  eventId: string
  grabOffsetMinutes: number
  dayIndex: number
  startMinutes: number
  moved: boolean
}

export function WeekGrid({
  anchor,
  onOpenEvent,
}: {
  anchor: Date
  onOpenEvent: (event: CalendarEvent) => void
}) {
  const { visibleEvents, dispatch, createQuickEvent } = useStore()
  const days = useMemo(() => weekDays(anchor), [anchor])
  const scrollRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  /** set when a drag actually moved, so the trailing click doesn't open the dialog */
  const suppressClick = useRef(false)

  // clock only starts on the client so SSR output stays stable
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

  const preview = useMemo(() => {
    if (!drag) return null
    const event = visibleEvents.find((e) => e.id === drag.eventId)
    if (!event) return null
    const start = atTime(days[drag.dayIndex], 0, drag.startMinutes)
    return {
      ...event,
      start: toLocalISO(start),
      end: toLocalISO(addMinutes(start, durationMinutes(event))),
    }
  }, [drag, visibleEvents, days])

  const eventsWithPreview = useMemo(() => {
    if (!preview) return visibleEvents
    return visibleEvents.map((e) => (e.id === preview.id ? preview : e))
  }, [visibleEvents, preview])

  function beginDrag(event: CalendarEvent, dayIndex: number) {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      const body = bodyRef.current
      if (!body) return
      const rect = body.getBoundingClientRect()
      const pointerMinutes =
        ((e.clientY - rect.top) / HOUR_HEIGHT) * 60 + DAY_START_HOUR * 60
      const eventStart = minutesSinceMidnight(new Date(event.start))
      setDrag({
        eventId: event.id,
        grabOffsetMinutes: pointerMinutes - eventStart,
        dayIndex,
        startMinutes: eventStart,
        moved: false,
      })
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
  }

  useEffect(() => {
    if (!drag) return
    const body = bodyRef.current
    if (!body) return

    function onMove(e: PointerEvent) {
      const rect = body!.getBoundingClientRect()
      const columnWidth = rect.width / 7
      const dayIndex = Math.min(
        6,
        Math.max(0, Math.floor((e.clientX - rect.left) / columnWidth)),
      )
      const pointerMinutes =
        ((e.clientY - rect.top) / HOUR_HEIGHT) * 60 + DAY_START_HOUR * 60
      const raw = pointerMinutes - drag!.grabOffsetMinutes
      const startMinutes = Math.max(0, Math.min(23 * 60 + 45, snap15(raw)))
      setDrag((d) =>
        d
          ? {
              ...d,
              dayIndex,
              startMinutes,
              moved: d.moved || dayIndex !== d.dayIndex || startMinutes !== d.startMinutes,
            }
          : d,
      )
    }

    function onUp() {
      setDrag((d) => {
        suppressClick.current = Boolean(d?.moved)
        if (d?.moved) {
          const event = visibleEvents.find((ev) => ev.id === d.eventId)
          if (event) {
            const start = atTime(days[d.dayIndex], 0, d.startMinutes)
            dispatch({
              type: 'updateEvent',
              id: event.id,
              patch: {
                start: toLocalISO(start),
                end: toLocalISO(addMinutes(start, durationMinutes(event))),
              },
            })
          }
        }
        return null
      })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [drag, days, dispatch, visibleEvents])

  const nowOffset =
    now && days.some((d) => isSameDay(d, now))
      ? ((minutesSinceMidnight(now) - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT
      : null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-canvas">
      {/* day header */}
      <div className="grid shrink-0 grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border bg-panel">
        <div className="flex items-end justify-end pb-2 pr-2 text-[10px] font-medium text-muted-foreground">
          {timezoneLabel()}
        </div>
        {days.map((day) => {
          const isToday = now ? isSameDay(day, now) : false
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col items-center gap-1 border-l border-border py-2.5"
            >
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-[0.08em]',
                  isToday ? 'text-brand' : 'text-muted-foreground',
                )}
              >
                {WEEKDAYS[day.getDay()]}
              </span>
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-[19px] font-medium tabular-nums',
                  isToday
                    ? 'bg-brand text-primary-foreground dark:text-[#04160b]'
                    : 'text-foreground',
                )}
              >
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* scrollable body */}
      <div ref={scrollRef} className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          {/* hour gutter */}
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
                className="absolute right-1.5 -translate-y-1/2 rounded px-1 text-[10px] font-semibold text-brand"
                style={{ top: nowOffset }}
              >
                {formatTime(now)}
              </div>
            ) : null}
          </div>

          {/* day columns */}
          <div
            ref={bodyRef}
            className="relative col-span-7 grid grid-cols-7"
            style={{ height: GRID_HEIGHT }}
          >
            {/* horizontal hour lines */}
            {hours.map((hour, i) => (
              <div
                key={hour}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 border-t border-grid-line"
                style={{ top: i * HOUR_HEIGHT }}
              />
            ))}

            {days.map((day, dayIndex) => {
              const laid = layoutDay(eventsForDay(eventsWithPreview, day))
              return (
                <div
                  key={day.toISOString()}
                  className="relative border-l border-grid-line-strong"
                  onDoubleClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const minutes = snap15(
                      ((e.clientY - rect.top) / HOUR_HEIGHT) * 60 + DAY_START_HOUR * 60,
                    )
                    const created = createQuickEvent(
                      day,
                      Math.floor(minutes / 60),
                      minutes % 60,
                    )
                    onOpenEvent(created)
                  }}
                >
                  {laid.map(({ event, top, height, left, width }) => (
                    <div
                      key={event.id}
                      className="absolute px-[3px]"
                      style={{
                        top,
                        height,
                        left: `${left * 100}%`,
                        width: `${width * 100}%`,
                        zIndex: drag?.eventId === event.id ? 30 : 10,
                      }}
                    >
                      <EventChip
                        event={event}
                        compact={height < 44}
                        dragging={drag?.eventId === event.id}
                        onOpen={() => {
                          if (suppressClick.current) {
                            suppressClick.current = false
                            return
                          }
                          onOpenEvent(event)
                        }}
                        onDragHandle={beginDrag(event, dayIndex)}
                      />
                    </div>
                  ))}
                </div>
              )
            })}

            {/* now indicator */}
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
