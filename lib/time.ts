import type { CalendarEvent } from './types'

export const HOUR_HEIGHT = 48
export const DAY_START_HOUR = 0
export const DAY_END_HOUR = 24
export const GRID_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT
/** where we scroll the grid on mount so the day opens on the morning */
export const DEFAULT_SCROLL_HOUR = 7.6

export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addMinutes(d: Date, n: number) {
  return new Date(d.getTime() + n * 60_000)
}

/** Sunday-first, matching the reference layout */
export function startOfWeek(d: Date) {
  const x = startOfDay(d)
  return addDays(x, -x.getDay())
}

export function weekDays(anchor: Date) {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes()
}

export function durationMinutes(e: CalendarEvent) {
  return (new Date(e.end).getTime() - new Date(e.start).getTime()) / 60_000
}

export function formatTime(d: Date) {
  const h = d.getHours()
  const m = d.getMinutes()
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** "9:00 – 10:00 AM" — drops the meridiem on the left when both sides share it */
export function formatRange(startISO: string, endISO: string) {
  const s = new Date(startISO)
  const e = new Date(endISO)
  const left = formatTime(s)
  const right = formatTime(e)
  const sameMeridiem = left.slice(-2) === right.slice(-2)
  return `${sameMeridiem ? left.slice(0, -3) : left} – ${right}`
}

export function formatHourLabel(hour: number) {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

export function formatMonthTitle(anchor: Date) {
  return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function timezoneLabel() {
  const offset = -new Date().getTimezoneOffset() / 60
  const sign = offset >= 0 ? '+' : '-'
  return `GMT${sign}${Math.abs(offset)}`
}

/** snap a minute value to the nearest 15-minute step */
export function snap15(minutes: number) {
  return Math.round(minutes / 15) * 15
}

export function eventsForDay(events: CalendarEvent[], day: Date) {
  return events
    .filter((e) => isSameDay(new Date(e.start), day))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

export type LaidOutEvent = {
  event: CalendarEvent
  top: number
  height: number
  /** 0..1 fraction of the column */
  left: number
  width: number
  column: number
  columns: number
}

/**
 * Splits overlapping events into side-by-side columns within a day, the way a
 * real calendar does. Chips get a small bleed so stacked blocks read as layered
 * rather than perfectly tiled.
 */
export function layoutDay(events: CalendarEvent[]): LaidOutEvent[] {
  const items = events.map((event) => {
    const s = new Date(event.start)
    const e = new Date(event.end)
    return {
      event,
      startMin: minutesSinceMidnight(s),
      endMin: minutesSinceMidnight(s) + (e.getTime() - s.getTime()) / 60_000,
    }
  })

  // build clusters of transitively-overlapping events
  const clusters: (typeof items)[] = []
  let current: typeof items = []
  let clusterEnd = -1
  for (const item of items) {
    if (current.length && item.startMin >= clusterEnd) {
      clusters.push(current)
      current = []
      clusterEnd = -1
    }
    current.push(item)
    clusterEnd = Math.max(clusterEnd, item.endMin)
  }
  if (current.length) clusters.push(current)

  const out: LaidOutEvent[] = []
  for (const cluster of clusters) {
    const columnEnds: number[] = []
    const assigned = cluster.map((item) => {
      let col = columnEnds.findIndex((end) => item.startMin >= end)
      if (col === -1) {
        col = columnEnds.length
        columnEnds.push(item.endMin)
      } else {
        columnEnds[col] = item.endMin
      }
      return { item, col }
    })
    const columns = Math.max(1, columnEnds.length)
    for (const { item, col } of assigned) {
      const slot = 1 / columns
      const bleed = columns > 1 ? slot * 0.18 : 0
      out.push({
        event: item.event,
        top: ((item.startMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT,
        height: Math.max(26, ((item.endMin - item.startMin) / 60) * HOUR_HEIGHT - 3),
        left: col * slot,
        width: slot + bleed,
        column: col,
        columns,
      })
    }
  }
  return out
}

export function findConflicts(events: CalendarEvent[]) {
  const pairs: [CalendarEvent, CalendarEvent][] = []
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]
      const b = sorted[j]
      if (new Date(b.start) >= new Date(a.end)) break
      if (a.focus || b.focus) continue
      pairs.push([a, b])
    }
  }
  return pairs
}

/** total focus-block minutes on a given day */
export function focusMinutes(events: CalendarEvent[], day: Date) {
  return eventsForDay(events, day)
    .filter((e) => e.focus)
    .reduce((sum, e) => sum + durationMinutes(e), 0)
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

/** local-time ISO string (no timezone shifting) for storage */
export function toLocalISO(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:00`
}

export function atTime(day: Date, hours: number, minutes = 0) {
  const d = startOfDay(day)
  d.setHours(hours, minutes, 0, 0)
  return d
}
