'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal, ModalHeader } from './modal'
import { useStore } from '@/lib/store'
import type { CalendarEvent, Tone } from '@/lib/types'

const TONES: Tone[] = ['blue', 'green', 'amber', 'red', 'violet', 'teal']

function toInput(iso: string) {
  return iso.slice(0, 16)
}

export function EventDialog({
  event,
  onClose,
}: {
  event: CalendarEvent | null
  onClose: () => void
}) {
  const { state, dispatch } = useStore()
  const [draft, setDraft] = useState<CalendarEvent | null>(event)

  useEffect(() => setDraft(event), [event])

  if (!draft) return null

  function save() {
    if (!draft) return
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
    <Modal open onClose={onClose} label="Edit event">
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
              onChange={(e) => setDraft({ ...draft, start: `${e.target.value}:00` })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Ends</span>
            <input
              type="datetime-local"
              value={toInput(draft.end)}
              onChange={(e) => setDraft({ ...draft, end: `${e.target.value}:00` })}
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
    </Modal>
  )
}
