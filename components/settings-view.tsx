'use client'

import { useState } from 'react'
import {
  Bell,
  Check,
  Clock,
  Globe,
  Moon,
  Settings,
  Sun,
  Target,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { NotificationChannel } from '@/lib/types'

// ─── Timezone data ─────────────────────────────────────────────────────────────

// A curated list of common IANA timezone identifiers with friendly labels.
const TIMEZONES: { value: string; label: string; offset: string }[] = [
  { value: 'Pacific/Honolulu', label: 'Hawaii', offset: 'GMT−10' },
  { value: 'America/Anchorage', label: 'Alaska', offset: 'GMT−9' },
  { value: 'America/Los_Angeles', label: 'Pacific Time', offset: 'GMT−8/−7' },
  { value: 'America/Denver', label: 'Mountain Time', offset: 'GMT−7/−6' },
  { value: 'America/Chicago', label: 'Central Time', offset: 'GMT−6/−5' },
  { value: 'America/New_York', label: 'Eastern Time', offset: 'GMT−5/−4' },
  { value: 'America/Halifax', label: 'Atlantic Time', offset: 'GMT−4/−3' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'GMT−3' },
  { value: 'Atlantic/Azores', label: 'Azores', offset: 'GMT−1' },
  { value: 'UTC', label: 'UTC', offset: 'GMT+0' },
  { value: 'Europe/London', label: 'London', offset: 'GMT+0/+1' },
  { value: 'Europe/Paris', label: 'Paris / Berlin / Rome', offset: 'GMT+1/+2' },
  { value: 'Europe/Helsinki', label: 'Helsinki / Athens', offset: 'GMT+2/+3' },
  { value: 'Europe/Moscow', label: 'Moscow', offset: 'GMT+3' },
  { value: 'Asia/Dubai', label: 'Dubai', offset: 'GMT+4' },
  { value: 'Asia/Karachi', label: 'Karachi', offset: 'GMT+5' },
  { value: 'Asia/Kolkata', label: 'Mumbai / Delhi', offset: 'GMT+5:30' },
  { value: 'Asia/Dhaka', label: 'Dhaka', offset: 'GMT+6' },
  { value: 'Asia/Bangkok', label: 'Bangkok / Jakarta', offset: 'GMT+7' },
  { value: 'Asia/Shanghai', label: 'Beijing / Singapore', offset: 'GMT+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo / Seoul', offset: 'GMT+9' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 'GMT+10/+11' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: 'GMT+12/+13' },
]

function formatHour(h: number) {
  if (h === 0) return '12:00 AM'
  if (h === 12) return '12:00 PM'
  return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="rounded-xl border border-border bg-panel">{children}</div>
    </div>
  )
}

function Row({
  label,
  description,
  children,
  last,
}: {
  label: string
  description?: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-6 px-4 py-3.5',
        !last && 'border-b border-border',
      )}
    >
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        checked ? 'bg-brand' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'size-4 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

// ─── Saved toast ──────────────────────────────────────────────────────────────

function SavedBadge({ show }: { show: boolean }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] font-semibold text-brand-text transition-opacity duration-300',
        show ? 'opacity-100' : 'opacity-0',
      )}
    >
      <Check className="size-3" />
      Saved
    </span>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'timezone' | 'working-hours' | 'notifications'

const TABS: { id: Tab; label: string; icon: typeof Globe }[] = [
  { id: 'timezone', label: 'Timezone', icon: Globe },
  { id: 'working-hours', label: 'Working hours', icon: Clock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

// ─── Main view ────────────────────────────────────────────────────────────────

export function SettingsView() {
  const { state, updateSettings, toggleTheme } = useStore()
  const { settings } = state
  const [tab, setTab] = useState<Tab>('timezone')
  const [saved, setSaved] = useState(false)

  function save(patch: Parameters<typeof updateSettings>[0]) {
    updateSettings(patch)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // helper for notification sub-patches
  function saveNotif(patch: Partial<typeof settings.notifications>) {
    save({ notifications: patch })
  }

  const currentTz = TIMEZONES.find((t) => t.value === settings.timezone)

  return (
    <main className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* page header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Settings className="size-5 text-brand" strokeWidth={2} />
          <h1 className="text-[17px] font-semibold tracking-[-0.02em]">Settings</h1>
        </div>
        <SavedBadge show={saved} />
      </div>

      {/* tab bar */}
      <div className="flex shrink-0 gap-1 border-b border-border px-6 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-[13px] font-medium transition-colors',
              tab === t.id
                ? 'border border-b-0 border-border bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">
        {/* ── TIMEZONE TAB ── */}
        {tab === 'timezone' && (
          <>
            <Section
              title="Timezone"
              description="All calendar events are displayed in this timezone."
            >
              <Row label="Your timezone" description={currentTz?.offset ?? ''}>
                <select
                  value={settings.timezone}
                  onChange={(e) => save({ timezone: e.target.value })}
                  className="h-9 min-w-[220px] rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </select>
              </Row>
              <Row
                label="Current time in selected zone"
                description="Updates as you change the selector above"
                last
              >
                <span className="rounded-lg border border-border bg-secondary px-3 py-1.5 font-mono text-[13px]">
                  {new Date().toLocaleTimeString('en-US', {
                    timeZone: settings.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </Row>
            </Section>

            <Section
              title="Appearance"
              description="Control how the app looks."
            >
              <Row label="Theme" description="Syncs with your OS preference on first load" last>
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] text-muted-foreground">
                    {state.theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="flex size-9 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-colors hover:bg-panel"
                  >
                    {state.theme === 'dark' ? (
                      <Sun className="size-4" />
                    ) : (
                      <Moon className="size-4" />
                    )}
                  </button>
                </div>
              </Row>
            </Section>
          </>
        )}

        {/* ── WORKING HOURS TAB ── */}
        {tab === 'working-hours' && (
          <>
            <Section
              title="Working hours"
              description="The assistant only schedules meetings and focus blocks within these hours."
            >
              <Row label="Day starts">
                <select
                  value={settings.workdayStart}
                  onChange={(e) => save({ workdayStart: Number(e.target.value) })}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Day ends" last>
                <select
                  value={settings.workdayEnd}
                  onChange={(e) => save({ workdayEnd: Number(e.target.value) })}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
                >
                  {HOURS.filter((h) => h > settings.workdayStart).map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </Row>
            </Section>

            <Section
              title="Focus time preferences"
              description="Used by the AI when it suggests or creates Deep Work blocks."
            >
              <Row label="Preferred focus window start">
                <select
                  value={settings.focusStartHour}
                  onChange={(e) => save({ focusStartHour: Number(e.target.value) })}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
                >
                  {HOURS.filter(
                    (h) => h >= settings.workdayStart && h < settings.workdayEnd,
                  ).map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Preferred focus window end">
                <select
                  value={settings.focusEndHour}
                  onChange={(e) => save({ focusEndHour: Number(e.target.value) })}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
                >
                  {HOURS.filter(
                    (h) => h > settings.focusStartHour && h <= settings.workdayEnd,
                  ).map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </Row>
              <Row
                label="Minimum focus block"
                description="The assistant won't suggest blocks shorter than this"
                last
              >
                <select
                  value={settings.focusMinDuration}
                  onChange={(e) => save({ focusMinDuration: Number(e.target.value) })}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
                >
                  {[30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {m >= 60 ? `${m / 60}h` : `${m}m`}
                    </option>
                  ))}
                </select>
              </Row>
            </Section>

            {/* visual preview of working hours */}
            <div className="rounded-xl border border-border bg-panel p-4">
              <p className="mb-3 text-[12px] font-medium text-muted-foreground">
                Schedule preview
              </p>
              <div className="relative h-10 overflow-hidden rounded-lg bg-secondary">
                {/* working hours bar */}
                <div
                  className="absolute inset-y-0 bg-brand/20"
                  style={{
                    left: `${(settings.workdayStart / 24) * 100}%`,
                    width: `${((settings.workdayEnd - settings.workdayStart) / 24) * 100}%`,
                  }}
                />
                {/* focus window bar */}
                <div
                  className="absolute inset-y-0 bg-brand/50"
                  style={{
                    left: `${(settings.focusStartHour / 24) * 100}%`,
                    width: `${((settings.focusEndHour - settings.focusStartHour) / 24) * 100}%`,
                  }}
                />
                {/* hour labels */}
                {[0, 6, 12, 18].map((h) => (
                  <span
                    key={h}
                    className="absolute top-1 text-[10px] text-muted-foreground"
                    style={{ left: `${(h / 24) * 100}%` }}
                  >
                    {h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-brand/20" />
                  Working hours
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-brand/50" />
                  Focus window
                </span>
              </div>
            </div>
          </>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab === 'notifications' && (
          <>
            <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-[12.5px] text-muted-foreground">
              <span className="font-semibold text-foreground">UI only.</span> These
              preferences are saved locally and influence how the app presents information.
              No real push notifications or emails are sent in demo mode.
            </div>

            <Section
              title="Delivery channel"
              description="Where you want to receive notifications."
            >
              {(
                [
                  { id: 'push', label: 'In-app push', description: 'Badge and banner within Timeflow' },
                  { id: 'email', label: 'Email', description: 'Digest sent to your account email' },
                  { id: 'slack', label: 'Slack DM', description: 'Requires Slack to be connected' },
                ] as { id: NotificationChannel; label: string; description: string }[]
              ).map((ch, i, arr) => (
                <Row
                  key={ch.id}
                  label={ch.label}
                  description={ch.description}
                  last={i === arr.length - 1}
                >
                  <button
                    type="button"
                    onClick={() => saveNotif({ channel: ch.id })}
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border-2 transition-colors',
                      settings.notifications.channel === ch.id
                        ? 'border-brand bg-brand'
                        : 'border-input bg-background',
                    )}
                    aria-label={`Select ${ch.label}`}
                  >
                    {settings.notifications.channel === ch.id && (
                      <span className="size-2 rounded-full bg-white" />
                    )}
                  </button>
                </Row>
              ))}
            </Section>

            <Section title="Event reminders">
              <Row label="Enable reminders">
                <Toggle
                  checked={settings.notifications.enabled}
                  onChange={(v) => saveNotif({ enabled: v })}
                  label="Enable reminders"
                />
              </Row>
              <Row
                label="Reminder timing"
                description="How far in advance to remind you"
                last
              >
                <select
                  value={settings.notifications.reminderMinutes}
                  onChange={(e) =>
                    saveNotif({ reminderMinutes: Number(e.target.value) })
                  }
                  disabled={!settings.notifications.enabled}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand disabled:opacity-40"
                >
                  {[5, 10, 15, 30, 60].map((m) => (
                    <option key={m} value={m}>
                      {m >= 60 ? `${m / 60} hour before` : `${m} min before`}
                    </option>
                  ))}
                </select>
              </Row>
            </Section>

            <Section title="AI & digest notifications">
              <Row
                label="AI suggestions"
                description="Notify when the assistant has new proposed changes"
              >
                <Toggle
                  checked={settings.notifications.aiSuggestions}
                  onChange={(v) => saveNotif({ aiSuggestions: v })}
                  label="AI suggestions notifications"
                />
              </Row>
              <Row
                label="Weekly digest"
                description="Summary of time saved, focus hours, and tasks completed"
              >
                <Toggle
                  checked={settings.notifications.weeklyDigest}
                  onChange={(v) => saveNotif({ weeklyDigest: v })}
                  label="Weekly digest"
                />
              </Row>
              <Row
                label="Conflict alerts"
                description="Immediate alert when a new scheduling conflict is detected"
                last
              >
                <Toggle
                  checked={settings.notifications.conflictAlerts}
                  onChange={(v) => saveNotif({ conflictAlerts: v })}
                  label="Conflict alerts"
                />
              </Row>
            </Section>
          </>
        )}
      </div>
    </main>
  )
}
