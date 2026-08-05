import { Section, SectionHeading } from './section'

const STEPS = [
  {
    title: 'Connect your sources',
    body: 'Link Google Calendar plus whichever of Gmail, Slack, and Notion you actually live in. Each connection lists exactly what it unlocks.',
  },
  {
    title: 'Timeflow reads the week',
    body: 'It maps your meetings, focus windows, workday bounds, and open tasks — then looks for collisions, dead gaps, and threats to deep work.',
  },
  {
    title: 'It drafts a change as a diff',
    body: 'No silent edits. You get a before-and-after with the source that informed it, sitting in the approval queue until you look at it.',
  },
  {
    title: 'You approve — then it applies',
    body: 'Approve and the calendar updates instantly. Edit first if the draft is close but not right. Dismiss and it learns to stop asking.',
  },
]

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="bg-canvas">
      <SectionHeading
        label="How it works"
        title="Four steps, and the last one is always yours"
        align="center"
        className="mx-auto"
      />

      <ol className="mt-16 grid gap-y-12 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-8">
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative flex flex-col gap-3.5">
            {/* connector rail */}
            <span aria-hidden className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand-soft font-mono text-[11.5px] font-semibold tabular-nums text-brand-text">
                {i + 1}
              </span>
              <span className="h-px flex-1 bg-border" />
            </span>
            <h3 className="text-[16.5px] font-semibold tracking-[-0.015em] text-foreground">
              {step.title}
            </h3>
            <p className="text-[14px] leading-relaxed text-pretty text-muted-foreground">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
