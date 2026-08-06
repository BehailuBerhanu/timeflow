/**
 * Google Calendar API helpers.
 *
 * All functions accept an already-valid access token. Token refresh is handled
 * by `refreshGoogleToken` before any Calendar call is made.
 */

export type GCalEvent = {
  id: string
  summary: string
  start: { dateTime: string; timeZone?: string }
  end: { dateTime: string; timeZone?: string }
  status?: string
  calendarId?: string // added by us after fetching
}

// ── Token refresh ─────────────────────────────────────────────────────────────

export async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google token refresh failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

// ── Fetch upcoming events ─────────────────────────────────────────────────────

/**
 * Returns events from the user's primary calendar for the next `days` days.
 * Skips cancelled events and all-day events (no dateTime).
 */
export async function fetchUpcomingEvents(
  accessToken: string,
  days = 7,
): Promise<GCalEvent[]> {
  const now = new Date()
  const future = new Date(now.getTime() + days * 86_400_000)

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Calendar fetch failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as { items: GCalEvent[] }

  return (data.items ?? [])
    .filter(
      (e) =>
        e.status !== 'cancelled' &&
        e.start.dateTime != null && // skip all-day events
        e.end.dateTime != null,
    )
    .map((e) => ({ ...e, calendarId: 'primary' }))
}

// ── Patch an event ────────────────────────────────────────────────────────────

/**
 * Updates an event's start/end times on the user's primary calendar.
 */
export async function patchCalendarEvent(
  accessToken: string,
  eventId: string,
  startDateTime: string,
  endDateTime: string,
  timeZone = 'UTC',
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
      }),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Calendar patch failed (${res.status}): ${body}`)
  }
}
