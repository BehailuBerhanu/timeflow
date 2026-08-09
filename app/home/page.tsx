'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { HomeView } from '@/components/home-view'
import { OnboardingModal } from '@/components/onboarding-modal'
import { useStore } from '@/lib/store'
import { usePreferences } from '@/hooks/use-preferences'

export default function HomePage() {
  const { pendingCount, state } = useStore()
  const [collapsed, setCollapsed] = useState(false)
  const { preferences, loading, refetch } = usePreferences()

  // Show onboarding when preferences have loaded and no row exists
  const showOnboarding = !loading && preferences === null

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setCollapsed(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Calendar names from the store for the label step
  const calendarNames = state.calendars.map((c) => c.name)

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        active="home"
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onViewChanges={() => {}}
        pendingCount={pendingCount}
      />
      <HomeView />

      {showOnboarding && (
        <OnboardingModal
          calendarNames={calendarNames}
          onDone={refetch}
        />
      )}
    </div>
  )
}
