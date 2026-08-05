import { cn } from '@/lib/utils'

/**
 * Timeflow mark — a rounded green tile with a "T" cut from it, matching the
 * app's brand tile pattern (see top-bar / sidebar).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-brand',
        'text-[15px] font-bold leading-none tracking-[-0.03em] text-primary-foreground',
        'shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]',
        className,
      )}
    >
      T
    </span>
  )
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string
  markClassName?: string
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
        Timeflow
      </span>
    </span>
  )
}
