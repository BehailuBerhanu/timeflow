'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  CircleCheck,
  Clock,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useAssistant } from '@/hooks/use-assistant'
import { buildSuggestions, summarize } from '@/lib/suggestions'
import { formatDuration } from '@/lib/time'
import { ApprovalCard } from './approval-card'
import { SuggestionDiffModal } from './suggestion-diff-modal'
import { cn } from '@/lib/utils'
import type { Suggestion } from '@/lib/types'

const SUGGESTION_ICONS = {
  zap: Zap,
  shield: ShieldCheck,
  users: Users,
  clock: Clock,
  sparkles: Sparkles,
}

const QUICK_PROMPTS = [
  'Find 2 hours for deep work',
  'Move all meetings after 3 PM',
  'Schedule lunch with Alex next week',
]

function SummaryTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Clock
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full"
        style={{ background: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent }}
      >
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] leading-none text-muted-foreground">{label}</p>
        <p className="mt-1 text-[15px] font-semibold leading-none text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function AiPanel({
  expanded,
  onToggleExpanded,
  onEditEvent,
  className,
}: {
  expanded: boolean
  onToggleExpanded: () => void
  onEditEvent?: (eventId: string) => void
  className?: string
}) {
  const { state, dispatch, visibleEvents, queueProposals, pendingCount } = useStore()
  const { send, busy, messages } = useAssistant()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null)

  const today = useMemo(() => new Date(), [])
  const suggestions = useMemo(
    () => buildSuggestions(state.events, today, state.dismissed, state.connections),
    [state.events, today, state.dismissed, state.connections],
  )
  const stats = useMemo(
    () => summarize(visibleEvents, state.pending, today),
    [visibleEvents, state.pending, today],
  )

  const openChanges = state.pending.filter((c) => c.status === 'pending')
  const hasConversation = messages.length > 0

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, openChanges.length])

  function submit() {
    if (!draft.trim() || busy) return
    send(draft)
    setDraft('')
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col overflow-hidden border-l border-border bg-panel',
        expanded ? 'w-[420px]' : 'w-[268px]',
        className,
      )}
      aria-label="AI Assistant"
    >
      <header className="flex items-center justify-between px-4 pb-3 pt-4">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <Sparkles className="size-4 text-brand" strokeWidth={2.2} />
          AI Assistant
        </h2>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={expanded ? 'Collapse assistant' : 'Expand assistant'}
        >
          {expanded ? (
            <Minimize2 className="size-4" strokeWidth={2} />
          ) : (
            <Maximize2 className="size-4" strokeWidth={2} />
          )}
        </button>
      </header>

      <div ref={scrollRef} className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-4 pb-2">
        <p className="pb-2 text-[12px] font-medium text-muted-foreground">Today&apos;s summary</p>
        <div className="divide-y divide-border rounded-xl border border-border">
          <SummaryTile
            icon={CircleCheck}
            label="Time saved"
            value={formatDuration(stats.timeSavedMinutes)}
            accent="var(--brand)"
          />
          <SummaryTile
            icon={Target}
            label="Focus time"
            value={formatDuration(Math.round(stats.focusMinutes))}
            accent="var(--chart-4)"
          />
          <SummaryTile
            icon={ShieldCheck}
            label="Conflicts resolved"
            value={String(stats.conflictsResolved)}
            accent="var(--chart-5)"
          />
        </div>

        {openChanges.length > 0 && (
          <section className="pt-5">
            <div className="flex items-center justify-between pb-2">
              <p className="text-[12px] font-medium text-foreground">
                Waiting for approval
                <span className="ml-1.5 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-text">
                  {pendingCount}
                </span>
              </p>
              <button
                type="button"
                onClick={() => dispatch({ type: 'approveAll' })}
                className="text-[11.5px] font-semibold text-brand-text hover:underline"
              >
                Approve all
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {openChanges.map((change) => (
                <ApprovalCard key={change.id} change={change} compact />
              ))}
            </div>
          </section>
        )}

        {!hasConversation && suggestions.length > 0 && (
          <section className="pt-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-[12px] font-medium text-foreground">Suggestions</p>
              <span className="text-[12px] text-muted-foreground">{suggestions.length}</span>
            </div>
            <ul className="divide-y divide-border">
              {suggestions.map((s) => {
                const Icon = SUGGESTION_ICONS[s.icon]
                const sourceNames = s.sources
                  .map((id) => state.connections.find((c) => c.id === id)?.name)
                  .filter(Boolean) as string[]
                return (
                  <li key={s.id} className="group/sg flex items-start gap-2.5 py-2.5">
                    <Icon
                      className="mt-0.5 size-4 shrink-0 text-brand"
                      strokeWidth={2.2}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => setActiveSuggestion(s)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-[13px] font-semibold leading-snug text-foreground">
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                        {s.detail}
                      </p>
                      {sourceNames.length > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] leading-snug text-muted-foreground/70">
                          <Sparkles className="size-2.5 shrink-0 text-brand/60" aria-hidden />
                          based on {sourceNames.join(' and ')}
                        </p>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'dismissSuggestion', id: s.id })}
                      className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/sg:opacity-100"
                      aria-label={`Dismiss suggestion: ${s.title}`}
                    >
                      <X className="size-3.5" strokeWidth={2.4} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {hasConversation && (
          <section className="flex flex-col gap-3 pt-5" aria-live="polite">
            {messages.map((m) =>
              m.role === 'user' ? (
                <p
                  key={m.id}
                  className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-3 py-2 text-[12.5px] leading-relaxed text-foreground"
                >
                  {m.content}
                </p>
              ) : (
                <div key={m.id} className="flex flex-col gap-2">
                  {m.content ? (
                    <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground">
                      {m.content}
                    </p>
                  ) : m.pending ? (
                    <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Sparkles className="size-3.5 animate-pulse text-brand" />
                      Thinking&hellip;
                    </span>
                  ) : null}
                </div>
              ),
            )}
          </section>
        )}
      </div>

      <div className="border-t border-border px-4 pb-4 pt-3">
        {!hasConversation && (
          <div className="flex flex-col gap-1.5 pb-3">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                disabled={busy}
                className="truncate rounded-lg border border-border px-2.5 py-1.5 text-left text-[12px] text-foreground transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-text disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-1.5 focus-within:border-brand">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                submit()
              }
            }}
            rows={1}
            placeholder="Ask me anything..."
            aria-label="Message the AI assistant"
            className="max-h-24 min-h-7 flex-1 resize-none bg-transparent px-1.5 py-1 text-[12.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !draft.trim()}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp className="size-4" strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <SuggestionDiffModal
        suggestion={activeSuggestion}
        onClose={() => setActiveSuggestion(null)}
        onApproved={() => setActiveSuggestion(null)}
        onEdit={(eventId) => {
          setActiveSuggestion(null)
          if (eventId && onEditEvent) onEditEvent(eventId)
        }}
      />
    </aside>
  )
}
