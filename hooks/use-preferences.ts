'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type UserPreferences = {
  calendar_labels: Record<string, 'work' | 'personal'>
  focus_hours: { start: string; end: string } | null
}

type PreferencesState = {
  /** undefined = still loading, null = no row exists (show onboarding), object = preferences loaded */
  preferences: UserPreferences | null | undefined
  loading: boolean
  /** true once the fetch has completed, regardless of whether a row exists */
  hasCompletedOnboarding: boolean
  refetch: () => Promise<void>
}

export function usePreferences(): PreferencesState {
  const [preferences, setPreferences] = useState<UserPreferences | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  async function fetchPreferences() {
    const supabase = createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      setPreferences(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('calendar_labels, focus_hours')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (error) {
      console.error('[usePreferences] fetch failed:', error)
      // On error treat as no preferences — don't block the app
      setPreferences(null)
    } else {
      setPreferences(
        data
          ? {
              calendar_labels: (data.calendar_labels as Record<string, 'work' | 'personal'>) ?? {},
              focus_hours: (data.focus_hours as { start: string; end: string } | null) ?? null,
            }
          : null,
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPreferences()
  }, [])

  return {
    preferences,
    loading,
    // hasCompletedOnboarding is true when a row exists (preferences !== null and not loading)
    hasCompletedOnboarding: !loading && preferences !== null,
    refetch: fetchPreferences,
  }
}
