import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function FinalCta() {
  return (
    <section className="border-t border-border bg-canvas">
      <div className="mx-auto w-full max-w-[84rem] px-5 py-24 sm:px-8 lg:py-32">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-panel px-6 py-16 sm:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage: `linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
                linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(120% 80% at 50% 0%, black, transparent 75%)',
            }}
          />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="text-[clamp(2rem,4.6vw,3.1rem)] font-bold leading-[1.04] tracking-[-0.035em] text-balance text-foreground">
              Get your week back — without giving up the wheel
            </h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-pretty text-muted-foreground">
              Open the live demo and approve your first drafted change. Nothing to install, no card,
              and every edit still needs your yes.
            </p>
            <Link
              href="/signup"
              className="group mt-9 flex h-12 items-center gap-2 rounded-full bg-primary pl-6 pr-5 text-[15px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:translate-y-px"
            >
              Try the live demo
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.4}
              />
            </Link>
            <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              You approve · Timeflow applies
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
