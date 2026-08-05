import Link from 'next/link'
import { ArrowRight, CircleCheck, Sparkles } from 'lucide-react'
import { HeroCalendar } from './hero-calendar'

const TRUST = ['Works with your tools', 'Privacy first', 'You’re always in control']

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* vertical guides — the only decorative layer on the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '120px 100%',
          maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 65%, transparent)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[84rem] px-5 pb-20 pt-14 sm:px-8 lg:pb-28 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-10">
          {/* copy */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-soft px-3 py-1.5 text-[12.5px] font-medium text-brand-text">
              <Sparkles className="size-3.5" strokeWidth={2.2} aria-hidden />
              AI that respects your time
            </span>

            <h1 className="mt-6 text-[clamp(2.6rem,7.2vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.035em] text-balance text-foreground">
              The AI calendar that <span className="text-brand">asks</span> before{' '}
              <span className="text-brand">it acts</span>
            </h1>

            <p className="mt-6 max-w-lg text-[16.5px] leading-relaxed text-muted-foreground">
              Timeflow reads your calendar, email, and chat context to draft schedule changes — but
              never applies them without your approval.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/home"
                className="group flex h-12 items-center gap-2 rounded-full bg-primary pl-6 pr-5 text-[15px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:translate-y-px"
              >
                Try the live demo
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.4}
                />
              </Link>
              <a
                href="#how-it-works"
                className="flex h-12 items-center rounded-full border border-border px-6 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary"
              >
                See how it works
              </a>
            </div>

            <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {TRUST.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground"
                >
                  <CircleCheck className="size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* product */}
          <div className="lg:-mr-8 xl:-mr-14">
            <HeroCalendar />
          </div>
        </div>
      </div>
    </section>
  )
}
