/**
 * POST /api/suggestions/generate
 *
 * Hit by a Vercel Cron job (or manually) to generate a new AI suggestion
 * for each user who hasn't received one today.
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/suggestions/generate", "schedule": "0 8 * * *" }] }
 *
 * The request must include the header:
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchUpcomingEvents, refreshGoogleToken } from '@/lib/google-calendar'
import { generateSuggestion, type UserPreferences } from '@/lib/gemini-suggestions'

// ── Auth guard ────────────────────────────────────────────────────────────────
//
// Accepts two kinds of callers:
//   1. Vercel Cron / server-to-server: Authorization: Bearer <CRON_SECRET>
//   2. Authenticated browser user (dev button): valid Supabase session cookie
//      — only allowed when NODE_ENV !== 'production' OR the request includes
//        the header X-Dev-Trigger: 1 (stripped at the edge in production)

function hasCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

/** Expand a Supabase PostgrestError or any unknown value into a plain loggable object */
function expandError(err: unknown): unknown {
  if (err && typeof err === 'object') {
    // PostgrestError has code, details, hint, message — none are in the prototype
    // so JSON.stringify misses them. Spread them explicitly.
    const e = err as Record<string, unknown>
    return {
      message: e['message'],
      code: e['code'],
      details: e['details'],
      hint: e['hint'],
      status: e['status'],
      statusCode: e['statusCode'],
      stack: err instanceof Error ? err.stack : undefined,
      raw: JSON.stringify(err),
    }
  }
  return err
}

export async function POST(req: Request) {
  try {
    return await handlePost(req)
  } catch (err) {
    // Top-level safety net — captures anything not caught by inner try/catches
    console.error('[suggestions/generate] UNHANDLED ERROR — full object:', expandError(err))
    if (err instanceof Error) {
      console.error('[suggestions/generate] UNHANDLED ERROR — stack:', err.stack)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handlePost(req: Request) {
  const supabase = await createClient()

  // Resolve the calling user first — needed for both auth paths.
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser()

  if (getUserError) {
    console.error('[suggestions/generate] getUser failed:', expandError(getUserError))
  }

  const isCron = hasCronSecret(req)
  const isDevTrigger =
    req.headers.get('x-dev-trigger') === '1' && user != null

  if (!isCron && !isDevTrigger) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user) {
    return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
  }

  const userId = user.id

  // ── Rate limit: max 2 suggestions per user per day ────────────────────────
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count, error: countError } = await supabase
    .from('suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString())

  if (countError) {
    console.error('[suggestions/generate] daily-limit-check — full error:', expandError(countError))
    console.error('[suggestions/generate] daily-limit-check — raw:', countError)
    return NextResponse.json({ error: 'Failed to check daily limit' }, { status: 500 })
  }

  if ((count ?? 0) >= 2) {
    return NextResponse.json(
      { message: 'Daily suggestion limit reached for this user' },
      { status: 200 },
    )
  }

  // ── Get Google OAuth tokens from Supabase session ─────────────────────────
  const {
    data: { session },
    error: getSessionError,
  } = await supabase.auth.getSession()

  if (getSessionError) {
    console.error('[suggestions/generate] getSession failed:', expandError(getSessionError))
  }

  const providerToken = session?.provider_token
  const providerRefreshToken = session?.provider_refresh_token

  // provider_token is the live access token (present right after OAuth sign-in)
  // provider_refresh_token lets us get a new one after it expires
  // We need at least one of them to call Google Calendar
  if (!providerToken && !providerRefreshToken) {
    console.error('[suggestions/generate] no Google tokens — session keys:', session ? Object.keys(session) : 'null')
    console.error('[suggestions/generate] user must sign in with Google OAuth (not email magic link)')
    return NextResponse.json(
      { error: 'No Google tokens — please sign in using "Continue with Google" to grant calendar access' },
      { status: 400 },
    )
  }

  // ── Refresh access token ──────────────────────────────────────────────────
  let accessToken: string
  try {
    if (providerToken) {
      // Use the existing access token directly (still valid right after sign-in)
      accessToken = providerToken
    } else {
      // Access token expired — use refresh token to get a new one
      accessToken = await refreshGoogleToken(providerRefreshToken!)
    }
  } catch (err) {
    console.error('[suggestions/generate] token-refresh — full error:', expandError(err))
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 })
  }

  // ── Fetch events ──────────────────────────────────────────────────────────
  let events
  try {
    events = await fetchUpcomingEvents(accessToken)
  } catch (err) {
    console.error('[suggestions/generate] calendar-fetch — full error:', expandError(err))
    return NextResponse.json({ error: 'Failed to fetch Google Calendar events' }, { status: 500 })
  }

  if (events.length === 0) {
    return NextResponse.json({ message: 'No upcoming events found' }, { status: 200 })
  }

  // ── Fetch user preferences (optional — fall back gracefully) ─────────────
  let userPreferences: UserPreferences | undefined
  try {
    const { data: prefRow } = await supabase
      .from('user_preferences')
      .select('calendar_labels, focus_hours')
      .eq('user_id', userId)
      .maybeSingle()

    if (prefRow) {
      userPreferences = {
        calendar_labels: (prefRow.calendar_labels as Record<string, 'work' | 'personal'>) ?? {},
        focus_hours: (prefRow.focus_hours as { start: string; end: string } | null) ?? null,
      }
    }
  } catch (err) {
    console.error('[suggestions/generate] preferences-fetch failed (continuing without):', err)
  }

  // ── Generate suggestion via Groq ──────────────────────────────────────────
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'

  let proposal
  try {
    proposal = await generateSuggestion(events, userTimezone, userPreferences)
  } catch (err) {
    console.error('[suggestions/generate] groq-generation — full error:', expandError(err))
    return NextResponse.json({ error: 'Gemini generation failed' }, { status: 500 })
  }

  if (!proposal) {
    return NextResponse.json({ message: 'No suggestion generated' }, { status: 200 })
  }

  // ── Check for duplicate ───────────────────────────────────────────────────
  const { data: existing, error: dupError } = await supabase
    .from('suggestions')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', proposal.event_id)
    .in('status', ['rejected', 'pending'])
    .maybeSingle()

  if (dupError) {
    console.error('[suggestions/generate] duplicate-check — full error:', expandError(dupError))
    console.error('[suggestions/generate] duplicate-check — raw:', dupError)
    return NextResponse.json({ error: 'Failed to check for duplicate suggestion' }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json(
      { message: 'Suggestion for this event already exists or was rejected' },
      { status: 200 },
    )
  }

  // ── Dismissed-pattern suppression check ──────────────────────────────────
  const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: patterns, error: patternFetchError } = await supabase
    .from('dismissed_patterns')
    .select('event_title_pattern')
    .eq('user_id', userId)
    .gte('dismissed_at', windowStart)

  if (patternFetchError) {
    console.error('[suggestions/generate] dismissed-patterns-fetch:', patternFetchError)
    // Non-fatal — proceed with empty list
  }

  const dismissedTitles = new Set(
    (patterns ?? []).map((p: { event_title_pattern: string }) => p.event_title_pattern),
  )
  const normalizedTitle = proposal.title.toLowerCase().trim()

  if (dismissedTitles.has(normalizedTitle)) {
    console.log(`[suggestions/generate] skipped — matches dismissed pattern: "${normalizedTitle}"`)
    return NextResponse.json({ message: 'skipped — matches dismissed pattern' }, { status: 200 })
  }

  // ── Store in Supabase ─────────────────────────────────────────────────────
  const { data: inserted, error: insertError } = await supabase
    .from('suggestions')
    .insert({
      user_id: userId,
      event_id: proposal.event_id,
      status: 'pending',
      title: proposal.title,
      reason: proposal.reason,
      current_json: proposal.current,
      proposed_json: proposal.proposed,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[suggestions/generate] supabase-insert — full error:', expandError(insertError))
    console.error('[suggestions/generate] supabase-insert — raw:', insertError)
    return NextResponse.json({ error: 'Failed to store suggestion' }, { status: 500 })
  }

  return NextResponse.json({ success: true, suggestionId: inserted.id })
}
