'use client'

import { useState } from 'react'
import { Check, Clock, Sparkles, Tag, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserPreferences } from '@/hooks/use-preferences'

// ── Types ─────────────────────────────────────────────────────────────────────

type CalendarLabel = 'work' | 'personal' | null

interface OnboardingModalProps {
  /** Calendar names from the user's store (e.g. ["Work", "Personal", "School"]) */
  calendarNames: string[]
  /** Called after the user saves or skips. Parent should refetch preferences. */
  onDone: () => void
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <span
      className={cn(
        'flex size-2 rounded-full transition-colors',
        done ? 'bg-brand' : active ? 'bg-foreground' : 'bg-border',
      )}
    />
  )
}

// ── Calendar label step ───────────────────────────────────────────────────────

function CalendarLabelStep({
  calendarNames,
  labels,
  onChange,
}: {
  calendarNames: string[]
  labels: Record<string, CalendarLabel>
  onChange: (name: string, label: CalendarLabel) => void
}) {
  const LABEL_OPTIONS: { value: CalendarLabel; label: string; color: string }[] = [
    { value: 'work', label: 'Work', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
    { value: 'personal', label: 'Personal', color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30' },
    { value: null, label: 'Skip', color: 'bg-secondary text-muted-foreground border-border' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Tag className="size-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-foreground">Label your calendars</p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Tell the AI which calendars are for work vs personal, so it doesn't suggest
            moving work meetings into your personal time.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {calendarNames.map((name) => (
          <div
            key={name}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3"
          >
            <span className="text-[13px] font-medium text-foreground">{name}</span>
            <div className="flex items-center gap-1.5">
              {LABEL_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange(name, value)}
                  className={cn(
                    'flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[11.5px] font-medium transition-all',
                    labels[name] === value
                      ? color
                      : 'border-border bg-transparent text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {labels[name] === value && value !== null && (
                    <Check className="size-3" strokeWidth={2.5} />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Focus hours step ──────────────────────────────────────────────────────────

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h12 = i % 12 === 0 ? 12 : i % 12
  const suffix = i < 12 ? 'AM' : 'PM'
  return {
    value: `${String(i).padStart(2, '0')}:00`,
    label: `${h12}:00 ${suffix}`,
  }
})

function FocusHoursStep({
  focusHours,
  onChange,
}: {
  focusHours: { start: string; end: string } | null
  onChange: (hours: { start: string; end: string } | null) => void
}) {
  const enabled = focusHours !== null
  const start = focusHours?.start ?? '09:00'
  const end = focusHours?.end ?? '12:00'

  function handleToggle() {
    onChange(enabled ? null : { start: '09:00', end: '12:00' })
  }

  function handleChange(field: 'start' | 'end', value: string) {
    if (!focusHours) return
    onChange({ ...focusHours, [field]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Clock className="size-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-foreground">Protect your focus hours</p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Set a daily time window the AI should never schedule over — your uninterrupted
            deep work block.
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <span className="text-[13px] font-medium text-foreground">
          {enabled ? 'Focus window enabled' : 'No focus window (skip)'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          className={cn(
            'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            enabled ? 'bg-brand' : 'bg-border',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform',
              enabled ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      {/* Time pickers */}
      {enabled && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Focus starts
            </label>
            <select
              value={start}
              onChange={(e) => handleChange('start', e.target.value)}
              className={cn(
                'h-10 rounded-xl border border-border bg-background px-3 text-[13px] text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              )}
            >
              {HOUR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Focus ends
            </label>
            <select
              value={end}
              onChange={(e) => handleChange('end', e.target.value)}
              className={cn(
                'h-10 rounded-xl border border-border bg-background px-3 text-[13px] text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              )}
            >
              {HOUR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function OnboardingModal({ calendarNames, onDone }: OnboardingModalProps) {
  const [step, setStep] = useState<0 | 1>(0)
  const [labels, setLabels] = useState<Record<string, CalendarLabel>>({})
  const [focusHours, setFocusHours] = useState<{ start: string; end: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleLabelChange(name: string, label: CalendarLabel) {
    setLabels((prev) => ({ ...prev, [name]: label }))
  }

  async function save(skip: boolean) {
    setSaving(true)
    try {
      const payload: UserPreferences = skip
        ? { calendar_labels: {}, focus_hours: null }
        : {
            calendar_labels: Object.fromEntries(
              Object.entries(labels)
                .filter(([, v]) => v !== null)
                .map(([k, v]) => [k, v as 'work' | 'personal']),
            ),
            focus_hours: focusHours,
          }

      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        console.error('[OnboardingModal] save failed:', await res.text())
      }
    } catch (err) {
      console.error('[OnboardingModal] network error:', err)
    } finally {
      setSaving(false)
      if (!skip) {
        // Show confirmation for 5 seconds, or dismiss on click/tap
        setSaved(true)
        setTimeout(() => onDone(), 5000)
      } else {
        onDone()
      }
    }
  }

  // ── Confirmation state ────────────────────────────────────────────────────
  if (saved) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 backdrop-blur-[2px] p-4 cursor-pointer"
        role="status"
        aria-live="polite"
        onClick={onDone}
      >
        <div
          className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-6 py-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Check className="size-5" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Got it! AI preferences saved.</p>
            <p className="text-[12px] text-muted-foreground">The assistant will use these when generating suggestions.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Set up AI preferences"
    >
      <div className="flex w-full max-w-[480px] flex-col gap-5 rounded-2xl border border-border bg-panel p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Sparkles className="size-4" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[15px] font-bold text-foreground">Set up AI preferences</p>
              <p className="text-[12px] text-muted-foreground">Takes about 30 seconds</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            aria-label="Skip onboarding"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          <StepDot active={step === 0} done={step > 0} />
          <StepDot active={step === 1} done={false} />
        </div>

        {/* Step content */}
        <div className="min-h-[200px]">
          {step === 0 ? (
            <CalendarLabelStep
              calendarNames={calendarNames}
              labels={labels}
              onChange={handleLabelChange}
            />
          ) : (
            <FocusHoursStep focusHours={focusHours} onChange={setFocusHours} />
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(0)}
                disabled={saving}
                className={cn(
                  'flex h-9 items-center rounded-lg border border-border px-4 text-[13px] font-medium text-foreground',
                  'transition-colors hover:bg-secondary disabled:opacity-60',
                )}
              >
                Back
              </button>
            )}

            {step === 0 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className={cn(
                  'flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground',
                  'transition-colors hover:brightness-95',
                )}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={() => save(false)}
                disabled={saving}
                aria-busy={saving}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground',
                  'transition-colors hover:brightness-95 disabled:opacity-60',
                )}
              >
                {saving ? (
                  <span
                    role="status"
                    aria-label="Saving"
                    className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
                  />
                ) : (
                  <Check className="size-3.5" strokeWidth={2.5} />
                )}
                {saving ? 'Saving…' : 'Save & Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
