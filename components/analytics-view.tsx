'use client'

import { useMemo } from 'react'
import {
  ChartNoAxesColumn,
  CircleCheck,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  addDays,
  durationMinutes,
  eventsForDay,
  findConflicts,
  formatDuration,
  startOfWeek,
} from '@/lib/time'
import { cn } from '@/lib/utils'

const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4']

/** build 4 weeks of mock analytics anchored to the current week */
function buildWeeklyData(events: import('@/lib/types').CalendarEvent[], now: Date) {
  return Array.from({ length: 4 }, (_, weekOffset) => {
    // weekOffset 0 = current week, 3 = 3 weeks ago
    const weekStart = startOfWeek(addDays(now, -(3 - weekOffset) * 7))

    let meetingMinutes = 0
    let focusMinutes = 0
    let conflicts = 0
    let tasksDone = 0

    for (let d = 0; d < 7; d++) {
      const day = addDays(weekStart, d)
      const dayEvents = eventsForDay(events, day)
      for (const e of dayEvents) {
        const dur = durationMinutes(e)
        if (e.focus) {
          focusMinutes += dur
        } else {
          meetingMinutes += dur
        }
      }
      conflicts += findConflicts(dayEvents).length
    }

    // mock tasks done: slightly increases each week
    tasksDone = 2 + weekOffset + Math.floor(Math.random() * 3)

    return {
      label: WEEK_LABELS[weekOffset],
      meetingMinutes,
      focusMinutes,
      conflicts,
      tasksDone,
      // time saved is 135 base + approved changes × 20 — use seed value
      timeSavedMinutes: 80 + weekOffset * 25 + Math.floor(Math.random() * 20),
    }
  })
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  trend,
}: {
  icon: typeof CircleCheck
  label: string
  value: string
  sub?: string
  accent: string
  trend?: 'up' | 'down' | 'flat'
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-4">
      <div className="flex items-center justify-between">
        <span
          className="flex size-8 items-center justify-center rounded-full"
          style={{
            background: `color-mix(in oklab, ${accent} 14%, transparent)`,
            color: accent,
          }}
        >
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              trend === 'up' && 'bg-[var(--ev-green)] text-[var(--ev-green-fg)]',
              trend === 'down' && 'bg-[var(--ev-red)] text-[var(--ev-red-fg)]',
              trend === 'flat' && 'bg-secondary text-muted-foreground',
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} vs last week
          </span>
        )}
      </div>
      <div>
        <p className="text-[26px] font-bold leading-none tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">{label}</p>
        {sub && (
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">{sub}</p>
        )}
      </div>
    </div>
  )
}

/** Minimal bar chart — pure CSS, no charting library needed */
function BarChart({
  data,
  maxVal,
  color,
  label,
}: {
  data: { label: string; value: number }[]
  maxVal: number
  color: string
  label: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <div className="flex items-end gap-3">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold text-foreground">
              {d.value > 60 ? `${Math.round(d.value / 60)}h` : `${d.value}m`}
            </span>
            <div className="relative w-full overflow-hidden rounded-t-md bg-secondary" style={{ height: 80 }}>
              <div
                className="absolute bottom-0 w-full rounded-t-md transition-[height] duration-500"
                style={{
                  height: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%`,
                  background: color,
                  opacity: 0.85,
                }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConflictRow({
  label,
  count,
  max,
}: {
  label: string
  count: number
  max: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-right text-[11px] text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-destructive/60 transition-[width] duration-500"
          style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
        />
      </div>
      <span className="w-4 text-right text-[11px] font-semibold text-foreground">
        {count}
      </span>
    </div>
  )
}

export function AnalyticsView() {
  const { state } = useStore()
  const now = useMemo(() => new Date(), [])

  const weekly = useMemo(
    () => buildWeeklyData(state.events, now),
    [state.events, now],
  )

  const thisWeek = weekly[3]
  const lastWeek = weekly[2]

  const focusTrend =
    thisWeek.focusMinutes > lastWeek.focusMinutes
      ? 'up'
      : thisWeek.focusMinutes < lastWeek.focusMinutes
        ? 'down'
        : 'flat'

  const meetingTrend =
    thisWeek.meetingMinutes < lastWeek.meetingMinutes
      ? 'up'
      : thisWeek.meetingMinutes > lastWeek.meetingMinutes
        ? 'down'
        : 'flat'

  const maxFocus = Math.max(...weekly.map((w) => w.focusMinutes), 1)
  const maxMeeting = Math.max(...weekly.map((w) => w.meetingMinutes), 1)
  const maxConflicts = Math.max(...weekly.map((w) => w.conflicts), 1)

  const approvedChanges = state.pending.filter((c) => c.status === 'approved').length
  const timeSaved = 135 + approvedChanges * 20

  return (
    <main className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* page header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
        <ChartNoAxesColumn className="size-5 text-brand" strokeWidth={2} />
        <div>
          <h1 className="text-[17px] font-semibold tracking-[-0.02em]">Analytics</h1>
          <p className="text-[12px] text-muted-foreground">4-week overview</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">
        {/* summary stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={CircleCheck}
            label="Time saved this week"
            value={formatDuration(timeSaved)}
            sub={`${approvedChanges} AI changes applied`}
            accent="var(--brand)"
            trend="up"
          />
          <StatCard
            icon={Target}
            label="Focus time this week"
            value={formatDuration(thisWeek.focusMinutes)}
            accent="var(--chart-4)"
            trend={focusTrend}
          />
          <StatCard
            icon={Shield}
            label="Meeting hours this week"
            value={formatDuration(thisWeek.meetingMinutes)}
            accent="var(--chart-2)"
            trend={meetingTrend}
          />
          <StatCard
            icon={TrendingUp}
            label="Tasks completed this week"
            value={String(thisWeek.tasksDone)}
            accent="var(--chart-5)"
            trend={thisWeek.tasksDone >= lastWeek.tasksDone ? 'up' : 'down'}
          />
        </div>

        {/* charts row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* focus chart */}
          <div className="rounded-xl border border-border bg-panel p-4">
            <BarChart
              label="Focus time (4 weeks)"
              data={weekly.map((w) => ({ label: w.label, value: w.focusMinutes }))}
              maxVal={maxFocus}
              color="var(--ev-green-rail)"
            />
          </div>

          {/* meeting chart */}
          <div className="rounded-xl border border-border bg-panel p-4">
            <BarChart
              label="Meeting time (4 weeks)"
              data={weekly.map((w) => ({ label: w.label, value: w.meetingMinutes }))}
              maxVal={maxMeeting}
              color="var(--ev-blue-rail)"
            />
          </div>
        </div>

        {/* conflicts + tasks row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* conflicts */}
          <div className="rounded-xl border border-border bg-panel p-4">
            <p className="mb-4 text-[12px] font-medium text-muted-foreground">
              Scheduling conflicts (4 weeks)
            </p>
            <div className="flex flex-col gap-2.5">
              {weekly.map((w) => (
                <ConflictRow
                  key={w.label}
                  label={w.label}
                  count={w.conflicts}
                  max={maxConflicts}
                />
              ))}
            </div>
            {weekly.every((w) => w.conflicts === 0) && (
              <p className="pt-2 text-center text-[12px] text-muted-foreground">
                No conflicts detected 🎉
              </p>
            )}
          </div>

          {/* time saved bar */}
          <div className="rounded-xl border border-border bg-panel p-4">
            <p className="mb-4 text-[12px] font-medium text-muted-foreground">
              Time saved by AI (4 weeks)
            </p>
            <BarChart
              label=""
              data={weekly.map((w) => ({ label: w.label, value: w.timeSavedMinutes }))}
              maxVal={Math.max(...weekly.map((w) => w.timeSavedMinutes), 1)}
              color="var(--brand)"
            />
          </div>
        </div>

        {/* calendar breakdown */}
        <div className="rounded-xl border border-border bg-panel p-4">
          <p className="mb-4 text-[12px] font-medium text-muted-foreground">
            This week — time by calendar
          </p>
          <div className="flex flex-col gap-2">
            {state.calendars.map((cal) => {
              const weekStart = startOfWeek(now)
              const totalMin = Array.from({ length: 7 }, (_, i) =>
                eventsForDay(
                  state.events.filter((e) => e.calendarId === cal.id),
                  addDays(weekStart, i),
                ).reduce((s, e) => s + durationMinutes(e), 0),
              ).reduce((a, b) => a + b, 0)

              const allMin = Array.from({ length: 7 }, (_, i) =>
                eventsForDay(state.events, addDays(weekStart, i)).reduce(
                  (s, e) => s + durationMinutes(e),
                  0,
                ),
              ).reduce((a, b) => a + b, 0)

              const pct = allMin > 0 ? (totalMin / allMin) * 100 : 0

              const SWATCH: Record<string, string> = {
                blue: 'var(--ev-blue-rail)',
                violet: 'var(--ev-violet-rail)',
                green: 'var(--ev-green-rail)',
                red: 'var(--ev-red-rail)',
                amber: 'var(--ev-amber-rail)',
                teal: 'var(--ev-teal-rail)',
              }
              const color = SWATCH[cal.tone] ?? 'var(--brand)'

              return (
                <div key={cal.id} className="flex items-center gap-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="w-20 text-[12px] text-foreground">{cal.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className="w-14 text-right text-[11px] text-muted-foreground">
                    {formatDuration(totalMin)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
