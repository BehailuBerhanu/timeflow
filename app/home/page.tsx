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
  // Once dismissed (saved or skipped), hide the modal regardless of preferences state
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)

  // Show onboarding when preferences have loaded, no row exists, and not yet dismissed
  const showOnboarding = !loading && preferences === null && !onboardingDismissed

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setCollapsed(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const calendarNames = state.calendars.map((c) => c.name)

  async function handleOnboardingDone() {
    await refetch()
    setOnboardingDismissed(true)
  }

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
          onDone={handleOnboardingDone}
        />
      )}
    </div>
  )
}
