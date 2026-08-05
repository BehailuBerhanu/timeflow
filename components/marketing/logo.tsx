import Image from 'next/image'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center', className)} style={{ width: 66, height: 66 }}>
      <Image
        src="/logo.png"
        alt="Timeflow"
        width={66}
        height={66}
        className="size-full object-contain"
        priority
      />
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
