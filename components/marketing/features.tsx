import {
  CalendarCheck,
  ChartNoAxesColumn,
  GitCompareArrows,
  ListTodo,
  Plug,
  ShieldCheck,
} from 'lucide-react'
import { Section, SectionHeading } from './section'

const FEATURES = [
  {
    icon: GitCompareArrows,
    title: 'Proposals, not surprises',
    body: 'Every change arrives as a readable diff — old time on the left, new time on the right, and the reason it was drafted. Approve, edit first, or dismiss.',
  },
  {
    icon: Plug,
    title: 'Context from tools you already use',
    body: 'Google Calendar, Gmail, Slack, and Notion feed the assistant. A “let’s meet next week” thread becomes a draft event, not a nag.',
  },
  {
    icon: ShieldCheck,
    title: 'Focus time that holds its ground',
    body: 'Deep work blocks defend themselves. When a meeting collides, Timeflow proposes moving the meeting — not shrinking your focus.',
  },
  {
    icon: ListTodo,
    title: 'Tasks that live on the calendar',
    body: 'Give a task a real duration and it gets a real slot. Due dates stop being wishes and start being time you actually reserved.',
  },
  {
    icon: CalendarCheck,
    title: 'Booking links with your rules',
    body: 'Share availability windows without handing over your week. Guests pick a slot; your focus blocks stay invisible and untouched.',
  },
  {
    icon: ChartNoAxesColumn,
    title: 'A week you can actually read',
    body: 'See where the hours went — meeting load, focus hours protected, and how many drafts you approved versus threw away.',
  },
]

export function Features() {
  return (
    <Section id="features">
      <SectionHeading
        label="Features"
        title="Built around one rule: it never moves your day on its own"
        description="Most AI schedulers optimize first and apologize later. Timeflow does the thinking, then hands you the decision."
      />

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="group flex flex-col gap-4 bg-panel p-7 transition-colors duration-200 hover:bg-secondary/45"
            >
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-canvas text-brand transition-colors group-hover:border-brand/30 group-hover:bg-brand-soft">
                <Icon className="size-[18px]" strokeWidth={1.9} aria-hidden />
              </span>
              <h3 className="text-[16.5px] font-semibold tracking-[-0.015em] text-foreground">
                {feature.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-pretty text-muted-foreground">
                {feature.body}
              </p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
