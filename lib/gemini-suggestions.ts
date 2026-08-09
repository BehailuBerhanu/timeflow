/**
 * AI suggestion engine — uses Groq (llama-3.3-70b-versatile) with json_object
 * response format to generate a single structured scheduling proposal.
 */

import Groq from 'groq-sdk'
import type { GCalEvent } from './google-calendar'

const MODEL = 'llama-3.3-70b-versatile'
const TIMEOUT_MS = 30_000

// ── Types ─────────────────────────────────────────────────────────────────────

export type SuggestionProposal = {
  event_id: string
  title: string
  current: { date: string; start_time: string; end_time: string; calendar: string }
  proposed: { date: string; start_time: string; end_time: string; calendar: string }
  reason: string
}

export type UserPreferences = {
  calendar_labels: Record<string, 'work' | 'personal'>
  focus_hours: { start: string; end: string } | null
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isNonEmptyString(v: unknown, maxLen = 500): boolean {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen
}

function validateProposal(parsed: unknown): SuggestionProposal | null {
  if (!isPlainObject(parsed)) {
    console.error('[gemini-suggestions] Proposal is not a plain object:', JSON.stringify(parsed))
    return null
  }
  for (const field of ['event_id', 'title', 'reason'] as const) {
    if (!isNonEmptyString((parsed as Record<string, unknown>)[field])) {
      console.error(
        `[gemini-suggestions] Invalid proposal — '${field}': ${JSON.stringify((parsed as Record<string, unknown>)[field])}`,
      )
      return null
    }
  }
  for (const nested of ['current', 'proposed'] as const) {
    const obj = (parsed as Record<string, unknown>)[nested]
    if (!isPlainObject(obj) || Object.keys(obj).length === 0) {
      console.error(
        `[gemini-suggestions] Invalid proposal — missing or malformed '${nested}': ${JSON.stringify(obj)}`,
      )
      return null
    }
    for (const sub of ['date', 'start_time', 'end_time', 'calendar'] as const) {
      if (!isNonEmptyString((obj as Record<string, unknown>)[sub], 50)) {
        console.error(
          `[gemini-suggestions] Invalid proposal — '${nested}.${sub}': ${JSON.stringify((obj as Record<string, unknown>)[sub])}`,
        )
        return null
      }
    }
  }
  return parsed as SuggestionProposal
}

// ── Retry predicate ───────────────────────────────────────────────────────────

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    /429|rate.?limit|quota/i.test(msg) ||
    /ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|socket|GROQ_TIMEOUT/i.test(msg)
  )
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(events: GCalEvent[], userTimezone: string, preferences?: UserPreferences): string {
  const eventsText = events
    .map(
      (e) =>
        `ID: ${e.id}\nTitle: ${e.summary}\nStart: ${e.start.dateTime}\nEnd: ${e.end.dateTime}`,
    )
    .join('\n\n')

  // Build preferences section if provided
  let prefSection = ''
  if (preferences) {
    const labelEntries = Object.entries(preferences.calendar_labels)
    if (labelEntries.length > 0) {
      const labelList = labelEntries
        .map(([name, label]) => `  - "${name}": ${label}`)
        .join('\n')
      prefSection += `\nCalendar labels (use these to avoid scheduling work events into personal time):\n${labelList}`
    }
    if (preferences.focus_hours) {
      prefSection += `\nProtected focus window: ${preferences.focus_hours.start}–${preferences.focus_hours.end} — do not propose any event change that starts or ends within this time range.`
    }
  }

  return `You are a scheduling assistant. Analyze these Google Calendar events for the next 7 days and identify ONE high-value improvement.

User timezone: ${userTimezone}
Today: ${new Date().toISOString().slice(0, 10)}${prefSection}

Events:
${eventsText}

Look for: overlapping events, back-to-back meetings with no break, deep work blocks being fragmented, or low-priority meetings in peak morning hours (before 11am).

Return ONLY valid JSON in this exact format (no other text):
{
  "event_id": "<exact event ID from the list>",
  "title": "<short human-readable title like 'Protect Deep Work Block'>",
  "current": {
    "date": "YYYY-MM-DD",
    "start_time": "HH:mm",
    "end_time": "HH:mm",
    "calendar": "primary"
  },
  "proposed": {
    "date": "YYYY-MM-DD",
    "start_time": "HH:mm",
    "end_time": "HH:mm",
    "calendar": "primary"
  },
  "reason": "<one sentence explaining why>"
}`
}

// ── Main ──────────────────────────────────────────────────────────────────────

const MAX_RETRIES = 2

export async function generateSuggestion(
  events: GCalEvent[],
  userTimezone = 'UTC',
  preferences?: UserPreferences,
): Promise<SuggestionProposal | null> {
  if (events.length === 0) return null

  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) throw new Error('GROQ_API_KEY is not set')

  const groq = new Groq({ apiKey })

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort()
          reject(new Error('GROQ_TIMEOUT'))
        }, TIMEOUT_MS)
      })

      const groqPromise = groq.chat.completions.create(
        {
          model: MODEL,
          messages: [{ role: 'user', content: buildPrompt(events, userTimezone, preferences) }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 512,
        },
        { signal: controller.signal },
      )

      const completion = await Promise.race([groqPromise, timeoutPromise])
      clearTimeout(timeoutId)

      const text = completion.choices?.[0]?.message?.content
      if (!text) return null

      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        console.error('[gemini-suggestions] Failed to parse JSON:', text)
        return null
      }

      return validateProposal(parsed)
    } catch (err: unknown) {
      clearTimeout(timeoutId)

      const isTimeout = err instanceof Error && err.message === 'GROQ_TIMEOUT'
      if (isTimeout) {
        console.error('[gemini-suggestions] Groq call timed out after 30 s')
      }

      if (isRetryable(err) && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000 * attempt))
        continue
      }

      // Final attempt timed out — return null instead of throwing
      if (isTimeout) {
        return null
      }

      throw err
    }
  }

  return null
}
