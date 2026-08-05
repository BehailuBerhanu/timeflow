import { Eye, FileClock, KeyRound, Lock, ShieldCheck, Unplug } from 'lucide-react'
import { Section, SectionHeading } from './section'

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: 'Approval-gated writes',
    body: 'The assistant can propose. Only your approval can write to a calendar.',
  },
  {
    icon: KeyRound,
    title: 'Least-privilege scopes',
    body: 'Each integration requests the narrowest scope that makes its feature work.',
  },
  {
    icon: Eye,
    title: 'Read what it needs, keep what it must',
    body: 'Message context is used to draft a change, not archived for training.',
  },
  {
    icon: FileClock,
    title: 'Full change history',
    body: 'Every approval, edit, and dismissal is logged so you can retrace any move.',
  },
  {
    icon: Unplug,
    title: 'Disconnect anytime',
    body: 'Revoke a single source without losing your calendar or your history.',
  },
  {
    icon: Lock,
    title: 'Encrypted end to end in transit',
    body: 'TLS everywhere, encryption at rest, and no third-party ad tracking.',
  },
]

export function Security() {
  return (
    <Section id="security">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            label="Security"
            title="Nothing moves without you"
            description="An assistant with write access to your calendar is a trust problem before it is a product problem. Timeflow is designed so the worst case is a suggestion you ignore."
          />
          <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-soft p-5">
            <p className="text-[14px] font-semibold leading-snug text-brand-text">
              The approval queue is not a setting.
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-brand-text/80">
              There is no “auto-apply” toggle to forget about. Every write goes through you, every
              time, by design.
            </p>
          </div>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {GUARANTEES.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.title} className="flex flex-col gap-3 bg-panel p-6">
                <Icon className="size-[18px] text-brand" strokeWidth={1.9} aria-hidden />
                <h3 className="text-[14.5px] font-semibold tracking-[-0.01em] text-foreground">
                  {item.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-pretty text-muted-foreground">
                  {item.body}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}
