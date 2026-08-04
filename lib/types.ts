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
  /** one-line explanation of the reasoning behind this suggestion */
  why: string
  /** ids of the connections whose data informed this suggestion */
  sources: string[]
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
  /** connection ids that informed this change, surfaced in the diff */
  sources?: string[]
  /** set when the user edited the proposal before approving it */
  edited?: boolean
}

export type Task = {
  id: string
  title: string
  /** ISO date (yyyy-mm-dd) */
  due: string
  done: boolean
  /** optional calendar event this task is attached to */
  eventId?: string
  /** which connected source this task came from, e.g. "notion" */
  sourceId?: string
  createdAt: string
}

/** 0 = Sunday .. 6 = Saturday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Availability = {
  /** weekdays open for bookings */
  days: Weekday[]
  /** "09:00" */
  from: string
  /** "17:00" */
  to: string
}

export type BookingLink = {
  id: string
  name: string
  slug: string
  /** meeting length in minutes */
  duration: number
  availability: Availability
  /** buffer between bookings, minutes */
  buffer: number
  createdAt: string
}

export type Booking = {
  id: string
  linkId: string
  name: string
  email: string
  /** ISO local start */
  start: string
  createdAt: string
}

export type Settings = {
  timezone: string
  workdayStart: string
  workdayEnd: string
  workdays: Weekday[]
  /** preferred minimum focus block, minutes */
  focusBlockMinutes: number
  /** protect focus blocks from auto-scheduling */
  protectFocus: boolean
  weekStartsOn: 0 | 1
  notifications: {
    proposals: boolean
    dailyDigest: boolean
    conflicts: boolean
    bookings: boolean
  }
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
