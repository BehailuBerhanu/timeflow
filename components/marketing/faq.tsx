'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Section, SectionHeading } from './section'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: 'How is this different from Reclaim or Motion?',
    a: 'Those tools are built to rearrange your week automatically — you find out afterwards. Timeflow inverts that: it drafts the same kind of change, shows you the diff and the reason, and waits. You keep the intelligence and lose the surprise.',
  },
  {
    q: 'Can I let it apply changes automatically?',
    a: 'No, and that is deliberate. There is no auto-apply switch to enable and then forget about. If a certain kind of draft is always right, you can dismiss patterns you do not want so it stops asking.',
  },
  {
    q: 'What does it actually read from Gmail, Slack, and Notion?',
    a: 'Scheduling signals only — proposed times in a thread, standup times, and task due dates. It uses that context to draft a change and does not retain your message content for model training.',
  },
  {
    q: 'Will it touch calendars I share with other people?',
    a: 'Only events you own, and only after you approve. Shared calendars can be read for free/busy so drafts avoid other people’s time, without writing to them.',
  },
  {
    q: 'What happens to my focus blocks when a meeting collides?',
    a: 'Timeflow proposes moving the meeting rather than trimming your deep work. If nothing can move, it tells you the conflict is unavoidable instead of quietly picking a loser.',
  },
  {
    q: 'Do I need to migrate off my current calendar?',
    a: 'No. Timeflow sits on top of Google Calendar as a layer, not a replacement. Your existing events, invites, and notifications keep working exactly as they do today.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <SectionHeading
          label="FAQ"
          title="The questions people ask before trusting it"
          className="lg:sticky lg:top-24 lg:self-start"
        />

        <div className="divide-y divide-border border-y border-border">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-4 py-5 text-left outline-none"
                >
                  <span
                    className={cn(
                      'flex-1 text-[15.5px] font-medium leading-snug tracking-[-0.01em] transition-colors',
                      isOpen ? 'text-foreground' : 'text-foreground/85 hover:text-foreground',
                    )}
                  >
                    {item.q}
                  </span>
                  <Plus
                    aria-hidden
                    className={cn(
                      'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                      isOpen && 'rotate-45 text-brand',
                    )}
                    strokeWidth={2}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-xl pb-5 pr-8 text-[14px] leading-relaxed text-pretty text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
