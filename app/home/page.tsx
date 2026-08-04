'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { HomeView } from '@/components/home-view'
import { useStore } from '@/lib/store'

export default function HomePage() {
  const { pendingCount } = useStore()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setCollapsed(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

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
    </div>
  )
}
