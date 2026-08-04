import Image from 'next/image'
import { personById } from '@/lib/seed-data'
import { cn } from '@/lib/utils'

export function AvatarStack({
  ids,
  extra,
  size = 20,
  className,
}: {
  ids: string[]
  extra?: number
  size?: number
  className?: string
}) {
  if (!ids.length && !extra) return null
  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex items-center -space-x-1.5">
        {ids.map((id) => {
          const person = personById(id)
          if (!person) return null
          return (
            <Image
              key={id}
              src={person.avatar}
              alt={person.name}
              width={size}
              height={size}
              className="rounded-full ring-2 ring-[var(--chip-bg)] object-cover"
              style={{ width: size, height: size }}
            />
          )
        })}
      </div>
      {extra ? (
        <span className="ml-1.5 text-[11px] font-medium text-[var(--chip-fg)]/70">
          +{extra}
        </span>
      ) : null}
    </div>
  )
}
