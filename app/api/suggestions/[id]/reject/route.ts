/**
 * POST /api/suggestions/[id]/reject
 *
 * Marks a suggestion as 'rejected' in Supabase.
 * Does not touch Google Calendar.
 * The generate endpoint will skip rejected event_ids, so the same
 * change won't be suggested again.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { error } = await supabase
    .from('suggestions')
    .update({ status: 'rejected' })
    .eq('id', id)
    .eq('user_id', user.id) // row-level safety

  if (error) {
    console.error('[suggestions/reject] Supabase update failed:', error)
    return NextResponse.json({ error: 'Failed to reject suggestion' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
