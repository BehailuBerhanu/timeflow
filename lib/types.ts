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
  /** connection IDs that informed this suggestion, e.g. ['google-calendar', 'notion'] */
  sources: string[]
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

// ─── Settings ─────────────────────────────────────────────────────────────────

export type NotificationChannel = 'email' | 'push' | 'slack'

export type Settings = {
  /** IANA timezone string, e.g. "America/New_York" */
  timezone: string
  /** 24h hour when the working day starts */
  workdayStart: number
  /** 24h hour when the working day ends */
  workdayEnd: number
  /** preferred hour to start a focus block */
  focusStartHour: number
  /** preferred hour to end focus blocks */
  focusEndHour: number
  /** minimum acceptable focus block length in minutes */
  focusMinDuration: number
  /** notification preferences — UI-only, no real sends */
  notifications: {
    channel: NotificationChannel
    enabled: boolean
    /** minutes before event */
    reminderMinutes: number
    aiSuggestions: boolean
    weeklyDigest: boolean
    conflictAlerts: boolean
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskPriority = 'high' | 'medium' | 'low'

export type Task = {
  id: string
  title: string
  /** ISO date string (date only, no time) */
  dueDate: string
  done: boolean
  priority: TaskPriority
  /** optional id of a CalendarEvent this task is linked to */
  linkedEventId?: string
  calendarId: string
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export type BookingSlot = {
  /** day-of-week: 0=Sun … 6=Sat */
  day: number
  /** 24h hour start */
  startHour: number
  /** 24h hour end */
  endHour: number
}

export type BookingLink = {
  id: string
  title: string
  slug: string
  durationMinutes: number
  availability: BookingSlot[]
  active: boolean
}
