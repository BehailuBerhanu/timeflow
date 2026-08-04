'use client'

import { useState } from 'react'
import { ArrowRight, CalendarPlus, ArrowRightLeft, Trash2, Sparkles } from 'lucide-react'
import { Modal, ModalHeader } from './modal'
import { useStore } from '@/lib/store'
import { formatRange } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { Suggestion } from '@/lib/types'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function DiffRow({
  label,
  before,
  after,
  changed,
}: {
  label: string
  before: string
  after: string
  changed: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-[13px]',
            changed
              ? 'border-destructive/30 bg-destructive/8 text-foreground line-through opacity-70'
              : 'border-border bg-secondary text-foreground',
          )}
        >
          {before}
        </span>
        {changed && (
          <>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1 rounded-lg border border-brand/40 bg-brand-soft px-3 py-2 text-[13px] font-medium text-brand-text">
              {after}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export function SuggestionDiffModal({
  suggestion,
  onClose,
  onApproved,
  onEdit,
}: {
  suggestion: Suggestion | null
  onClose: () => void
  onApproved: () => void
  onEdit: (eventId?: string) => void
}) {
  const { state, dispatch, queueProposals } = useStore()
  const [approved, setApproved] = useState(false)

  if (!suggestion) return null

  // resolve source IDs → display names using live connection state
  const sourceNames = suggestion.sources
    .map((id) => state.connections.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[]

  const change = suggestion.change

  // resolve event for move/delete so we can show before state
  const existingEvent =
    change.kind !== 'create'
      ? state.events.find((e) => e.id === change.eventId)
      : null

  function approve() {
    const [id] = queueProposals([change])
    if (id) {
      // immediately approve it so it lands on the calendar right away
      dispatch({ type: 'resolveChange', id, approved: true })
    }
    setApproved(true)
    setTimeout(onApproved, 800)
  }

  function dismiss() {
    dispatch({ type: 'dismissSuggestion', id: suggestion!.id })
    onClose()
  }

  const kindMeta = {
    create: { icon: CalendarPlus, label: 'New event', accent: 'green' },
    move: { icon: ArrowRightLeft, label: 'Reschedule', accent: 'blue' },
    delete: { icon: Trash2, label: 'Remove event', accent: 'red' },
  } as const

  const meta = kindMeta[change.kind]
  const KindIcon = meta.icon

  return (
    <Modal open onClose={onClose} label="Review AI suggestion">
      <ModalHeader
        title={suggestion.title}
        subtitle="Review the proposed change before it touches your calendar"
        onClose={onClose}
      />

      <div className="flex flex-col gap-4 px-5 py-4">
        {/* kind badge + reason */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <span
            data-tone={meta.accent}
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--chip-bg)] text-[var(--chip-rail)]"
          >
            <KindIcon className="size-3.5" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {meta.label}
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-foreground">
              {change.reason}
            </p>
          </div>
        </div>

        {/* diff rows */}
        <div className="flex flex-col gap-3">
          {change.kind === 'create' && (
            <>
              <DiffRow
                label="Title"
                before=""
                after={change.title}
                changed
              />
              <DiffRow
                label="Date"
                before=""
                after={formatDateTime(change.start)}
                changed
              />
              <DiffRow
                label="Time"
                before=""
                after={formatRange(change.start, change.end)}
                changed
              />
            </>
          )}

          {change.kind === 'move' && existingEvent && (
            <>
              <DiffRow
                label="Event"
                before={existingEvent.title}
                after={existingEvent.title}
                changed={false}
              />
              <DiffRow
                label="Date"
                before={formatDateTime(existingEvent.start)}
                after={formatDateTime(change.start)}
                changed={
                  new Date(existingEvent.start).toDateString() !==
                  new Date(change.start).toDateString()
                }
              />
              <DiffRow
                label="Time"
                before={formatRange(existingEvent.start, existingEvent.end)}
                after={formatRange(change.start, change.end)}
                changed={
                  existingEvent.start !== change.start ||
                  existingEvent.end !== change.end
                }
              />
            </>
          )}

          {change.kind === 'delete' && existingEvent && (
            <>
              <DiffRow
                label="Event"
                before={existingEvent.title}
                after=""
                changed
              />
              <DiffRow
                label="Date"
                before={formatDateTime(existingEvent.start)}
                after=""
                changed
              />
            </>
          )}
        </div>

        {/* AI source line */}
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <Sparkles className="size-3 shrink-0 text-brand" aria-hidden />
          <span>
            {sourceNames.length > 0
              ? <>based on your {sourceNames.join(' and ')} —{' '}
                  <a
                    href="/connections"
                    className="font-medium text-brand-text underline-offset-2 hover:underline"
                  >
                    manage sources
                  </a>
                </>
              : 'Suggested by AI based on your calendar'
            }
          </span>
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 border-t border-border bg-secondary/40 px-5 py-3">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg border border-border px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Dismiss
        </button>

        {change.kind !== 'delete' && !approved && (
          <button
            type="button"
            onClick={() =>
              onEdit(change.kind === 'move' ? change.eventId : undefined)
            }
            className="rounded-lg border border-border px-3 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Edit first
          </button>
        )}

        <button
          type="button"
          onClick={approve}
          disabled={approved}
          className={cn(
            'ml-auto flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors',
            approved
              ? 'bg-brand-soft text-brand-text'
              : 'bg-primary text-primary-foreground hover:brightness-95',
          )}
        >
          {approved ? (
            <>✓ Applied</>
          ) : (
            <>Approve & apply</>
          )}
        </button>
      </div>
    </Modal>
  )
}
