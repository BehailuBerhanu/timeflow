import { cn } from '@/lib/utils'

export function SectionHeading({
  label,
  title,
  description,
  align = 'start',
  className,
}: {
  label: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'start' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start',
        className,
      )}
    >
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-text">
        {label}
      </span>
      <h2 className="max-w-2xl text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.06] tracking-[-0.03em] text-balance text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="max-w-xl text-[16px] leading-relaxed text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn('scroll-mt-20 border-t border-border', className)}>
      <div className="mx-auto w-full max-w-[84rem] px-5 py-20 sm:px-8 lg:py-28">{children}</div>
    </section>
  )
}
