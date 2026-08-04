import { streamText, tool, stepCountIs } from 'ai'
import { z } from 'zod'
import { buildSystemPrompt, type ChatContext } from './prompt'

export const maxDuration = 30

const localDateTime = z
  .string()
  .describe('Local date-time, format YYYY-MM-DDTHH:mm:00, no timezone suffix')

/**
 * The tools never touch data. They only record a proposal, which we stream to the
 * client as an approval card. Returning a confirmation string keeps the model from
 * calling the same tool again in the next step.
 */
const proposalTools = {
  proposeCreate: tool({
    description:
      'Queue a new event for the user to approve. Use for focus blocks, meetings, workouts, anything new.',
    inputSchema: z.object({
      title: z.string().describe('Short event title, max 40 characters'),
      start: localDateTime,
      end: localDateTime,
      tone: z
        .enum(['blue', 'green', 'amber', 'red', 'violet', 'teal'])
        .describe('green for focus/deep work, blue for meetings, red for fitness')
        .optional(),
      calendarId: z.enum(['work', 'personal', 'school', 'fitness']).optional(),
      reason: z.string().describe('One short sentence on why this helps'),
    }),
    execute: async () => 'Queued for approval.',
  }),
  proposeMove: tool({
    description:
      'Queue a reschedule of an existing event. Pass the exact event id from the schedule list.',
    inputSchema: z.object({
      eventId: z.string(),
      start: localDateTime,
      end: localDateTime,
      reason: z.string().describe('One short sentence on why this helps'),
    }),
    execute: async () => 'Queued for approval.',
  }),
  proposeDelete: tool({
    description:
      'Queue the removal of an existing event. Pass the exact event id from the schedule list.',
    inputSchema: z.object({
      eventId: z.string(),
      reason: z.string().describe('One short sentence on why this helps'),
    }),
    execute: async () => 'Queued for approval.',
  }),
}

const TOOL_TO_KIND: Record<string, 'create' | 'move' | 'delete'> = {
  proposeCreate: 'create',
  proposeMove: 'move',
  proposeDelete: 'delete',
}

type Body = {
  messages: { role: 'user' | 'assistant'; content: string }[]
  context: ChatContext
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const messages = (body.messages ?? []).slice(-12).filter((m) => m.content?.trim())
  if (!messages.length) return new Response('No messages', { status: 400 })

  const result = streamText({
    model: 'anthropic/claude-sonnet-5',
    system: buildSystemPrompt(body.context),
    messages,
    tools: proposalTools,
    stopWhen: stepCountIs(4),
  })

  // NDJSON: one JSON object per line. Simple to parse and lets us interleave
  // text deltas with structured proposal cards.
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'text-delta') {
            send({ type: 'text', text: part.text })
          } else if (part.type === 'tool-call') {
            const kind = TOOL_TO_KIND[part.toolName]
            if (kind) {
              send({
                type: 'proposal',
                change: { kind, ...(part.input as Record<string, unknown>) },
              })
            }
          } else if (part.type === 'error') {
            console.log('[v0] stream error part:', part.error)
            send({ type: 'error', message: 'The assistant hit an error mid-response.' })
          }
        }
      } catch (error) {
        console.log('[v0] chat stream failed:', error)
        send({ type: 'error', message: 'The assistant is unavailable right now.' })
      } finally {
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
