'use client'

import { Plus, Sparkles } from 'lucide-react'
import { AvatarStack } from './avatar-stack'
import { formatRange } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/lib/types'

export function EventChip({
  event,
  compact,
  dragging,
  onOpen,
  onDragHandle,
}: {
  event: CalendarEvent
  compact?: boolean
  dragging?: boolean
  onOpen: () => void
  onDragHandle?: (e: React.PointerEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-tone={event.tone}
      onPointerDown={onDragHandle}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        'group/chip relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg pl-2.5 pr-2 py-1.5 text-left',
        'bg-[var(--chip-bg)] text-[var(--chip-fg)] shadow-[var(--ev-shadow)]',
        'border border-[color-mix(in_oklab,var(--chip-rail)_22%,transparent)]',
        'transition-[transform,box-shadow] duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--chip-rail)]/60',
        dragging
          ? 'z-30 scale-[1.02] shadow-lg'
          : 'hover:-translate-y-px hover:shadow-md',
      )}
      style={{ touchAction: 'none' }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-lg bg-[var(--chip-rail)]"
      />
      <div className="flex items-start gap-1">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-4 tracking-[-0.01em]">
          {event.title}
        </p>
        {event.aiTouched ? (
          <Sparkles
            className="mt-px size-3 shrink-0 text-[var(--chip-rail)]"
            aria-label="Adjusted by the assistant"
          />
        ) : null}
      </div>

      {!compact ? (
        <p className="mt-0.5 truncate text-[11px] leading-4 opacity-70">
          {formatRange(event.start, event.end)}
        </p>
      ) : null}

      {!compact && (event.attendees.length || event.extraAttendees) ? (
        <div className="mt-auto pt-1">
          <AvatarStack ids={event.attendees} extra={event.extraAttendees} />
        </div>
      ) : null}

      {!compact && event.focus ? (
        <div className="mt-auto pt-1">
          <div className="flex items-center justify-between text-[11px] opacity-70">
            <span>Focus time</span>
            <Plus className="size-3" aria-hidden />
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--chip-rail)_25%,transparent)]">
            <div
              className="h-full rounded-full bg-[var(--chip-rail)]"
              style={{ width: `${Math.round((event.focusProgress ?? 0.5) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
