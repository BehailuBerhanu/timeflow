'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Root route — redirects to /home so the middleware never has to deal
 * with an unauthenticated request landing on the calendar directly.
 */
export default function RootPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/home')
  }, [router])
  return null
}
