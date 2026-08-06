/**
 * POST /api/chat
 *
 * Calls Groq (llama-3.3-70b-versatile) via the official groq-sdk.
 * Runs a simple agentic loop: text response → tool call → tool result → final text.
 *
 * NDJSON stream to client:
 *   { type: 'text',     text: string }
 *   { type: 'proposal', change: ProposedChange }
 *   { type: 'error',    message: string }
 */

import Groq from 'groq-sdk'
import { buildSystemPrompt, type ChatContext } from './prompt'

export const maxDuration = 60

const MODEL = 'llama-3.3-70b-versatile'

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: Groq.Chat.CompletionCreateParams['tools'] = [
  {
    type: 'function',
    function: {
      name: 'proposeCreate',
      description: 'Queue a new calendar event for the user to approve before it is created.',
      parameters: {
        type: 'object',
        properties: {
          title:      { type: 'string', description: 'Short event title, max 40 characters' },
          start:      { type: 'string', description: 'Local datetime YYYY-MM-DDTHH:mm:00, no timezone' },
          end:        { type: 'string', description: 'Local datetime YYYY-MM-DDTHH:mm:00, no timezone' },
          tone:       { type: 'string', enum: ['blue', 'green', 'amber', 'red', 'violet', 'teal'] },
          calendarId: { type: 'string', enum: ['work', 'personal', 'school', 'fitness'] },
          reason:     { type: 'string', description: 'One sentence explaining why this helps' },
        },
        required: ['title', 'start', 'end', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'proposeMove',
      description: 'Queue a reschedule of an existing event. Use the exact event ID from the schedule.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'Exact event ID from the user schedule' },
          start:   { type: 'string', description: 'New start: YYYY-MM-DDTHH:mm:00' },
          end:     { type: 'string', description: 'New end: YYYY-MM-DDTHH:mm:00' },
          reason:  { type: 'string' },
        },
        required: ['eventId', 'start', 'end', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'proposeDelete',
      description: 'Queue removal of an existing event.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
          reason:  { type: 'string' },
        },
        required: ['eventId', 'reason'],
      },
    },
  },
]

const TOOL_TO_KIND: Record<string, 'create' | 'move' | 'delete'> = {
  proposeCreate: 'create',
  proposeMove:   'move',
  proposeDelete: 'delete',
}

// ── Request body type ─────────────────────────────────────────────────────────

type Body = {
  messages: { role: 'user' | 'assistant'; content: string }[]
  context: ChatContext
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // 1. Parse body
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const incomingMessages = (body.messages ?? []).slice(-12).filter((m) => m.content?.trim())
  if (!incomingMessages.length) return new Response('No messages', { status: 400 })

  // 2. Check API key
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    const line = JSON.stringify({
      type: 'error',
      message: 'GROQ_API_KEY is not set. Add it to .env.local — get a free key at console.groq.com.',
    }) + '\n'
    return new Response(line, { headers: { 'Content-Type': 'application/x-ndjson' } })
  }

  // 3. Build Groq client + message history
  const groq = new Groq({ apiKey })

  const systemPrompt = buildSystemPrompt(body.context)

  type Msg = Groq.Chat.CompletionMessageParam
  const messages: Msg[] = [
    { role: 'system', content: systemPrompt },
    ...incomingMessages.map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  // 4. Stream NDJSON response
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))

      // 30-second timeout guard
      const timeoutId = setTimeout(() => {
        console.error('[chat] Request timed out after 30s')
        send({ type: 'error', message: 'Request timed out. Please try again.' })
        controller.close()
      }, 30_000)

      try {
        const MAX_STEPS = 4

        for (let step = 0; step < MAX_STEPS; step++) {
          console.log(`[chat] step ${step + 1}/${MAX_STEPS} — calling Groq`)

          // Only offer tools on the first turn; after tool results just ask for plain text
          const isToolStep = step === 0
          const completion = await groq.chat.completions.create({
            model: MODEL,
            messages,
            tools: isToolStep ? TOOLS : undefined,
            tool_choice: isToolStep ? 'auto' : undefined,
            temperature: 0.4,
            max_tokens: 1024,
          })

          const choice = completion.choices?.[0]
          if (!choice) {
            console.warn('[chat] No choices in Groq response')
            break
          }

          const msg = choice.message
          console.log(`[chat] finish_reason=${choice.finish_reason} content_len=${msg.content?.length ?? 0} tool_calls=${msg.tool_calls?.length ?? 0}`)

          // Emit text content
          if (msg.content) {
            send({ type: 'text', text: msg.content })
          }

          // Handle tool calls
          if (choice.finish_reason === 'tool_calls' && msg.tool_calls?.length) {
            // Add assistant turn to history
            messages.push(msg as Msg)

            for (const tc of msg.tool_calls) {
              const kind = TOOL_TO_KIND[tc.function.name]
              if (kind) {
                let args: Record<string, unknown> = {}
                try {
                  args = JSON.parse(tc.function.arguments) as Record<string, unknown>
                } catch {
                  console.warn('[chat] Failed to parse tool args:', tc.function.arguments)
                }
                send({ type: 'proposal', change: { kind, ...args } })
              }

              // Add tool result to history
              messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: 'Queued for approval.',
              })
            }

            // Continue loop to get follow-up text from Groq
            continue
          }

          // stop or length — done
          break
        }
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err ?? '')
        console.error('[chat] Groq error:', raw)

        let msg = `Something went wrong: ${raw.slice(0, 200)}`
        if (/429|quota|rate.?limit/i.test(raw))
          msg = "You've hit Groq's rate limit. Wait a moment and try again."
        if (/401|403|api.?key|invalid_api/i.test(raw))
          msg = 'Groq API key rejected. Check GROQ_API_KEY in .env.local.'
        if (/timeout|ECONNRESET|network/i.test(raw))
          msg = 'Network timeout reaching Groq. Check your internet connection and try again.'

        send({ type: 'error', message: msg })
      } finally {
        clearTimeout(timeoutId)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
