/**
 * Gemini-powered suggestion engine.
 *
 * Takes a list of Google Calendar events and asks Gemini 2.5 Flash to identify
 * one high-value scheduling improvement. Returns a strongly-typed proposal.
 *
 * Kept separate from data-fetching logic so the AI "judgment" can be adjusted
 * and unit-tested independently.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { GCalEvent } from './google-calendar'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SuggestionProposal = {
  event_id: string
  title: string
  current: {
    date: string
    start_time: string
    end_time: string
    calendar: string
  }
  proposed: {
    date: string
    start_time: string
    end_time: string
    calendar: string
  }
  reason: string
}

// ── Gemini schema ─────────────────────────────────────────────────────────────

const PROPOSAL_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    event_id: {
      type: SchemaType.STRING,
      description: 'The Google Calendar event ID being changed',
    },
    title: {
      type: SchemaType.STRING,
      description: 'A short human-readable title for this suggestion, e.g. "Protect Deep Work Block"',
    },
    current: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING, description: 'Date in YYYY-MM-DD format' },
        start_time: { type: SchemaType.STRING, description: 'Time in HH:mm format (24h)' },
        end_time: { type: SchemaType.STRING, description: 'Time in HH:mm format (24h)' },
        calendar: { type: SchemaType.STRING, description: 'Calendar name, e.g. "primary"' },
      },
      required: ['date', 'start_time', 'end_time', 'calendar'],
    },
    proposed: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING, description: 'Date in YYYY-MM-DD format' },
        start_time: { type: SchemaType.STRING, description: 'Time in HH:mm format (24h)' },
        end_time: { type: SchemaType.STRING, description: 'Time in HH:mm format (24h)' },
        calendar: { type: SchemaType.STRING, description: 'Calendar name, e.g. "primary"' },
      },
      required: ['date', 'start_time', 'end_time', 'calendar'],
    },
    reason: {
      type: SchemaType.STRING,
      description: 'One concise sentence explaining why this change improves the schedule',
    },
  },
  required: ['event_id', 'title', 'current', 'proposed', 'reason'],
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildPrompt(events: GCalEvent[], userTimezone: string): string {
  const eventsText = events
    .map(
      (e) =>
        `ID: ${e.id}\nTitle: ${e.summary}\nStart: ${e.start.dateTime}\nEnd: ${e.end.dateTime}`,
    )
    .join('\n\n')

  return `You are an expert scheduling assistant analyzing a user's Google Calendar for the next 7 days.

User's timezone: ${userTimezone}
Today: ${new Date().toISOString().slice(0, 10)}

Here are the user's upcoming events:

${eventsText}

Identify the SINGLE most valuable scheduling improvement. Focus on:
1. Conflicts — two events overlapping, move the lower-priority one
2. Back-to-back meetings with no break — move one to create breathing room
3. Deep work fragmentation — a long uninterrupted block that could be protected by moving a short meeting away
4. Low-priority meeting in peak morning hours (before 11 AM) — reschedule it to afternoon

Rules:
- Only suggest moving an existing event (never create or delete)
- The proposed time must be on the same day or within the next 7 days
- Keep the same duration as the original event
- Propose times within 08:00-19:00 only
- Pick the single highest-impact change, not multiple changes
- The event_id must be the exact ID from the list above
- If no clear improvement exists, still pick the best option available

Return your single best proposal as JSON matching the required schema.`
}

// ── Main function ─────────────────────────────────────────────────────────────

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

/**
 * Asks Gemini to analyse `events` and return one scheduling proposal.
 * Retries up to MAX_RETRIES times on 429 (rate limit) errors.
 */
export async function generateSuggestion(
  events: GCalEvent[],
  userTimezone = 'UTC',
): Promise<SuggestionProposal | null> {
  if (events.length === 0) return null

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const genai = new GoogleGenerativeAI(apiKey)
  const model = genai.getGenerativeModel({
    model: 'gemini-2.5-flash-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      // @ts-expect-error — responseSchema is supported at runtime
      responseSchema: PROPOSAL_SCHEMA,
    },
  })

  const prompt = buildPrompt(events, userTimezone)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      let parsed: SuggestionProposal
      try {
        parsed = JSON.parse(text) as SuggestionProposal
      } catch {
        console.error('[gemini] Failed to parse response as JSON:', text)
        return null
      }

      // Basic validation — ensure required fields are present
      if (!parsed.event_id || !parsed.title || !parsed.reason) {
        console.error('[gemini] Incomplete proposal returned:', parsed)
        return null
      }

      return parsed
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const isRateLimit = /429|rate.?limit|quota/i.test(msg)

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt
        console.warn(`[gemini] Rate limited (attempt ${attempt}), retrying in ${delay}ms…`)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }

      console.error(`[gemini] generateContent failed (attempt ${attempt}):`, msg)
      throw err
    }
  }

  return null
}
