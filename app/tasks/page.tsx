'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { TasksView } from '@/components/tasks-view'
import { useStore } from '@/lib/store'

export default function TasksPage() {
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
        active="tasks"
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onViewChanges={() => {}}
        pendingCount={pendingCount}
      />
      <TasksView />
    </div>
  )
}
