/**
 * POST /api/preferences
 *
 * Upserts the user_preferences row for the currently authenticated user.
 * Called by the onboarding modal on "Save & Continue" and "Skip".
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type PreferencesPayload = {
  calendar_labels: Record<string, 'work' | 'personal'>
  focus_hours: { start: string; end: string } | null
}

export async function POST(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PreferencesPayload
  try {
    body = (await req.json()) as PreferencesPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { error } = await supabase.from('user_preferences').upsert(
    {
      user_id: user.id,
      calendar_labels: body.calendar_labels ?? {},
      focus_hours: body.focus_hours ?? null,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('[preferences] upsert failed:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
