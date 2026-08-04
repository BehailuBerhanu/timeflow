'use client'

import {
  CalendarCheck,
  Calendar as CalendarIcon,
  ChartNoAxesColumn,
  Check,
  ChevronsLeft,
  House,
  Link2,
  ListTodo,
  Moon,
  Plus,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/types'

const NAV = [
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon, href: '/' },
  { id: 'home', label: 'Home', icon: House, href: '/' },
  { id: 'tasks', label: 'Tasks', icon: ListTodo, href: '/' },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck, href: '/' },
  { id: 'analytics', label: 'Analytics', icon: ChartNoAxesColumn, href: '/' },
  { id: 'connections', label: 'Connections', icon: Link2, href: '/connections' },
]

const TONE_SWATCH: Record<Tone, string> = {
  blue: 'var(--ev-blue-rail)',
  violet: 'var(--ev-violet-rail)',
  green: 'var(--ev-green-rail)',
  red: 'var(--ev-red-rail)',
  amber: 'var(--ev-amber-rail)',
  teal: 'var(--ev-teal-rail)',
}

export function Sidebar({
  active,
  collapsed,
  onToggleCollapsed,
  onViewChanges,
  pendingCount,
}: {
  active: string
  collapsed: boolean
  onToggleCollapsed: () => void
  onViewChanges: () => void
  pendingCount: number
}) {
  const { state, dispatch, toggleTheme } = useStore()

  return (
    <nav
      aria-label="Main"
      className={cn(
        'flex shrink-0 flex-col gap-6 border-r border-border bg-sidebar py-4 transition-[width] duration-200',
        collapsed ? 'w-[68px] px-2.5' : 'w-[212px] px-3',
      )}
    >
      <ul className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const isActive = item.id === active
          return (
            <li key={item.id}>
              <a
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-secondary-foreground/80 hover:bg-secondary hover:text-foreground',
                )}
              >
                <item.icon className="size-[18px] shrink-0" aria-hidden />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </a>
            </li>
          )
        })}
      </ul>

      {!collapsed ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-medium text-muted-foreground">Calendars</h2>
            <button
              type="button"
              aria-label="Add calendar"
              className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </div>
          <ul className="flex flex-col">
            {state.calendars.map((cal) => (
              <li key={cal.id}>
                <label className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm transition-colors hover:bg-secondary">
                  <input
                    type="checkbox"
                    checked={cal.enabled}
                    onChange={() => dispatch({ type: 'toggleCalendar', id: cal.id })}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="flex size-[17px] items-center justify-center rounded-[5px] border transition-colors"
                    style={
                      cal.enabled
                        ? {
                            backgroundColor: TONE_SWATCH[cal.tone],
                            borderColor: TONE_SWATCH[cal.tone],
                          }
                        : { borderColor: 'var(--input)' }
                    }
                  >
                    {cal.enabled ? (
                      <Check className="size-3 text-white" strokeWidth={3} />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      'truncate',
                      cal.enabled ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {cal.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-3">
        {!collapsed ? (
          <div className="rounded-xl border border-border bg-panel p-3">
            <div className="flex gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <p className="text-[13px] font-medium leading-[1.45] text-pretty">
                {pendingCount
                  ? `${pendingCount} change${pendingCount > 1 ? 's' : ''} need your approval`
                  : 'AI is optimizing your schedule'}
              </p>
            </div>
            <button
              type="button"
              onClick={onViewChanges}
              className="mt-3 h-8 w-full rounded-lg bg-accent text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/70"
            >
              View changes
            </button>
          </div>
        ) : null}

        <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            className="flex size-10 items-center justify-center rounded-xl border border-border bg-panel text-muted-foreground transition-colors hover:text-foreground"
          >
            {state.theme === 'dark' ? (
              <Moon className="size-[18px]" aria-hidden />
            ) : (
              <Sun className="size-[18px]" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex size-10 items-center justify-center rounded-xl border border-border bg-panel text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronsLeft
              className={cn('size-[18px] transition-transform', collapsed && 'rotate-180')}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </nav>
  )
}
