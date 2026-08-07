import { SiteHeader } from './site-header'
import { SiteFooter } from './site-footer'

export function LegalPage({
  title,
  label,
  lastUpdated,
  children,
}: {
  title: string
  label: string
  lastUpdated: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-background text-foreground min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[84rem] px-5 py-16 sm:px-8 lg:py-24">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-text">
            {label}
          </span>
          <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] leading-[1.06] text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-[13px] text-muted-foreground">Last updated: {lastUpdated}</p>
          <div className="mt-10 border-t border-border" />
          <div className="mt-10 max-w-3xl flex flex-col gap-12">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={id + '-heading'} className="flex flex-col gap-4 scroll-mt-24">
      <h2 id={id + '-heading'} className="text-[18px] font-bold tracking-[-0.02em] text-foreground">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}
