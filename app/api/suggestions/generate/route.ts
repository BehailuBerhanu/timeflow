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
import { generateSuggestion } from '@/lib/gemini-suggestions'

// ── Auth guard ────────────────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // must set CRON_SECRET in production
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get calling user (when triggered manually by the user themselves)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
  }

  const userId = user.id

  // ── Rate limit: max 2 suggestions per user per day ────────────────────────
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString())

  if ((count ?? 0) >= 2) {
    return NextResponse.json(
      { message: 'Daily suggestion limit reached for this user' },
      { status: 200 },
    )
  }

  // ── Get Google OAuth tokens from Supabase session ─────────────────────────
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const providerToken = session?.provider_token
  const providerRefreshToken = session?.provider_refresh_token

  if (!providerRefreshToken) {
    return NextResponse.json(
      { error: 'No Google refresh token — user must re-authenticate with Google' },
      { status: 400 },
    )
  }

  // ── Refresh access token ──────────────────────────────────────────────────
  let accessToken: string
  try {
    accessToken = providerToken ?? (await refreshGoogleToken(providerRefreshToken))
  } catch (err) {
    console.error('[suggestions/generate] Token refresh failed:', err)
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 })
  }

  // ── Fetch events ──────────────────────────────────────────────────────────
  let events
  try {
    events = await fetchUpcomingEvents(accessToken)
  } catch (err) {
    console.error('[suggestions/generate] Calendar fetch failed:', err)
    return NextResponse.json({ error: 'Failed to fetch Google Calendar events' }, { status: 500 })
  }

  if (events.length === 0) {
    return NextResponse.json({ message: 'No upcoming events found' }, { status: 200 })
  }

  // ── Generate suggestion via Gemini ────────────────────────────────────────
  const userTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'

  let proposal
  try {
    proposal = await generateSuggestion(events, userTimezone)
  } catch (err) {
    console.error('[suggestions/generate] Gemini call failed:', err)
    return NextResponse.json({ error: 'Gemini generation failed' }, { status: 500 })
  }

  if (!proposal) {
    return NextResponse.json({ message: 'No suggestion generated' }, { status: 200 })
  }

  // ── Check for duplicate: don't re-suggest a rejected change ──────────────
  const { data: existing } = await supabase
    .from('suggestions')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', proposal.event_id)
    .in('status', ['rejected', 'pending'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { message: 'Suggestion for this event already exists or was rejected' },
      { status: 200 },
    )
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
    console.error('[suggestions/generate] Supabase insert failed:', insertError)
    return NextResponse.json({ error: 'Failed to store suggestion' }, { status: 500 })
  }

  return NextResponse.json({ success: true, suggestionId: inserted.id })
}
