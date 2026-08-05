import type { Metadata } from 'next'
import { Faq } from '@/components/marketing/faq'
import { Features } from '@/components/marketing/features'
import { FinalCta } from '@/components/marketing/final-cta'
import { Hero } from '@/components/marketing/hero'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Pricing } from '@/components/marketing/pricing'
import { Security } from '@/components/marketing/security'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteHeader } from '@/components/marketing/site-header'

export const metadata: Metadata = {
  title: 'Timeflow — The AI calendar that asks before it acts',
  description:
    'Timeflow reads your calendar, email, and chat context to draft schedule changes — then waits for your approval before applying a single one.',
  openGraph: {
    title: 'Timeflow — The AI calendar that asks before it acts',
    description:
      'Timeflow drafts schedule changes as a readable diff and never applies them without your approval.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Security />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
