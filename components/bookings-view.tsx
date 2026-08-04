'use client'

import { useState } from 'react'
import {
  CalendarCheck,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { BookingLink, BookingSlot } from '@/lib/types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WORK_DAYS = [1, 2, 3, 4, 5]

const BASE_URL = 'https://timeflow.app/'

function formatHour(h: number) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-brand" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          Copy link
        </>
      )}
    </button>
  )
}

// ─── Availability slot editor ─────────────────────────────────────────────────

function SlotEditor({
  slots,
  onChange,
}: {
  slots: BookingSlot[]
  onChange: (s: BookingSlot[]) => void
}) {
  function toggle(day: number) {
    const exists = slots.find((s) => s.day === day)
    if (exists) {
      onChange(slots.filter((s) => s.day !== day))
    } else {
      onChange([...slots, { day, startHour: 9, endHour: 17 }])
    }
  }

  function patch(day: number, field: 'startHour' | 'endHour', val: number) {
    onChange(slots.map((s) => (s.day === day ? { ...s, [field]: val } : s)))
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="flex flex-col gap-2">
      {WORK_DAYS.map((day) => {
        const slot = slots.find((s) => s.day === day)
        return (
          <div key={day} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggle(day)}
              className={cn(
                'flex w-14 items-center justify-center rounded-lg border py-1.5 text-[12px] font-medium transition-colors',
                slot
                  ? 'border-brand bg-brand-soft text-brand-text'
                  : 'border-border text-muted-foreground hover:border-brand/40 hover:text-foreground',
              )}
            >
              {DAY_NAMES[day]}
            </button>

            {slot ? (
              <div className="flex items-center gap-2">
                <select
                  value={slot.startHour}
                  onChange={(e) => patch(day, 'startHour', Number(e.target.value))}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-[12px] outline-none focus:border-brand"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground">to</span>
                <select
                  value={slot.endHour}
                  onChange={(e) => patch(day, 'endHour', Number(e.target.value))}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-[12px] outline-none focus:border-brand"
                >
                  {hours
                    .filter((h) => h > slot.startHour)
                    .map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <span className="text-[12px] text-muted-foreground">Unavailable</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Booking link card ────────────────────────────────────────────────────────

function LinkCard({
  link,
  onEdit,
}: {
  link: BookingLink
  onEdit: (link: BookingLink) => void
}) {
  const { dispatch } = useStore()
  const url = `${BASE_URL}${link.slug}`
  const activeDays = link.availability.map((s) => DAY_NAMES[s.day]).join(', ')

  return (
    <div
      className={cn(
        'rounded-xl border bg-panel p-4 transition-opacity',
        !link.active && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Clock className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14px] font-semibold text-foreground">
              {link.title}
            </p>
            {!link.active && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {link.durationMinutes} min &middot;{' '}
            {activeDays || 'No days set'}
          </p>

          {/* sharable URL */}
          <div className="mt-2 flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-secondary/50 px-3 py-1.5">
            <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
              {url}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <CopyButton value={url} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
          Preview
        </a>
        <button
          type="button"
          onClick={() => onEdit(link)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Pencil className="size-3.5" />
          Edit
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'updateBookingLink',
                id: link.id,
                patch: { active: !link.active },
              })
            }
            aria-label={link.active ? 'Deactivate link' : 'Activate link'}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors',
              link.active
                ? 'border border-border text-muted-foreground hover:bg-secondary'
                : 'border border-brand/40 bg-brand-soft text-brand-text hover:bg-brand-soft/70',
            )}
          >
            <Power className="size-3.5" />
            {link.active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'deleteBookingLink', id: link.id })
            }
            aria-label="Delete booking link"
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit / Create drawer ─────────────────────────────────────────────────────

function LinkEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<BookingLink> & { id?: string }
  onSave: (link: BookingLink) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial.title ?? '')
  const [slug, setSlug] = useState(initial.slug ?? '')
  const [duration, setDuration] = useState(initial.durationMinutes ?? 30)
  const [slots, setSlots] = useState<BookingSlot[]>(
    initial.availability ?? [
      { day: 1, startHour: 9, endHour: 17 },
      { day: 2, startHour: 9, endHour: 17 },
      { day: 3, startHour: 9, endHour: 17 },
      { day: 4, startHour: 9, endHour: 17 },
      { day: 5, startHour: 9, endHour: 17 },
    ],
  )

  // auto-slug from title
  function handleTitleChange(v: string) {
    setTitle(v)
    if (!initial.slug) {
      setSlug(
        v
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      )
    }
  }

  function save() {
    if (!title.trim() || !slug.trim()) return
    onSave({
      id: initial.id ?? `bl-${Date.now().toString(36)}`,
      title: title.trim(),
      slug: `daniel/${slug.trim()}`,
      durationMinutes: duration,
      availability: slots,
      active: initial.active ?? true,
    })
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-brand/30 bg-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold">
          {initial.id ? 'Edit booking link' : 'New booking link'}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Title</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. 30-min Intro Call"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            URL slug
          </span>
          <div className="flex h-9 items-center rounded-lg border border-input bg-background px-3 text-sm focus-within:border-brand">
            <span className="text-muted-foreground">daniel/</span>
            <input
              value={slug.replace('daniel/', '')}
              onChange={(e) => setSlug(e.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Duration
          </span>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
          >
            {[15, 20, 30, 45, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d} minutes
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Availability
        </span>
        <SlotEditor slots={slots} onChange={setSlots} />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!title.trim() || !slug.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:brightness-95 disabled:opacity-40"
        >
          {initial.id ? 'Save changes' : 'Create link'}
        </button>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function BookingsView() {
  const { state, dispatch } = useStore()
  const [editTarget, setEditTarget] = useState<
    (Partial<BookingLink> & { id?: string }) | null
  >(null)

  function saveLink(link: BookingLink) {
    if (state.bookingLinks.find((l) => l.id === link.id)) {
      dispatch({
        type: 'updateBookingLink',
        id: link.id,
        patch: link,
      })
    } else {
      dispatch({ type: 'addBookingLink', link })
    }
    setEditTarget(null)
  }

  const activeCount = state.bookingLinks.filter((l) => l.active).length

  return (
    <main className="scrollbar-slim flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <CalendarCheck className="size-5 text-brand" strokeWidth={2} />
          <div>
            <h1 className="text-[17px] font-semibold tracking-[-0.02em]">Bookings</h1>
            <p className="text-[12px] text-muted-foreground">
              {activeCount} active booking link{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditTarget({})}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:brightness-95"
        >
          <Plus className="size-4" />
          New link
        </button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5">
        {/* demo banner */}
        <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-[12.5px] text-muted-foreground">
          <span className="font-semibold text-foreground">Demo mode.</span> Booking links
          are simulated — no real calendar holds or confirmations are sent. Share the
          URLs to demonstrate the flow.
        </div>

        {/* editor inline */}
        {editTarget !== null && (
          <LinkEditor
            initial={editTarget}
            onSave={saveLink}
            onCancel={() => setEditTarget(null)}
          />
        )}

        {/* link cards */}
        {state.bookingLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <CalendarCheck className="size-10 text-brand opacity-30" strokeWidth={1.5} />
            <p className="text-[14px] text-muted-foreground">
              No booking links yet. Create one to share your availability.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {state.bookingLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onEdit={(l) => setEditTarget(l)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
