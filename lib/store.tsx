'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { CALENDARS, CONNECTIONS, BOOKING_LINKS, seedEvents, seedTasks } from './seed-data'
import { addMinutes, atTime, toLocalISO } from './time'
import type {
  BookingLink,
  CalendarEvent,
  CalendarSource,
  ChatMessage,
  Connection,
  PendingChange,
  ProposedChange,
  Settings,
  Task,
  Theme,
} from './types'

const STORAGE_KEY_PREFIX = 'timeflow:v1'

function storageKey(userId: string | null) {
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : STORAGE_KEY_PREFIX
}

const DEFAULT_SETTINGS: Settings = {
  timezone: typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC',
  workdayStart: 9,
  workdayEnd: 18,
  focusStartHour: 9,
  focusEndHour: 13,
  focusMinDuration: 90,
  notifications: {
    channel: 'push',
    enabled: true,
    reminderMinutes: 10,
    aiSuggestions: true,
    weeklyDigest: true,
    conflictAlerts: true,
  },
}

type State = {
  events: CalendarEvent[]
  calendars: CalendarSource[]
  connections: Connection[]
  chat: ChatMessage[]
  pending: PendingChange[]
  dismissed: string[]
  tasks: Task[]
  bookingLinks: BookingLink[]
  settings: Settings
  theme: Theme
  hydrated: boolean
}

type Persisted = Omit<State, 'hydrated'>

const initialState: State = {
  events: seedEvents(),
  calendars: CALENDARS,
  connections: CONNECTIONS,
  chat: [],
  pending: [],
  dismissed: [],
  tasks: seedTasks(),
  bookingLinks: BOOKING_LINKS,
  settings: DEFAULT_SETTINGS,
  theme: 'light',
  hydrated: false,
}

type Action =
  | { type: 'hydrate'; payload: Partial<Persisted> }
  | { type: 'theme'; theme: Theme }
  | { type: 'toggleCalendar'; id: string }
  | { type: 'toggleConnection'; id: string }
  | { type: 'addEvent'; event: CalendarEvent }
  | { type: 'updateEvent'; id: string; patch: Partial<CalendarEvent> }
  | { type: 'deleteEvent'; id: string }
  | { type: 'queueChanges'; changes: PendingChange[] }
  | { type: 'resolveChange'; id: string; approved: boolean }
  | { type: 'approveAll' }
  | { type: 'clearResolved' }
  | { type: 'dismissSuggestion'; id: string }
  | { type: 'addMessage'; message: ChatMessage }
  | { type: 'patchMessage'; id: string; patch: Partial<ChatMessage> }
  | { type: 'resetChat' }
  | { type: 'addTask'; task: Task }
  | { type: 'toggleTask'; id: string }
  | { type: 'deleteTask'; id: string }
  | { type: 'updateTask'; id: string; patch: Partial<Task> }
  | { type: 'addBookingLink'; link: BookingLink }
  | { type: 'updateBookingLink'; id: string; patch: Partial<BookingLink> }
  | { type: 'deleteBookingLink'; id: string }
  | { type: 'updateSettings'; patch: Partial<Settings> }

function applyChange(events: CalendarEvent[], change: PendingChange): CalendarEvent[] {
  if (change.kind === 'create') {
    return [
      ...events,
      {
        id: `e-${change.id}`,
        title: change.title,
        start: change.start,
        end: change.end,
        calendarId: change.calendarId ?? 'work',
        tone: change.tone ?? 'green',
        attendees: [],
        aiTouched: true,
        focus: /focus|deep work/i.test(change.title),
        focusProgress: 0,
      },
    ]
  }
  if (change.kind === 'move') {
    return events.map((e) =>
      e.id === change.eventId
        ? { ...e, start: change.start, end: change.end, aiTouched: true }
        : e,
    )
  }
  return events.filter((e) => e.id !== change.eventId)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, hydrated: true }
    case 'theme':
      return { ...state, theme: action.theme }
    case 'toggleCalendar':
      return {
        ...state,
        calendars: state.calendars.map((c) =>
          c.id === action.id ? { ...c, enabled: !c.enabled } : c,
        ),
      }
    case 'toggleConnection':
      return {
        ...state,
        connections: state.connections.map((c) =>
          c.id === action.id ? { ...c, connected: !c.connected } : c,
        ),
      }
    case 'addEvent':
      return { ...state, events: [...state.events, action.event] }
    case 'updateEvent':
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      }
    case 'deleteEvent':
      return { ...state, events: state.events.filter((e) => e.id !== action.id) }
    case 'queueChanges':
      return { ...state, pending: [...state.pending, ...action.changes] }
    case 'resolveChange': {
      const change = state.pending.find((c) => c.id === action.id)
      if (!change || change.status !== 'pending') return state
      return {
        ...state,
        events: action.approved ? applyChange(state.events, change) : state.events,
        pending: state.pending.map((c) =>
          c.id === action.id
            ? { ...c, status: action.approved ? 'approved' : 'rejected' }
            : c,
        ),
      }
    }
    case 'approveAll': {
      let events = state.events
      for (const change of state.pending) {
        if (change.status === 'pending') events = applyChange(events, change)
      }
      return {
        ...state,
        events,
        pending: state.pending.map((c) =>
          c.status === 'pending' ? { ...c, status: 'approved' } : c,
        ),
      }
    }
    case 'clearResolved':
      return { ...state, pending: state.pending.filter((c) => c.status === 'pending') }
    case 'dismissSuggestion':
      return { ...state, dismissed: [...state.dismissed, action.id] }
    case 'addMessage':
      return { ...state, chat: [...state.chat, action.message] }
    case 'patchMessage':
      return {
        ...state,
        chat: state.chat.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)),
      }
    case 'resetChat':
      return { ...state, chat: [] }
    case 'addTask':
      return { ...state, tasks: [...state.tasks, action.task] }
    case 'toggleTask':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),
      }
    case 'deleteTask':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case 'updateTask':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t,
        ),
      }
    case 'addBookingLink':
      return { ...state, bookingLinks: [...state.bookingLinks, action.link] }
    case 'updateBookingLink':
      return {
        ...state,
        bookingLinks: state.bookingLinks.map((l) =>
          l.id === action.id ? { ...l, ...action.patch } : l,
        ),
      }
    case 'deleteBookingLink':
      return { ...state, bookingLinks: state.bookingLinks.filter((l) => l.id !== action.id) }
    case 'updateSettings':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.patch,
          // deep-merge notifications if provided
          notifications: action.patch.notifications
            ? { ...state.settings.notifications, ...action.patch.notifications }
            : state.settings.notifications,
        },
      }
    default:
      return state
  }
}

type StoreValue = {
  state: State
  dispatch: React.Dispatch<Action>
  visibleEvents: CalendarEvent[]
  pendingCount: number
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  queueProposals: (changes: ProposedChange[]) => string[]
  createQuickEvent: (day: Date, hour: number, minute?: number) => CalendarEvent
  updateSettings: (patch: Partial<Settings>) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const seq = useRef(0)
  const currentUserIdRef = useRef<string | null>(null)

  // hydrate once on the client, scoped to the logged-in user
  useEffect(() => {
    async function hydrate() {
      // Get the current user ID from Supabase
      let userId: string | null = null
      try {
        const { createClient } = await import('./supabase/client')
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        userId = data.user?.id ?? null
      } catch {
        // No Supabase or not logged in — use anonymous key
      }

      currentUserIdRef.current = userId
      const key = storageKey(userId)

      try {
        const raw = window.localStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Persisted>
          // Always reset chat so users never see another user's conversation
          dispatch({ type: 'hydrate', payload: { ...parsed, chat: [], pending: [] } })
          return
        }
      } catch {
        // corrupt payload: fall through to seed
      }
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      dispatch({ type: 'hydrate', payload: { theme: prefersDark ? 'dark' : 'light' } })
    }

    hydrate()
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    const { hydrated, ...persisted } = state
    try {
      window.localStorage.setItem(storageKey(currentUserIdRef.current), JSON.stringify(persisted))
    } catch {
      // storage full or blocked: the app still works in-memory
    }
  }, [state])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', state.theme === 'dark')
    root.classList.toggle('light', state.theme === 'light')
  }, [state.theme])

  const enabledIds = useMemo(
    () => new Set(state.calendars.filter((c) => c.enabled).map((c) => c.id)),
    [state.calendars],
  )

  const visibleEvents = useMemo(
    () => state.events.filter((e) => enabledIds.has(e.calendarId)),
    [state.events, enabledIds],
  )

  const pendingCount = useMemo(
    () => state.pending.filter((c) => c.status === 'pending').length,
    [state.pending],
  )

  const setTheme = useCallback((theme: Theme) => dispatch({ type: 'theme', theme }), [])
  const toggleTheme = useCallback(
    () => dispatch({ type: 'theme', theme: state.theme === 'dark' ? 'light' : 'dark' }),
    [state.theme],
  )

  const queueProposals = useCallback((changes: ProposedChange[]) => {
    const built: PendingChange[] = changes.map((change) => {
      seq.current += 1
      return {
        ...change,
        id: `chg-${Date.now().toString(36)}-${seq.current}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
      }
    })
    if (built.length) dispatch({ type: 'queueChanges', changes: built })
    return built.map((c) => c.id)
  }, [])

  const createQuickEvent = useCallback((day: Date, hour: number, minute = 0) => {
    const start = atTime(day, hour, minute)
    const event: CalendarEvent = {
      id: `e-${Date.now().toString(36)}`,
      title: 'New event',
      start: toLocalISO(start),
      end: toLocalISO(addMinutes(start, 60)),
      calendarId: 'work',
      tone: 'blue',
      attendees: [],
    }
    dispatch({ type: 'addEvent', event })
    return event
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => dispatch({ type: 'updateSettings', patch }),
    [],
  )

  const value = useMemo<StoreValue>(
    () => ({
      state,
      dispatch,
      visibleEvents,
      pendingCount,
      setTheme,
      toggleTheme,
      queueProposals,
      createQuickEvent,
      updateSettings,
    }),
    [
      state,
      visibleEvents,
      pendingCount,
      setTheme,
      toggleTheme,
      queueProposals,
      createQuickEvent,
      updateSettings,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
