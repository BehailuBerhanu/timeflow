'use client'

import { useCallback, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { addDays, startOfWeek, toLocalISO } from '@/lib/time'
import type { ProposedChange } from '@/lib/types'

type StreamLine =
  | { type: 'text'; text: string }
  | { type: 'proposal'; change: ProposedChange }
  | { type: 'error'; message: string }

let msgSeq = 0
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++msgSeq}`

export function useAssistant() {
  const { state, dispatch, queueProposals } = useStore()
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || busy) return

      // ── Intercept approval/rejection shortcuts ────────────────────────────
      const pendingChanges = state.pending.filter((c) => c.status === 'pending')
      if (/^approve( all)?$/i.test(text) && pendingChanges.length > 0) {
        dispatch({ type: 'approveAll' })
        const userMessage = { id: nextId('u'), role: 'user' as const, content: text }
        const replyId = nextId('a')
        dispatch({ type: 'addMessage', message: userMessage })
        dispatch({
          type: 'addMessage',
          message: {
            id: replyId,
            role: 'assistant',
            content: `✓ Applied ${pendingChanges.length} change${pendingChanges.length > 1 ? 's' : ''} to your calendar.`,
            pending: false,
          },
        })
        return
      }
      if (/^reject( all)?$|^dismiss( all)?$/i.test(text) && pendingChanges.length > 0) {
        for (const c of pendingChanges) {
          dispatch({ type: 'resolveChange', id: c.id, approved: false })
        }
        const userMessage = { id: nextId('u'), role: 'user' as const, content: text }
        const replyId = nextId('a')
        dispatch({ type: 'addMessage', message: userMessage })
        dispatch({
          type: 'addMessage',
          message: { id: replyId, role: 'assistant', content: 'Dismissed — no changes made.', pending: false },
        })
        return
      }

      const userMessage = { id: nextId('u'), role: 'user' as const, content: text }
      const replyId = nextId('a')
      dispatch({ type: 'addMessage', message: userMessage })
      dispatch({
        type: 'addMessage',
        message: { id: replyId, role: 'assistant', content: '', pending: true },
      })
      setBusy(true)

      // only send the current week so the prompt stays small
      const weekStart = startOfWeek(new Date())
      const weekEnd = addDays(weekStart, 7)
      const scoped = state.events.filter((e) => {
        const start = new Date(e.start)
        return start >= weekStart && start < weekEnd
      })

      const controller = new AbortController()
      abortRef.current = controller

      let content = ''
      const changeIds: string[] = []

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [
              ...state.chat
                .filter((m) => m.content.trim())
                .map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: text },
            ],
            context: {
              today: toLocalISO(new Date()),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              events: scoped.map((e) => ({
                id: e.id,
                title: e.title,
                start: e.start,
                end: e.end,
                calendarId: e.calendarId,
                focus: e.focus,
              })),
              calendars: state.calendars.map((c) => ({ id: c.id, name: c.name })),
              connections: state.connections.map((c) => ({
                name: c.name,
                group: c.group,
                connected: c.connected,
              })),
            },
          }),
        })

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => '')
          throw new Error(detail || `Request failed: ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        const handleLine = (line: string) => {
          if (!line.trim()) return
          let parsed: StreamLine
          try {
            parsed = JSON.parse(line) as StreamLine
          } catch {
            return
          }
          if (parsed.type === 'text') {
            content += parsed.text
            dispatch({ type: 'patchMessage', id: replyId, patch: { content } })
          } else if (parsed.type === 'proposal') {
            const [id] = queueProposals([parsed.change])
            if (id) {
              changeIds.push(id)
              dispatch({ type: 'patchMessage', id: replyId, patch: { changeIds: [...changeIds] } })
            }
          } else if (parsed.type === 'error') {
            content += (content ? '\n\n' : '') + parsed.message
            dispatch({ type: 'patchMessage', id: replyId, patch: { content } })
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) handleLine(line)
        }
        handleLine(buffer)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.log('[v0] assistant request failed:', error)
          dispatch({
            type: 'patchMessage',
            id: replyId,
            patch: {
              content:
                content ||
                'I could not reach the model just now. Check that GEMINI_API_KEY is set and try again.',
            },
          })
        }
      } finally {
        dispatch({ type: 'patchMessage', id: replyId, patch: { pending: false } })
        abortRef.current = null
        setBusy(false)
      }
    },
    [busy, dispatch, queueProposals, state.calendars, state.chat, state.connections, state.events],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  return { send, stop, busy, messages: state.chat }
}
