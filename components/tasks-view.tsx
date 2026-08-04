'use client'

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  Circle,
  Link2,
  ListTodo,
  Plus,
  Trash2,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Task, TaskPriority } from '@/lib/types'

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: string; dot: string }
> = {
  high: {
    label: 'High',
    color: 'text-[var(--ev-red-rail)]',
    dot: 'bg-[var(--ev-red-rail)]',
  },
  medium: {
    label: 'Medium',
    color: 'text-[var(--ev-amber-rail)]',
    dot: 'bg-[var(--ev-amber-rail)]',
  },
  low: {
    label: 'Low',
    color: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
}

const CALENDAR_COLORS: Record<string, string> = {
  work: 'var(--ev-blue-rail)',
  personal: 'var(--ev-violet-rail)',
  school: 'var(--ev-green-rail)',
  fitness: 'var(--ev-red-rail)',
}

type Filter = 'all' | 'pending' | 'done'

function formatDue(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isOverdue(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

export function TasksView() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newCalendar, setNewCalendar] = useState('work')
  const [addOpen, setAddOpen] = useState(false)

  const tasks = useMemo(() => {
    const base = state.tasks.slice().sort((a, b) => {
      // sort: undone first, then by due date, then priority weight
      if (a.done !== b.done) return a.done ? 1 : -1
      const dateSort = a.dueDate.localeCompare(b.dueDate)
      if (dateSort !== 0) return dateSort
      const pw: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }
      return pw[a.priority] - pw[b.priority]
    })
    if (filter === 'pending') return base.filter((t) => !t.done)
    if (filter === 'done') return base.filter((t) => t.done)
    return base
  }, [state.tasks, filter])

  const doneCount = state.tasks.filter((t) => t.done).length
  const totalCount = state.tasks.length

  function addTask() {
    if (!newTitle.trim() || !newDue) return
    const task: Task = {
      id: `t-${Date.now().toString(36)}`,
      title: newTitle.trim(),
      dueDate: newDue,
      done: false,
      priority: newPriority,
      calendarId: newCalendar,
    }
    dispatch({ type: 'addTask', task })
    setNewTitle('')
    setNewDue('')
    setNewPriority('medium')
    setAddOpen(false)
  }

  const linkedEvent = (task: Task) =>
    task.linkedEventId
      ? state.events.find((e) => e.id === task.linkedEventId)
      : undefined

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <ListTodo className="size-5 text-brand" strokeWidth={2} />
          <div>
            <h1 className="text-[17px] font-semibold tracking-[-0.02em]">Tasks</h1>
            <p className="text-[12px] text-muted-foreground">
              {doneCount} of {totalCount} complete
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:brightness-95"
        >
          <Plus className="size-4" />
          New task
        </button>
      </div>

      {/* add-task form */}
      {addOpen && (
        <div className="shrink-0 border-b border-border bg-secondary/40 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Title</span>
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="What needs to be done?"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Due date</span>
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Priority</span>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Calendar</span>
              <select
                value={newCalendar}
                onChange={(e) => setNewCalendar(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
              >
                {state.calendars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addTask}
                disabled={!newTitle.trim() || !newDue}
                className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-95 disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="h-9 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* filter tabs */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-6 py-2">
        {(['all', 'pending', 'done'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize transition-colors',
              filter === f
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {f}
          </button>
        ))}
        {/* progress bar */}
        <div className="ml-auto flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground">
            {totalCount ? Math.round((doneCount / totalCount) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* task list */}
      <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Check className="size-10 text-brand opacity-30" strokeWidth={1.5} />
            <p className="text-[14px] text-muted-foreground">
              {filter === 'done' ? 'No completed tasks yet.' : 'All clear — no tasks here.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {tasks.map((task) => {
              const ev = linkedEvent(task)
              const overdue = !task.done && isOverdue(task.dueDate)
              const pm = PRIORITY_META[task.priority]
              const calColor = CALENDAR_COLORS[task.calendarId] ?? 'var(--brand)'

              return (
                <li
                  key={task.id}
                  className={cn(
                    'group flex items-start gap-3 rounded-xl border border-border bg-panel px-4 py-3 transition-opacity',
                    task.done && 'opacity-60',
                  )}
                >
                  {/* checkbox */}
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'toggleTask', id: task.id })}
                    aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
                    className="mt-0.5 flex shrink-0 items-center justify-center"
                  >
                    {task.done ? (
                      <Check
                        className="size-5 rounded-full text-brand"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Circle
                        className="size-5 text-muted-foreground transition-colors hover:text-brand"
                        strokeWidth={1.8}
                      />
                    )}
                  </button>

                  {/* content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-[14px] font-medium leading-snug',
                        task.done && 'line-through text-muted-foreground',
                      )}
                    >
                      {task.title}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {/* due date */}
                      <span
                        className={cn(
                          'flex items-center gap-1 text-[11.5px]',
                          overdue ? 'font-semibold text-destructive' : 'text-muted-foreground',
                        )}
                      >
                        <CalendarDays className="size-3" />
                        {formatDue(task.dueDate)}
                      </span>

                      {/* priority dot */}
                      <span className={cn('flex items-center gap-1 text-[11.5px]', pm.color)}>
                        <span className={cn('size-1.5 rounded-full', pm.dot)} />
                        {pm.label}
                      </span>

                      {/* calendar tag */}
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          background: `color-mix(in oklab, ${calColor} 14%, transparent)`,
                          color: calColor,
                        }}
                      >
                        {state.calendars.find((c) => c.id === task.calendarId)?.name ??
                          task.calendarId}
                      </span>

                      {/* linked event */}
                      {ev && (
                        <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                          <Link2 className="size-3" />
                          {ev.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* delete */}
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'deleteTask', id: task.id })}
                    aria-label="Delete task"
                    className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-4" strokeWidth={1.8} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
