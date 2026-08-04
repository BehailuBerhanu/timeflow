'use client'

import { ArrowLeft, Check, Info, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Connection, ConnectionGroup } from '@/lib/types'

const GROUPS: {
  id: ConnectionGroup
  title: string
  blurb: string
}[] = [
  {
    id: 'social',
    title: 'Accounts & calendars',
    blurb:
      'Where your commitments already live. Connecting one lets the assistant read context instead of guessing.',
  },
  {
    id: 'ai',
    title: 'AI models',
    blurb:
      'The assistants you already talk to. Timeflow reuses their context when it drafts changes.',
  },
]

/** Wordmark stand-in: first letter on the brand tint, no third-party logos shipped. */
function Mark({ connection }: { connection: Connection }) {
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-bold text-white"
      style={{ backgroundColor: connection.accent }}
    >
      {connection.name.charAt(0)}
    </span>
  )
}

function ConnectionRow({ connection }: { connection: Connection }) {
  const { dispatch } = useStore()

  return (
    <li className="flex items-start gap-3 py-3.5">
      <Mark connection={connection} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14px] font-semibold tracking-[-0.01em]">
            {connection.name}
          </p>
          {connection.connected ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-text">
              <Check className="size-2.5" strokeWidth={3} aria-hidden />
              Connected
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground text-pretty">
          {connection.unlocks}
        </p>
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: 'toggleConnection', id: connection.id })}
        aria-pressed={connection.connected}
        className={cn(
          'h-8 shrink-0 rounded-lg px-3 text-[12.5px] font-semibold transition-colors',
          connection.connected
            ? 'border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
            : 'bg-primary text-primary-foreground hover:brightness-95',
        )}
      >
        {connection.connected ? 'Disconnect' : 'Connect'}
      </button>
    </li>
  )
}

export function ConnectionsView() {
  const { state } = useStore()
  const connectedCount = state.connections.filter((c) => c.connected).length

  return (
    <main className="scrollbar-slim min-w-0 flex-1 overflow-y-auto px-5 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to calendar
          </a>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">Connections</h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground text-pretty">
            {connectedCount} of {state.connections.length} sources connected. The
            assistant reads from these to draft changes, and never writes to your
            calendar without your approval.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-brand-soft/60 px-3.5 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-text" aria-hidden />
          <p className="text-[12.5px] leading-relaxed text-brand-text text-pretty">
            <span className="font-semibold">Demo mode.</span> These toggles are
            simulated so you can see how the approval flow behaves. No real OAuth
            handshake happens and no data leaves your browser.
          </p>
        </div>

        {GROUPS.map((group) => {
          const items = state.connections.filter((c) => c.group === group.id)
          return (
            <section key={group.id}>
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                {group.title}
              </h2>
              <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-muted-foreground text-pretty">
                {group.blurb}
              </p>
              <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-panel px-3.5">
                {items.map((connection) => (
                  <ConnectionRow key={connection.id} connection={connection} />
                ))}
              </ul>
            </section>
          )
        })}

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-panel p-3.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground text-pretty">
            Connected sources shape what the assistant proposes. Turn one off and it
            stops reasoning about that context on your next request.
          </p>
        </div>
      </div>
    </main>
  )
}
