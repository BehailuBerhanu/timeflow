'use client'

import { Check, X, CalendarPlus, ArrowRightLeft, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatRange } from '@/lib/time'
import type { PendingChange } from '@/lib/types'
import { cn } from '@/lib/utils'

const META = {
  create: { icon: CalendarPlus, label: 'New event', tone: 'green' as const },
  move: { icon: ArrowRightLeft, label: 'Reschedule', tone: 'blue' as const },
  delete: { icon: Trash2, label: 'Remove', tone: 'red' as const },
}

function changeTitle(change: PendingChange, lookup: (id: string) => string) {
  if (change.kind === 'create') return change.title
  return lookup(change.eventId)
}

export function ApprovalCard({
  change,
  compact = false,
}: {
  change: PendingChange
  compact?: boolean
}) {
  const { state, dispatch } = useStore()
  const meta = META[change.kind]
  const Icon = meta.icon
  const lookup = (id: string) =>
    state.events.find((e) => e.id === id)?.title ?? 'this event'
  const resolved = change.status !== 'pending'

  return (
    <div
      data-tone={meta.tone}
      className={cn(
        'rounded-xl border bg-panel transition-opacity',
        resolved ? 'border-border opacity-60' : 'border-border',
        compact ? 'p-2.5' : 'p-3',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: 'var(--chip-bg)', color: 'var(--chip-rail)' }}
        >
          <Icon className="size-3.5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {meta.label}
          </p>
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
            {changeTitle(change, lookup)}
          </p>
          {change.kind !== 'delete' && (
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {new Date(change.start).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              &middot; {formatRange(change.start, change.end)}
            </p>
          )}
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            {change.reason}
          </p>
        </div>
      </div>

      {resolved ? (
        <p
          className={cn(
            'mt-2 text-[11px] font-semibold',
            change.status === 'approved' ? 'text-brand-text' : 'text-muted-foreground',
          )}
        >
          {change.status === 'approved' ? 'Applied to your calendar' : 'Rejected'}
        </p>
      ) : (
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'resolveChange', id: change.id, approved: true })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:brightness-95"
          >
            <Check className="size-3.5" strokeWidth={2.6} />
            Approve
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'resolveChange', id: change.id, approved: false })}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3.5" strokeWidth={2.6} />
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
