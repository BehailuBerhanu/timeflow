'use client'

import { useEffect, useState } from 'react'
import { Trash2, UserPlus, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Modal, ModalHeader } from './modal'
import { useStore } from '@/lib/store'
import { PEOPLE } from '@/lib/seed-data'
import { addMinutes, atTime, toLocalISO } from '@/lib/time'
import type { CalendarEvent, Tone } from '@/lib/types'

const TONES: Tone[] = ['blue', 'green', 'amber', 'red', 'violet', 'teal']

function toInput(iso: string) {
  return iso.slice(0, 16)
}

function fromInput(val: string) {
  return val ? `${val}:00` : ''
}

// ─── Edit mode ────────────────────────────────────────────────────────────────

function EditForm({
  event,
  onClose,
}: {
  event: CalendarEvent
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const [draft, setDraft] = useState<CalendarEvent>(event)

  useEffect(() => setDraft(event), [event])

  function save() {
    dispatch({
      type: 'updateEvent',
      id: draft.id,
      patch: {
        title: draft.title.trim() || 'Untitled',
        start: draft.start,
        end: draft.end,
        tone: draft.tone,
        calendarId: draft.calendarId,
        notes: draft.notes,
        focus: draft.focus,
      },
    })
    onClose()
  }

  return (
    <>
      <ModalHeader title="Event details" onClose={onClose} />
      <div className="flex flex-col gap-4 px-5 py-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Title</span>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Starts</span>
            <input
              type="datetime-local"
              value={toInput(draft.start)}
              onChange={(e) => setDraft({ ...draft, start: fromInput(e.target.value) })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Ends</span>
            <input
              type="datetime-local"
              value={toInput(draft.end)}
              onChange={(e) => setDraft({ ...draft, end: fromInput(e.target.value) })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Calendar</span>
            <select
              value={draft.calendarId}
              onChange={(e) => setDraft({ ...draft, calendarId: e.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
            >
              {state.calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Color</span>
            <div className="flex h-10 items-center gap-1.5">
              {TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  aria-label={`${tone} label`}
                  aria-pressed={draft.tone === tone}
                  onClick={() => setDraft({ ...draft, tone })}
                  data-tone={tone}
                  className="size-6 rounded-full bg-[var(--chip-rail)] transition-transform data-[selected=true]:scale-110"
                  data-selected={draft.tone === tone}
                  style={
                    draft.tone === tone
                      ? { boxShadow: '0 0 0 2px var(--background), 0 0 0 4px var(--brand)' }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={Boolean(draft.focus)}
            onChange={(e) => setDraft({ ...draft, focus: e.target.checked })}
            className="size-4 accent-[var(--brand)]"
          />
          Treat as protected focus time
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Notes</span>
          <textarea
            value={draft.notes ?? ''}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            rows={2}
            className="resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand"
          />
        </label>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-secondary/40 px-5 py-3">
        <Button
          variant="destructive"
          className="h-9 gap-1.5 rounded-lg"
          onClick={() => {
            dispatch({ type: 'deleteEvent', id: draft.id })
            onClose()
          }}
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="h-9 rounded-lg" onClick={onClose}>
            Cancel
          </Button>
          <Button className="h-9 rounded-lg" onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Create mode ──────────────────────────────────────────────────────────────

type CreateDraft = {
  title: string
  start: string
  end: string
  calendarId: string
  tone: Tone
  attendeeIds: string[]
  focus: boolean
  notes: string
}

function CreateForm({
  initial,
  onClose,
}: {
  initial: CalendarEvent
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const [draft, setDraft] = useState<CreateDraft>({
    title: '',
    start: initial.start,
    end: initial.end,
    calendarId: initial.calendarId,
    tone: initial.tone,
    attendeeIds: [],
    focus: false,
    notes: '',
  })
  const [attendeeOpen, setAttendeeOpen] = useState(false)

  // People available to invite (everyone except "you")
  const invitable = PEOPLE.filter((p) => p.id !== 'you')

  function toggleAttendee(id: string) {
    setDraft((d) => ({
      ...d,
      attendeeIds: d.attendeeIds.includes(id)
        ? d.attendeeIds.filter((a) => a !== id)
        : [...d.attendeeIds, id],
    }))
  }

  function save() {
    const title = draft.title.trim() || 'New event'
    const event: CalendarEvent = {
      id: `e-${Date.now().toString(36)}`,
      title,
      start: draft.start,
      end: draft.end,
      calendarId: draft.calendarId,
      tone: draft.tone,
      attendees: draft.attendeeIds,
      focus: draft.focus || /focus|deep work/i.test(title),
      focusProgress: 0,
      notes: draft.notes || undefined,
    }
    dispatch({ type: 'addEvent', event })
    onClose()
  }

  return (
    <>
      <ModalHeader title="New event" onClose={onClose} />
      <div className="flex flex-col gap-4 px-5 py-4">
        {/* Title */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Title</span>
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
            placeholder="Add a title"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
          />
        </label>

        {/* Start / End */}
        <div className="flex gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Starts</span>
            <input
              type="datetime-local"
              value={toInput(draft.start)}
              onChange={(e) => {
                const newStart = fromInput(e.target.value)
                // keep 1-hour gap
                const startDate = new Date(newStart)
                const endDate = new Date(draft.end)
                const gap = endDate.getTime() - new Date(draft.start).getTime()
                const newEnd = toLocalISO(addMinutes(startDate, Math.max(15, gap / 60000)))
                setDraft({ ...draft, start: newStart, end: newEnd })
              }}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Ends</span>
            <input
              type="datetime-local"
              value={toInput(draft.end)}
              onChange={(e) => setDraft({ ...draft, end: fromInput(e.target.value) })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        {/* Calendar + Color */}
        <div className="flex gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Calendar</span>
            <select
              value={draft.calendarId}
              onChange={(e) => setDraft({ ...draft, calendarId: e.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
            >
              {state.calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Color</span>
            <div className="flex h-10 items-center gap-1.5">
              {TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  aria-label={`${tone} color`}
                  aria-pressed={draft.tone === tone}
                  onClick={() => setDraft({ ...draft, tone })}
                  data-tone={tone}
                  className="size-6 rounded-full bg-[var(--chip-rail)] transition-transform"
                  style={
                    draft.tone === tone
                      ? { boxShadow: '0 0 0 2px var(--background), 0 0 0 4px var(--brand)', transform: 'scale(1.15)' }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Attendees */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Attendees</span>
            <button
              type="button"
              onClick={() => setAttendeeOpen((o) => !o)}
              className="flex items-center gap-1 text-[11.5px] font-medium text-brand-text hover:underline"
            >
              <UserPlus className="size-3.5" />
              Add people
            </button>
          </div>

          {/* selected attendees */}
          {draft.attendeeIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {draft.attendeeIds.map((id) => {
                const person = PEOPLE.find((p) => p.id === id)
                if (!person) return null
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[12px]"
                  >
                    <Image
                      src={person.avatar}
                      alt={person.name}
                      width={16}
                      height={16}
                      className="size-4 rounded-full"
                    />
                    {person.name.split(' ')[0]}
                    <button
                      type="button"
                      onClick={() => toggleAttendee(id)}
                      aria-label={`Remove ${person.name}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          {/* picker dropdown */}
          {attendeeOpen && (
            <div className="rounded-xl border border-border bg-popover shadow-lg">
              {invitable.map((person) => {
                const selected = draft.attendeeIds.includes(person.id)
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggleAttendee(person.id)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary first:rounded-t-xl last:rounded-b-xl"
                  >
                    <Image
                      src={person.avatar}
                      alt={person.name}
                      width={28}
                      height={28}
                      className="size-7 rounded-full"
                    />
                    <span className="flex-1 text-[13px] font-medium">{person.name}</span>
                    {selected && (
                      <span className="text-[11px] font-semibold text-brand-text">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Focus toggle */}
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={draft.focus}
            onChange={(e) => setDraft({ ...draft, focus: e.target.checked })}
            className="size-4 accent-[var(--brand)]"
          />
          Treat as protected focus time
        </label>

        {/* Notes */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Notes</span>
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            rows={2}
            placeholder="Optional notes..."
            className="resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand"
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 px-5 py-3">
        <Button variant="outline" className="h-9 rounded-lg" onClick={onClose}>
          Cancel
        </Button>
        <Button className="h-9 rounded-lg" onClick={save}>
          Add to calendar
        </Button>
      </div>
    </>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

/**
 * Pass `event` to edit an existing event.
 * Pass `newEventTemplate` to open in create mode.
 * Both are mutually exclusive; create mode wins if both are set.
 */
export function EventDialog({
  event,
  newEventTemplate,
  onClose,
}: {
  event: CalendarEvent | null
  newEventTemplate?: CalendarEvent | null
  onClose: () => void
}) {
  const isCreate = Boolean(newEventTemplate)
  const open = Boolean(event || newEventTemplate)

  if (!open) return null

  return (
    <Modal open onClose={onClose} label={isCreate ? 'New event' : 'Edit event'}>
      {isCreate && newEventTemplate ? (
        <CreateForm initial={newEventTemplate} onClose={onClose} />
      ) : event ? (
        <EditForm event={event} onClose={onClose} />
      ) : null}
    </Modal>
  )
}
