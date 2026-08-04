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
import { CALENDARS, CONNECTIONS, seedEvents } from './seed-data'
import { addMinutes, atTime, toLocalISO } from './time'
import type {
  CalendarEvent,
  CalendarSource,
  ChatMessage,
  Connection,
  PendingChange,
  ProposedChange,
  Theme,
} from './types'

const STORAGE_KEY = 'timeflow:v1'

type State = {
  events: CalendarEvent[]
  calendars: CalendarSource[]
  connections: Connection[]
  chat: ChatMessage[]
  pending: PendingChange[]
  dismissed: string[]
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
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const seq = useRef(0)

  // hydrate once on the client so SSR markup stays deterministic
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>
        dispatch({ type: 'hydrate', payload: parsed })
        return
      }
    } catch {
      // corrupt payload: fall through to seed
    }
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    dispatch({ type: 'hydrate', payload: { theme: prefersDark ? 'dark' : 'light' } })
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    const { hydrated, ...persisted } = state
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
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
    }),
    [
      state,
      visibleEvents,
      pendingCount,
      setTheme,
      toggleTheme,
      queueProposals,
      createQuickEvent,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
