'use client'

import { useState } from 'react'
import { ArrowRight, Check, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiSuggestion = {
  id: string
  title: string
  reason: string
  current: {
    date: string       // YYYY-MM-DD
    start_time: string // HH:mm
    end_time: string   // HH:mm
    calendar: string
  }
  proposed: {
    date: string
    start_time: string
    end_time: string
    calendar: string
  }
}

interface AiSuggestionCardProps {
  suggestion: AiSuggestion
  /** Called after a successful approve or reject so the parent can refetch */
  onResolved?: (id: string, action: 'approved' | 'rejected') => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)} – ${formatTime(end)}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SideColumn({
  label,
  date,
  start,
  end,
  calendar,
  variant,
}: {
  label: 'Before' | 'After'
  date: string
  start: string
  end: string
  calendar: string
  variant: 'before' | 'after'
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-2 rounded-xl border px-3.5 py-3',
        variant === 'before'
          ? 'border-border bg-secondary/50'
          : 'border-brand/40 bg-brand-soft',
      )}
    >
      <p
        className={cn(
          'text-[10.5px] font-semibold uppercase tracking-wider',
          variant === 'before' ? 'text-muted-foreground' : 'text-brand-text',
        )}
      >
        {label}
      </p>

      <div className="flex flex-col gap-1.5">
        <Row
          label="Date"
          value={formatDate(date)}
          highlight={variant === 'after'}
        />
        <Row
          label="Time"
          value={formatTimeRange(start, end)}
          highlight={variant === 'after'}
        />
        <Row
          label="Calendar"
          value={calendar}
          highlight={false}
        />
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          'text-[12.5px] font-medium',
          highlight ? 'text-brand-text' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function AiSuggestionCard({ suggestion, onResolved }: AiSuggestionCardProps) {
  const [status, setStatus] = useState<'idle' | 'approving' | 'rejecting' | 'done'>('idle')
  const [result, setResult] = useState<'approved' | 'rejected' | null>(null)

  async function handleApprove() {
    setStatus('approving')
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}/approve`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(await res.text())
      setResult('approved')
      setStatus('done')
      onResolved?.(suggestion.id, 'approved')
    } catch (err) {
      console.error('[AiSuggestionCard] approve failed:', err)
      setStatus('idle')
    }
  }

  async function handleReject() {
    setStatus('rejecting')
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}/reject`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(await res.text())
      setResult('rejected')
      setStatus('done')
      onResolved?.(suggestion.id, 'rejected')
    } catch (err) {
      console.error('[AiSuggestionCard] reject failed:', err)
      setStatus('idle')
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3.5 rounded-xl border border-border bg-panel p-4 shadow-sm transition-opacity',
        status === 'done' && 'opacity-60',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Sparkles className="size-3.5" strokeWidth={2.2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground">{suggestion.title}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
            {suggestion.reason}
          </p>
        </div>
      </div>

      {/* Before / After columns */}
      <div className="flex items-stretch gap-2">
        <SideColumn
          label="Before"
          date={suggestion.current.date}
          start={suggestion.current.start_time}
          end={suggestion.current.end_time}
          calendar={suggestion.current.calendar}
          variant="before"
        />

        <div className="flex items-center self-center">
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>

        <SideColumn
          label="After"
          date={suggestion.proposed.date}
          start={suggestion.proposed.start_time}
          end={suggestion.proposed.end_time}
          calendar={suggestion.proposed.calendar}
          variant="after"
        />
      </div>

      {/* Source tag */}
      <div className="flex items-center gap-1.5">
        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
          GC
        </span>
        <span className="text-[11.5px] text-muted-foreground">Google Calendar</span>
      </div>

      {/* Actions */}
      {status === 'done' ? (
        <p
          className={cn(
            'text-[12px] font-semibold',
            result === 'approved' ? 'text-brand-text' : 'text-muted-foreground',
          )}
        >
          {result === 'approved' ? '✓ Applied to your calendar' : 'Dismissed'}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={status !== 'idle'}
            aria-busy={status === 'approving'}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-semibold text-primary-foreground',
              'transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {status === 'approving' ? (
              <span
                role="status"
                aria-label="Approving"
                className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
              />
            ) : (
              <Check className="size-3.5" strokeWidth={2.6} aria-hidden />
            )}
            {status === 'approving' ? 'Applying…' : 'Approve'}
          </button>

          <button
            type="button"
            onClick={handleReject}
            disabled={status !== 'idle'}
            aria-busy={status === 'rejecting'}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold text-muted-foreground',
              'transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {status === 'rejecting' ? (
              <span
                role="status"
                aria-label="Dismissing"
                className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground"
              />
            ) : (
              <X className="size-3.5" strokeWidth={2.6} aria-hidden />
            )}
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
