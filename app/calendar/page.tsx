'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { AiPanel } from '@/components/ai-panel'
import { ApprovalCard } from '@/components/approval-card'
import { CalendarHeader, type CalendarView } from '@/components/calendar-header'
import { CommandPalette } from '@/components/command-palette'
import { DayView } from '@/components/day-view'
import { EventDialog } from '@/components/event-dialog'
import { Modal, ModalHeader } from '@/components/modal'
import { MonthView } from '@/components/month-view'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { WeekGrid } from '@/components/week-grid'
import { useAssistant } from '@/hooks/use-assistant'
import { useStore } from '@/lib/store'
import { addDays, atTime, addMinutes, toLocalISO } from '@/lib/time'
import type { CalendarEvent } from '@/lib/types'

export default function CalendarPage() {
  const { state, dispatch, pendingCount } = useStore()
  const { send } = useAssistant()

  const [anchor, setAnchor] = useState(() => new Date())
  const [view, setView] = useState<CalendarView>('Week')
  const [collapsed, setCollapsed] = useState(false)
  const [expandedPanel, setExpandedPanel] = useState(false)

  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [createTemplate, setCreateTemplate] = useState<CalendarEvent | null>(null)

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [changesOpen, setChangesOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => {
      setCollapsed(!mq.matches)
      if (mq.matches) setAssistantOpen(false)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const step = view === 'Day' ? 1 : view === 'Week' ? 7 : 0
  const shift = useCallback(
    (direction: 1 | -1) => {
      setAnchor((current) => {
        if (view === 'Month') {
          const next = new Date(current)
          next.setMonth(next.getMonth() + direction)
          return next
        }
        return addDays(current, step * direction)
      })
    },
    [view, step],
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function openNewEvent() {
    const hour = Math.max(8, new Date().getHours() + 1)
    const start = atTime(anchor, hour, 0)
    const template: CalendarEvent = {
      id: '',
      title: '',
      start: toLocalISO(start),
      end: toLocalISO(addMinutes(start, 60)),
      calendarId: 'work',
      tone: 'blue',
      attendees: [],
    }
    setCreateTemplate(template)
  }

  const resolved = state.pending.filter((c) => c.status !== 'pending')
  const open = state.pending.filter((c) => c.status === 'pending')

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        active="calendar"
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onViewChanges={() => setChangesOpen(true)}
        pendingCount={pendingCount}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenSearch={() => setPaletteOpen(true)} onNewEvent={openNewEvent} />

        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col px-4 pb-4 sm:px-5">
            <CalendarHeader
              anchor={anchor}
              view={view}
              onView={setView}
              onPrev={() => shift(-1)}
              onNext={() => shift(1)}
              onToday={() => setAnchor(new Date())}
            />

            {view === 'Week' ? (
              <WeekGrid
                anchor={anchor}
                onOpenEvent={(e) => setEditEvent(e)}
                onCreateAt={(template) => setCreateTemplate(template)}
              />
            ) : view === 'Day' ? (
              <DayView anchor={anchor} onOpenEvent={(e) => setEditEvent(e)} />
            ) : (
              <MonthView anchor={anchor} onOpenEvent={(e) => setEditEvent(e)} />
            )}
          </main>

          <div className="hidden lg:block">
            <AiPanel
              expanded={expandedPanel}
              onToggleExpanded={() => setExpandedPanel((e) => !e)}
              onEditEvent={(eventId) => {
                const ev = state.events.find((e) => e.id === eventId)
                if (ev) setEditEvent(ev)
              }}
            />
          </div>
        </div>
      </div>

      {/* Below lg: floating AI button */}
      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        aria-label={
          pendingCount
            ? `Open AI assistant, ${pendingCount} changes awaiting approval`
            : 'Open AI assistant'
        }
        className="fixed bottom-4 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 lg:hidden"
      >
        <Sparkles className="size-5" strokeWidth={2.2} aria-hidden />
        {pendingCount ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
            {pendingCount}
          </span>
        ) : null}
      </button>

      {assistantOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-foreground/25 backdrop-blur-[2px] lg:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssistantOpen(false)
          }}
        >
          <div className="relative flex h-full w-[min(100%,340px)] animate-in slide-in-from-right duration-200">
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              aria-label="Close assistant"
              className="absolute -left-11 top-4 flex size-9 items-center justify-center rounded-full bg-panel text-muted-foreground shadow-md"
            >
              <X className="size-4" aria-hidden />
            </button>
            <AiPanel
              expanded
              onToggleExpanded={() => setAssistantOpen(false)}
              onEditEvent={(eventId) => {
                const ev = state.events.find((e) => e.id === eventId)
                if (ev) {
                  setAssistantOpen(false)
                  setEditEvent(ev)
                }
              }}
              className="w-full"
            />
          </div>
        </div>
      ) : null}

      <EventDialog
        event={editEvent}
        onClose={() => setEditEvent(null)}
      />

      <EventDialog
        event={null}
        newEventTemplate={createTemplate}
        onClose={() => setCreateTemplate(null)}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenEvent={(e) => setEditEvent(e)}
        onAsk={(prompt) => {
          send(prompt)
          setPaletteOpen(false)
          setExpandedPanel(true)
        }}
      />

      <Modal
        open={changesOpen}
        onClose={() => setChangesOpen(false)}
        label="Proposed changes"
      >
        <ModalHeader
          title="Proposed changes"
          subtitle={
            open.length
              ? `${open.length} waiting for your approval`
              : 'Nothing waiting on you right now'
          }
          onClose={() => setChangesOpen(false)}
        >
          {open.length > 1 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'approveAll' })}
              className="shrink-0 rounded-lg bg-accent px-2.5 py-1 text-[12px] font-semibold text-accent-foreground transition-colors hover:bg-accent/70"
            >
              Approve all
            </button>
          ) : null}
        </ModalHeader>

        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto px-5 py-4">
          {state.pending.length ? (
            <>
              {open.map((change) => (
                <ApprovalCard key={change.id} change={change} />
              ))}
              {resolved.length ? (
                <>
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      History
                    </p>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'clearResolved' })}
                      className="text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  {resolved.map((change) => (
                    <ApprovalCard key={change.id} change={change} />
                  ))}
                </>
              ) : null}
            </>
          ) : (
            <p className="py-6 text-center text-[13px] leading-relaxed text-muted-foreground">
              Ask the assistant to reshape your week. Every change it drafts lands
              here for approval before it touches your calendar.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
