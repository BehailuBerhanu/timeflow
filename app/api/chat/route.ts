/**
 * POST /api/chat
 *
 * Calls Gemini 2.5 Flash directly via @google/generative-ai.
 * Streams NDJSON to the client — one JSON object per line:
 *   { type: 'text',     text: string }
 *   { type: 'proposal', change: ProposedChange }
 *   { type: 'error',    message: string }
 *
 * No Vercel AI Gateway or AI_GATEWAY_API_KEY required.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type FunctionDeclaration,
  type Content,
  SchemaType,
} from '@google/generative-ai'
import { buildSystemPrompt, type ChatContext } from './prompt'

export const maxDuration = 60

// ── Tool declarations ─────────────────────────────────────────────────────────
// Gemini function-calling equivalents of the previous proposeCreate/Move/Delete tools.

const localDateTime: FunctionDeclaration['parameters'] = {
  type: SchemaType.STRING,
  description: 'Local date-time, format YYYY-MM-DDTHH:mm:00, no timezone suffix',
}

const TOOLS: FunctionDeclaration[] = [
  {
    name: 'proposeCreate',
    description:
      'Queue a new event for the user to approve. Use for focus blocks, meetings, workouts, anything new.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: 'Short event title, max 40 characters',
        },
        start: localDateTime,
        end: localDateTime,
        tone: {
          type: SchemaType.STRING,
          description: 'green for focus/deep work, blue for meetings, red for fitness',
          enum: ['blue', 'green', 'amber', 'red', 'violet', 'teal'],
        },
        calendarId: {
          type: SchemaType.STRING,
          enum: ['work', 'personal', 'school', 'fitness'],
        },
        reason: {
          type: SchemaType.STRING,
          description: 'One short sentence on why this helps',
        },
      },
      required: ['title', 'start', 'end', 'reason'],
    },
  },
  {
    name: 'proposeMove',
    description:
      'Queue a reschedule of an existing event. Pass the exact event id from the schedule list.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        eventId: { type: SchemaType.STRING },
        start: localDateTime,
        end: localDateTime,
        reason: {
          type: SchemaType.STRING,
          description: 'One short sentence on why this helps',
        },
      },
      required: ['eventId', 'start', 'end', 'reason'],
    },
  },
  {
    name: 'proposeDelete',
    description:
      'Queue the removal of an existing event. Pass the exact event id from the schedule list.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        eventId: { type: SchemaType.STRING },
        reason: {
          type: SchemaType.STRING,
          description: 'One short sentence on why this helps',
        },
      },
      required: ['eventId', 'reason'],
    },
  },
]

const TOOL_TO_KIND: Record<string, 'create' | 'move' | 'delete'> = {
  proposeCreate: 'create',
  proposeMove: 'move',
  proposeDelete: 'delete',
}

// ── Error helper ──────────────────────────────────────────────────────────────

function describeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '')
  if (/api.?key|unauthorized|401|403/i.test(raw)) {
    return 'Gemini rejected the API key. Make sure GEMINI_API_KEY in .env.local is a valid key from https://aistudio.google.com/app/apikey (it should start with "AIza").'
  }
  if (/rate.?limit|429|quota/i.test(raw)) {
    return 'Rate limited by Gemini. Wait a moment and try again.'
  }
  return `The assistant hit an error: ${raw.slice(0, 200)}`
}

// ── Request body type ─────────────────────────────────────────────────────────

type Body = {
  messages: { role: 'user' | 'assistant'; content: string }[]
  context: ChatContext
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Parse body
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const messages = (body.messages ?? []).slice(-12).filter((m) => m.content?.trim())
  if (!messages.length) return new Response('No messages', { status: 400 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const encoder = new TextEncoder()
    const errLine = JSON.stringify({
      type: 'error',
      message: 'GEMINI_API_KEY is not set. Add it to your environment variables.',
    }) + '\n'
    return new Response(encoder.encode(errLine), {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
    })
  }

  // Build Gemini conversation history.
  // The system prompt is passed as the first user turn + model ack (Gemini's
  // preferred pattern for system instructions in the chat history).
  const systemPrompt = buildSystemPrompt(body.context)

  const history: Content[] = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood. I am ready to help schedule.' }] },
    ...messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : ('model' as const),
      parts: [{ text: m.content }],
    })),
  ]

  const lastMessage = messages[messages.length - 1].content

  // Init Gemini
  const genai = new GoogleGenerativeAI(apiKey)
  const model = genai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    tools: [{ functionDeclarations: TOOLS }],
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  })

  const chat = model.startChat({ history })

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))

      try {
        // Up to 4 agentic steps: text → tool call → tool result → final text
        let pendingToolCalls: { name: string; args: Record<string, unknown> }[] = []
        let stepCount = 0
        const MAX_STEPS = 4

        // First turn: send the user message
        const result = await chat.sendMessageStream(lastMessage)

        let accumulatedText = ''

        for await (const chunk of result.stream) {
          const candidate = chunk.candidates?.[0]
          if (!candidate) continue

          for (const part of candidate.content?.parts ?? []) {
            if (part.text) {
              accumulatedText += part.text
              send({ type: 'text', text: part.text })
            }
            if (part.functionCall) {
              pendingToolCalls.push({
                name: part.functionCall.name,
                args: (part.functionCall.args ?? {}) as Record<string, unknown>,
              })
            }
          }
        }

        // Agentic loop: handle tool calls → send results → get next response
        while (pendingToolCalls.length > 0 && stepCount < MAX_STEPS) {
          stepCount++

          // Emit proposals to the client
          const toolResults = pendingToolCalls.map(({ name, args }) => {
            const kind = TOOL_TO_KIND[name]
            if (kind) {
              send({ type: 'proposal', change: { kind, ...args } })
            }
            return {
              functionResponse: {
                name,
                response: { result: 'Queued for approval.' },
              },
            }
          })

          pendingToolCalls = []

          // Send tool results back to Gemini for a follow-up text response
          const followUp = await chat.sendMessageStream(toolResults)

          for await (const chunk of followUp.stream) {
            const candidate = chunk.candidates?.[0]
            if (!candidate) continue

            for (const part of candidate.content?.parts ?? []) {
              if (part.text) {
                send({ type: 'text', text: part.text })
              }
              if (part.functionCall) {
                pendingToolCalls.push({
                  name: part.functionCall.name,
                  args: (part.functionCall.args ?? {}) as Record<string, unknown>,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('[chat] Gemini call failed:', error)
        send({ type: 'error', message: describeError(error) })
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
