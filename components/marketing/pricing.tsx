'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Section, SectionHeading } from './section'
import { cn } from '@/lib/utils'

type Plan = {
  name: string
  monthly: number
  annual: number
  unit: string
  tagline: string
  cta: string
  featured?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    unit: 'forever',
    tagline: 'One calendar, the full approval flow, no card.',
    cta: 'Start free',
    features: [
      'One connected calendar',
      'Up to 5 drafted changes a week',
      'Focus blocks and tasks',
      'Approval queue with change history',
    ],
  },
  {
    name: 'Pro',
    monthly: 12,
    annual: 9,
    unit: 'per month',
    tagline: 'For the person whose week is the bottleneck.',
    cta: 'Try the live demo',
    featured: true,
    features: [
      'Unlimited calendars and drafted changes',
      'Gmail, Slack, and Notion context',
      'Focus protection and conflict routing',
      'Booking links with availability rules',
      'Weekly analytics on time and focus',
    ],
  },
  {
    name: 'Team',
    monthly: 20,
    annual: 16,
    unit: 'per user / month',
    tagline: 'Shared availability without shared chaos.',
    cta: 'Talk to us',
    features: [
      'Everything in Pro',
      'Team free/busy and meeting routing',
      'Shared booking pages and round-robin',
      'Admin scope controls and audit export',
      'Priority support',
    ],
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <Section id="pricing" className="bg-canvas">
      <SectionHeading
        label="Pricing"
        title="Pay for the hours it gives back"
        align="center"
        className="mx-auto"
      />

      {/* billing toggle */}
      <div className="mt-8 flex justify-center">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className="flex items-center gap-1 rounded-full border border-border bg-panel p-1"
        >
          {(
            [
              { id: 'monthly', label: 'Monthly' },
              { id: 'annual', label: 'Annual · save 25%' },
            ] as const
          ).map((option) => {
            const active = (option.id === 'annual') === annual
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAnnual(option.id === 'annual')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const price = annual ? plan.annual : plan.monthly
          return (
            <div
              key={plan.name}
              className={cn(
                'flex h-full flex-col rounded-2xl border p-7',
                plan.featured
                  ? 'border-brand/40 bg-panel shadow-[0_24px_60px_-30px_rgb(0_0_0/0.45)] lg:-my-3 lg:py-10'
                  : 'border-border bg-panel',
              )}
            >
              <div className="flex items-center gap-2.5">
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                  {plan.name}
                </h3>
                {plan.featured ? (
                  <span className="rounded-full border border-brand/25 bg-brand-soft px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-brand-text">
                    Most picked
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-[2.6rem] font-bold leading-none tracking-[-0.04em] tabular-nums text-foreground">
                  ${price}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {price === 0 ? plan.unit : plan.unit}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {price === 0 ? 'No card required' : annual ? 'Billed annually' : 'Billed monthly'}
              </p>

              <Link
                href={plan.name === 'Team' ? '/login' : '/home'}
                className={cn(
                  'mt-7 flex h-11 items-center justify-center rounded-full text-[14px] font-semibold transition-[filter,background-color]',
                  plan.featured
                    ? 'bg-primary text-primary-foreground hover:brightness-110'
                    : 'border border-border text-foreground hover:bg-secondary',
                )}
              >
                {plan.cta}
              </Link>

              <ul className="mt-7 flex flex-col gap-3 border-t border-border pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-brand"
                      strokeWidth={2.6}
                      aria-hidden
                    />
                    <span className="text-[13.5px] leading-snug text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
