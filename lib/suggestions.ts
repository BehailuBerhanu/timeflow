import {
  addMinutes,
  atTime,
  durationMinutes,
  eventsForDay,
  findConflicts,
  formatDuration,
  isSameDay,
  startOfWeek,
  addDays,
  toLocalISO,
} from './time'
import type { CalendarEvent, Connection, PendingChange, Suggestion } from './types'

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/** first gap of at least `minutes` between 9am and 6pm on a given day */
export function findGap(events: CalendarEvent[], day: Date, minutes: number) {
  const busy = eventsForDay(events, day).map((e) => ({
    start: new Date(e.start),
    end: new Date(e.end),
  }))
  let cursor = atTime(day, 9, 0)
  const limit = atTime(day, 18, 0)
  for (const block of [...busy].sort((a, b) => a.start.getTime() - b.start.getTime())) {
    if (block.start.getTime() - cursor.getTime() >= minutes * 60_000) {
      return { start: cursor, end: addMinutes(cursor, minutes) }
    }
    if (block.end > cursor) cursor = block.end
  }
  if (limit.getTime() - cursor.getTime() >= minutes * 60_000) {
    return { start: cursor, end: addMinutes(cursor, minutes) }
  }
  return null
}

/** the day of the current week carrying the fewest booked minutes */
export function quietestDay(events: CalendarEvent[], anchor: Date) {
  const week = startOfWeek(anchor)
  let best = { day: addDays(week, 1), load: Number.POSITIVE_INFINITY }
  for (let i = 1; i <= 5; i++) {
    const day = addDays(week, i)
    const load = eventsForDay(events, day).reduce((s, e) => s + durationMinutes(e), 0)
    if (load < best.load) best = { day, load }
  }
  return best.day
}

export function buildSuggestions(
  events: CalendarEvent[],
  anchor: Date,
  dismissed: string[],
  connections: Connection[] = [],
): Suggestion[] {
  const connected = new Set(connections.filter((c) => c.connected).map((c) => c.id))

  /** filter a list of source IDs down to only those currently connected */
  function activeSources(ids: string[]): string[] {
    return ids.filter((id) => connected.has(id))
  }

  const out: Suggestion[] = []

  // 1. resolve the first real double-booking in the week
  const week = startOfWeek(anchor)
  for (let i = 0; i < 7 && out.length < 1; i++) {
    const day = addDays(week, i)
    const conflicts = findConflicts(eventsForDay(events, day))
    if (!conflicts.length) continue
    const [, later] = conflicts[0]
    const gap = findGap(events, day, durationMinutes(later))
    const target = gap?.start ?? atTime(day, 16, 0)
    out.push({
      id: `sg-move-${later.id}`,
      icon: 'zap',
      title: `Move ${later.title} to ${target.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`,
      detail: `Save ${formatDuration(
        Math.max(15, durationMinutes(later) / 2),
      )} • Better focus time`,
      change: {
        kind: 'move',
        eventId: later.id,
        start: toLocalISO(target),
        end: toLocalISO(addMinutes(target, durationMinutes(later))),
        reason: 'Clears an overlap with an earlier meeting.',
      },
      sources: activeSources(['google-calendar', 'gmail']),
    })
  }

  // 2. protect a deep work block tomorrow
  const tomorrow = addDays(new Date(), 1)
  const gap = findGap(events, tomorrow, 120)
  if (gap) {
    const label = isSameDay(tomorrow, addDays(new Date(), 1))
      ? 'Tomorrow'
      : DAY_NAMES[tomorrow.getDay()]
    out.push({
      id: `sg-focus-${tomorrow.toDateString()}`,
      icon: 'shield',
      title: 'Protect Deep Work Block',
      detail: `${label} ${gap.start.toLocaleTimeString('en-US', {
        hour: 'numeric',
      })}–${gap.end.toLocaleTimeString('en-US', { hour: 'numeric' })}`,
      change: {
        kind: 'create',
        title: 'Deep Work',
        start: toLocalISO(gap.start),
        end: toLocalISO(gap.end),
        tone: 'green',
        calendarId: 'school',
        reason: 'Your longest uninterrupted stretch tomorrow.',
      },
      sources: activeSources(['google-calendar', 'notion']),
    })
  }

  // 3. shift a social block onto the quietest weekday
  const social = events.find((e) => e.calendarId === 'personal')
  if (social) {
    const quiet = quietestDay(events, anchor)
    if (!isSameDay(new Date(social.start), quiet)) {
      const target = atTime(quiet, 12, 30)
      out.push({
        id: `sg-social-${social.id}`,
        icon: 'users',
        title: `Reschedule ${social.title}`,
        detail: `${DAY_NAMES[quiet.getDay()]} is less crowded`,
        change: {
          kind: 'move',
          eventId: social.id,
          start: toLocalISO(target),
          end: toLocalISO(addMinutes(target, durationMinutes(social))),
          reason: `${DAY_NAMES[quiet.getDay()]} has the lightest meeting load this week.`,
        },
        sources: activeSources(['google-calendar', 'slack']),
      })
    }
  }

  return out.filter((s) => !dismissed.includes(s.id))
}

export function summarize(
  events: CalendarEvent[],
  pending: PendingChange[],
  today: Date,
) {
  const approved = pending.filter((c) => c.status === 'approved')
  const focus = eventsForDay(events, today)
    .filter((e) => e.focus)
    .reduce((s, e) => s + durationMinutes(e), 0)
  const weekFocus = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(today), i),
  ).reduce(
    (sum, day) =>
      sum +
      eventsForDay(events, day)
        .filter((e) => e.focus)
        .reduce((s, e) => s + durationMinutes(e), 0),
    0,
  )
  const conflicts = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(today), i),
  ).reduce((sum, day) => sum + findConflicts(eventsForDay(events, day)).length, 0)

  return {
    timeSavedMinutes: 135 + approved.length * 20,
    focusMinutes: focus || weekFocus / 7,
    conflictsResolved: approved.filter((c) => c.kind === 'move').length + 1,
    openConflicts: conflicts,
  }
}
