'use client'

import { useMemo } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  Circle,
  Clock,
  Link2,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'
import { useStore } from '@/lib/store'
import { useUser } from '@/hooks/use-user'
import {
  addDays,
  durationMinutes,
  eventsForDay,
  findConflicts,
  formatDuration,
  formatRange,
} from '@/lib/time'
import { cn } from '@/lib/utils'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDueShort(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function HomeView() {
  const { state } = useStore()
  const user = useUser()
  const now = useMemo(() => new Date(), [])

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    'there'
  const firstName = displayName.split(/\s+/)[0]
  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture

  // Today's events, sorted by start time
  const todayEvents = useMemo(
    () =>
      eventsForDay(state.events, now).filter((e) =>
        state.calendars.find((c) => c.id === e.calendarId)?.enabled,
      ),
    [state.events, state.calendars, now],
  )

  // Next upcoming event (after now)
  const nextEvent = useMemo(
    () => todayEvents.find((e) => new Date(e.end) > now),
    [todayEvents, now],
  )

  // Today's focus minutes
  const focusToday = useMemo(
    () =>
      todayEvents
        .filter((e) => e.focus)
        .reduce((s, e) => s + durationMinutes(e), 0),
    [todayEvents],
  )

  // Today's meeting count
  const meetingCount = todayEvents.filter((e) => !e.focus).length

  // Conflicts today
  const conflictsToday = findConflicts(todayEvents).length

  // Pending tasks due today or overdue (not done)
  const urgentTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return state.tasks
      .filter((t) => {
        if (t.done) return false
        const d = new Date(t.dueDate + 'T00:00:00')
        return d <= addDays(today, 1) // today + tomorrow
      })
      .slice(0, 5)
  }, [state.tasks])

  // Pending approvals
  const pendingChanges = state.pending.filter((c) => c.status === 'pending')

  // Active booking links
  const activeLinks = state.bookingLinks.filter((l) => l.active)

  // Tomorrow's events
  const tomorrow = addDays(now, 1)
  const tomorrowEvents = useMemo(
    () =>
      eventsForDay(state.events, tomorrow).filter((e) =>
        state.calendars.find((c) => c.id === e.calendarId)?.enabled,
      ),
    [state.events, state.calendars, tomorrow],
  )

  const TONE_SWATCH: Record<string, string> = {
    blue: 'var(--ev-blue-rail)',
    violet: 'var(--ev-violet-rail)',
    green: 'var(--ev-green-rail)',
    red: 'var(--ev-red-rail)',
    amber: 'var(--ev-amber-rail)',
    teal: 'var(--ev-teal-rail)',
  }

  return (
    <main className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* header */}
      <div className="flex shrink-0 items-center gap-4 border-b border-border px-6 py-5">
        {user === undefined ? (
          // loading skeleton
          <span className="size-11 animate-pulse rounded-full bg-secondary" />
        ) : avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={44}
            height={44}
            className="size-11 rounded-full object-cover ring-2 ring-brand/30"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-11 items-center justify-center rounded-full bg-brand text-[15px] font-semibold text-primary-foreground dark:text-[#04160b]">
            {firstName.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.02em]">
            {greeting()}, {user === undefined ? '…' : firstName} 👋
          </h1>
          <p className="text-[12px] text-muted-foreground">
            {now.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-5">
        {/* stat row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: CalendarDays,
              label: 'Meetings today',
              value: String(meetingCount),
              accent: 'var(--ev-blue-rail)',
            },
            {
              icon: Clock,
              label: 'Focus time today',
              value: focusToday ? formatDuration(focusToday) : '—',
              accent: 'var(--ev-green-rail)',
            },
            {
              icon: Sparkles,
              label: 'Pending approvals',
              value: String(pendingChanges.length),
              accent: 'var(--brand)',
            },
            {
              icon: CalendarCheck,
              label: 'Active booking links',
              value: String(activeLinks.length),
              accent: 'var(--chart-5)',
            },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div
              key={label}
              className="flex flex-col gap-2 rounded-xl border border-border bg-panel p-3.5"
            >
              <span
                className="flex size-7 items-center justify-center rounded-full"
                style={{
                  background: `color-mix(in oklab, ${accent} 14%, transparent)`,
                  color: accent,
                }}
              >
                <Icon className="size-3.5" strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-[22px] font-bold leading-none tracking-tight">{value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {conflictsToday > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-[13px]">
            <span className="size-2 shrink-0 rounded-full bg-destructive" />
            <span>
              <strong>{conflictsToday}</strong> scheduling conflict
              {conflictsToday > 1 ? 's' : ''} today.{' '}
              <a href="/" className="font-medium text-brand-text underline-offset-2 hover:underline">
                View calendar
              </a>
            </span>
          </div>
        )}

        {/* main two-col grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* today's schedule */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-foreground">
                Today&rsquo;s schedule
              </p>
              <a
                href="/"
                className="flex items-center gap-1 text-[12px] font-medium text-brand-text hover:underline"
              >
                Open calendar <ArrowRight className="size-3.5" />
              </a>
            </div>

            {todayEvents.length === 0 ? (
              <div className="rounded-xl border border-border bg-panel px-4 py-8 text-center text-[13px] text-muted-foreground">
                Nothing on the calendar today.
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {todayEvents.map((ev) => {
                  const isNext = nextEvent?.id === ev.id
                  const isPast = new Date(ev.end) < now
                  const calColor =
                    TONE_SWATCH[
                      state.calendars.find((c) => c.id === ev.calendarId)?.tone ?? ''
                    ] ?? 'var(--brand)'

                  return (
                    <li
                      key={ev.id}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border border-border bg-panel px-3.5 py-3 transition-opacity',
                        isPast && 'opacity-50',
                      )}
                    >
                      <span
                        aria-hidden
                        className="mt-1 size-2 shrink-0 rounded-full"
                        style={{ background: calColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13px] font-medium">{ev.title}</p>
                          {isNext && (
                            <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-text">
                              Next
                            </span>
                          )}
                          {ev.aiTouched && (
                            <Sparkles className="size-3 shrink-0 text-brand" aria-label="AI adjusted" />
                          )}
                        </div>
                        <p className="text-[11.5px] text-muted-foreground">
                          {formatRange(ev.start, ev.end)}
                          {ev.attendees.length > 0 &&
                            ` · ${ev.attendees.length} attendee${ev.attendees.length > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* tomorrow preview */}
            {tomorrowEvents.length > 0 && (
              <div className="mt-1">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Tomorrow
                </p>
                <ul className="flex flex-col gap-1">
                  {tomorrowEvents.slice(0, 3).map((ev) => {
                    const calColor =
                      TONE_SWATCH[
                        state.calendars.find((c) => c.id === ev.calendarId)?.tone ?? ''
                      ] ?? 'var(--brand)'
                    return (
                      <li key={ev.id} className="flex items-center gap-2.5 py-0.5">
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: calColor }}
                        />
                        <span className="truncate text-[12.5px] text-foreground">{ev.title}</span>
                        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                          {new Date(ev.start).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </li>
                    )
                  })}
                  {tomorrowEvents.length > 3 && (
                    <li className="text-[11.5px] text-muted-foreground">
                      +{tomorrowEvents.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* right column */}
          <div className="flex flex-col gap-4">
            {/* urgent tasks */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-foreground">
                  Tasks due soon
                </p>
                <a
                  href="/tasks"
                  className="flex items-center gap-1 text-[12px] font-medium text-brand-text hover:underline"
                >
                  All tasks <ArrowRight className="size-3.5" />
                </a>
              </div>

              {urgentTasks.length === 0 ? (
                <div className="rounded-xl border border-border bg-panel px-4 py-6 text-center text-[13px] text-muted-foreground">
                  You&rsquo;re all caught up 🎉
                </div>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {urgentTasks.map((t) => {
                    const isOverdue =
                      new Date(t.dueDate + 'T00:00:00') < new Date(new Date().toDateString())
                    return (
                      <li
                        key={t.id}
                        className="flex items-start gap-3 rounded-xl border border-border bg-panel px-3.5 py-3"
                      >
                        {t.done ? (
                          <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.5} />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-[13px] font-medium',
                              t.done && 'line-through text-muted-foreground',
                            )}
                          >
                            {t.title}
                          </p>
                          <p
                            className={cn(
                              'text-[11.5px]',
                              isOverdue && !t.done
                                ? 'font-semibold text-destructive'
                                : 'text-muted-foreground',
                            )}
                          >
                            {formatDueShort(t.dueDate)}
                          </p>
                        </div>
                        {t.linkedEventId && (
                          <Link2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* pending AI changes */}
            {pendingChanges.length > 0 && (
              <div className="flex flex-col gap-2 rounded-xl border border-brand/30 bg-brand-soft/60 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-brand" strokeWidth={2.2} />
                  <p className="text-[13px] font-semibold text-foreground">
                    {pendingChanges.length} AI change
                    {pendingChanges.length > 1 ? 's' : ''} waiting
                  </p>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  The assistant has proposed updates to your calendar. Review them
                  before they take effect.
                </p>
                <a
                  href="/"
                  className="mt-1 inline-flex items-center gap-1.5 self-start rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:brightness-95"
                >
                  Review changes <ArrowRight className="size-3.5" />
                </a>
              </div>
            )}

            {/* active booking links */}
            {activeLinks.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-foreground">
                    Your booking links
                  </p>
                  <a
                    href="/bookings"
                    className="flex items-center gap-1 text-[12px] font-medium text-brand-text hover:underline"
                  >
                    Manage <ArrowRight className="size-3.5" />
                  </a>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {activeLinks.map((link) => (
                    <li
                      key={link.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-panel px-3.5 py-2.5"
                    >
                      <Clock className="size-3.5 shrink-0 text-brand" />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                        {link.title}
                      </span>
                      <span className="shrink-0 text-[11.5px] text-muted-foreground">
                        {link.durationMinutes} min
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
