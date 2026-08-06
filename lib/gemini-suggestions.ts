/**
 * AI suggestion engine — uses Groq (llama-3.3-70b-versatile) with json_object
 * response format to generate a single structured scheduling proposal.
 */

import Groq from 'groq-sdk'
import type { GCalEvent } from './google-calendar'

const MODEL = 'llama-3.3-70b-versatile'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SuggestionProposal = {
  event_id: string
  title: string
  current: { date: string; start_time: string; end_time: string; calendar: string }
  proposed: { date: string; start_time: string; end_time: string; calendar: string }
  reason: string
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(events: GCalEvent[], userTimezone: string): string {
  const eventsText = events
    .map((e) => `ID: ${e.id}\nTitle: ${e.summary}\nStart: ${e.start.dateTime}\nEnd: ${e.end.dateTime}`)
    .join('\n\n')

  return `You are a scheduling assistant. Analyze these Google Calendar events for the next 7 days and identify ONE high-value improvement.

User timezone: ${userTimezone}
Today: ${new Date().toISOString().slice(0, 10)}

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
): Promise<SuggestionProposal | null> {
  if (events.length === 0) return null

  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) throw new Error('GROQ_API_KEY is not set')

  const groq = new Groq({ apiKey })

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: buildPrompt(events, userTimezone) }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 512,
      })

      const text = completion.choices?.[0]?.message?.content
      if (!text) return null

      let parsed: SuggestionProposal
      try {
        parsed = JSON.parse(text) as SuggestionProposal
      } catch {
        console.error('[gemini-suggestions] Failed to parse JSON:', text)
        return null
      }

      if (!parsed.event_id || !parsed.title || !parsed.reason) {
        console.error('[gemini-suggestions] Incomplete proposal:', parsed)
        return null
      }

      return parsed
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const isRateLimit = /429|rate.?limit|quota/i.test(msg)
      if (isRateLimit && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000 * attempt))
        continue
      }
      throw err
    }
  }

  return null
}
