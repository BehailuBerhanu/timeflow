'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

/**
 * Returns the currently signed-in Supabase user (or null while loading).
 * Subscribes to auth state changes so it stays in sync.
 */
export function useUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined) // undefined = still loading

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })

    // Subscribe to future auth changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return user
}
