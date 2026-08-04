export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal'

export type Person = {
  id: string
  name: string
  avatar: string
}

export type CalendarEvent = {
  id: string
  title: string
  /** ISO string */
  start: string
  /** ISO string */
  end: string
  calendarId: string
  tone: Tone
  attendees: string[]
  /** extra attendees rendered as "+N" */
  extraAttendees?: number
  /** renders the "Focus time" progress rail seen on deep work blocks */
  focus?: boolean
  /** 0..1 */
  focusProgress?: number
  /** shows the sparkle badge: this block was shaped by the assistant */
  aiTouched?: boolean
  notes?: string
}

export type CalendarSource = {
  id: string
  name: string
  tone: Tone
  enabled: boolean
}

export type Suggestion = {
  id: string
  icon: 'zap' | 'shield' | 'users' | 'clock' | 'sparkles'
  title: string
  detail: string
  /** the change this suggestion would queue for approval */
  change: ProposedChange
}

export type ProposedChange =
  | {
      kind: 'create'
      title: string
      start: string
      end: string
      tone?: Tone
      calendarId?: string
      reason: string
    }
  | {
      kind: 'move'
      eventId: string
      start: string
      end: string
      reason: string
    }
  | {
      kind: 'delete'
      eventId: string
      reason: string
    }

export type PendingChange = ProposedChange & {
  id: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  /** ids of pending changes this message produced */
  changeIds?: string[]
  pending?: boolean
}

export type ConnectionGroup = 'social' | 'ai'

export type Connection = {
  id: string
  name: string
  group: ConnectionGroup
  unlocks: string
  connected: boolean
  /** brand tint used for the mark */
  accent: string
}

export type Theme = 'light' | 'dark'
