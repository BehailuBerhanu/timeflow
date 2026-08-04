'use client'

import { useEffect, useState } from 'react'
import { ConnectionsView } from '@/components/connections-view'
import { Sidebar } from '@/components/sidebar'
import { useStore } from '@/lib/store'

export default function ConnectionsPage() {
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
        active="connections"
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onViewChanges={() => {}}
        pendingCount={pendingCount}
      />
      <ConnectionsView />
    </div>
  )
}
