/**
 * POST /api/suggestions/[id]/reject
 *
 * Marks a suggestion as 'rejected' in Supabase, then records the normalized
 * event title in dismissed_patterns so future suggestion runs can skip it
 * for 14 days.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim()
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Mark the suggestion as rejected ──────────────────────────────────────
  const { error: updateError } = await supabase
    .from('suggestions')
    .update({ status: 'rejected' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[suggestions/reject] Supabase update failed:', updateError)
    return NextResponse.json({ error: 'Failed to reject suggestion' }, { status: 500 })
  }

  // ── Record the dismissed title pattern ────────────────────────────────────
  // Fetch the suggestion title so we can normalize and store it
  const { data: suggestion, error: fetchError } = await supabase
    .from('suggestions')
    .select('title')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError || !suggestion) {
    console.warn('[suggestions/reject] Could not fetch suggestion title for pattern recording:', fetchError)
    // Don't fail the rejection — just skip pattern recording
    return NextResponse.json({ success: true })
  }

  const { error: patternError } = await supabase
    .from('dismissed_patterns')
    .insert({
      user_id: user.id,
      event_title_pattern: normalizeTitle(suggestion.title),
    })

  if (patternError) {
    // Log but don't fail — rejection already succeeded
    console.error('[suggestions/reject] dismissed_patterns insert failed:', patternError)
  }

  return NextResponse.json({ success: true })
}
