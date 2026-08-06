/**
 * POST /api/suggestions/[id]/approve
 *
 * 1. Loads the pending suggestion from Supabase
 * 2. Refreshes the Google access token
 * 3. PATCHes the event's start/end on Google Calendar
 * 4. Marks the suggestion 'approved' in Supabase
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshGoogleToken, patchCalendarEvent } from '@/lib/google-calendar'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load the suggestion — must belong to this user and still be pending
  const { data: suggestion, error: fetchError } = await supabase
    .from('suggestions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single()

  if (fetchError || !suggestion) {
    return NextResponse.json(
      { error: 'Suggestion not found or already resolved' },
      { status: 404 },
    )
  }

  // Get refresh token
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const providerToken = session?.provider_token
  const providerRefreshToken = session?.provider_refresh_token

  if (!providerRefreshToken) {
    return NextResponse.json(
      { error: 'No Google refresh token — user must re-authenticate' },
      { status: 400 },
    )
  }

  // Refresh access token
  let accessToken: string
  try {
    accessToken = providerToken ?? (await refreshGoogleToken(providerRefreshToken))
  } catch (err) {
    console.error('[suggestions/approve] Token refresh failed:', err)
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 })
  }

  // Build ISO datetime strings from the proposal's date + time parts
  const proposed = suggestion.proposed_json as {
    date: string
    start_time: string
    end_time: string
  }

  const startDateTime = `${proposed.date}T${proposed.start_time}:00`
  const endDateTime = `${proposed.date}T${proposed.end_time}:00`

  // PATCH the event on Google Calendar
  try {
    await patchCalendarEvent(
      accessToken,
      suggestion.event_id,
      startDateTime,
      endDateTime,
    )
  } catch (err) {
    console.error('[suggestions/approve] Google Calendar patch failed:', err)
    return NextResponse.json(
      { error: 'Failed to update event on Google Calendar' },
      { status: 500 },
    )
  }

  // Mark approved in Supabase
  const { error: updateError } = await supabase
    .from('suggestions')
    .update({ status: 'approved' })
    .eq('id', id)

  if (updateError) {
    console.error('[suggestions/approve] Supabase update failed:', updateError)
    // The calendar was already patched — still return success to avoid confusion
  }

  return NextResponse.json({ success: true })
}
