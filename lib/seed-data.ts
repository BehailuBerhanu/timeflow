import { atTime, startOfWeek, addDays, toLocalISO } from './time'
import type {
  BookingLink,
  CalendarEvent,
  CalendarSource,
  Connection,
  Person,
  Settings,
  Task,
} from './types'

export const PEOPLE: Person[] = [
  { id: 'you', name: 'Daniel Okafor', avatar: '/avatars/you.png' },
  { id: 'alex', name: 'Alex Rivera', avatar: '/avatars/alex.png' },
  { id: 'sam', name: 'Sam Whitfield', avatar: '/avatars/sam.png' },
  { id: 'priya', name: 'Priya Raman', avatar: '/avatars/priya.png' },
  { id: 'marcus', name: 'Marcus Hale', avatar: '/avatars/marcus.png' },
]

export const personById = (id: string) => PEOPLE.find((p) => p.id === id)

export const CALENDARS: CalendarSource[] = [
  { id: 'work', name: 'Work', tone: 'blue', enabled: true },
  { id: 'personal', name: 'Personal', tone: 'violet', enabled: true },
  { id: 'school', name: 'School', tone: 'green', enabled: true },
  { id: 'fitness', name: 'Fitness', tone: 'red', enabled: true },
]

/**
 * The reference week, anchored to whatever week the user opens the app in so the
 * calendar is never empty. Day indices are Sunday-first.
 */
export function seedEvents(now = new Date()): CalendarEvent[] {
  const week = startOfWeek(now)
  const day = (i: number) => addDays(week, i)
  const slot = (i: number, sh: number, sm: number, eh: number, em: number) => ({
    start: toLocalISO(atTime(day(i), sh, sm)),
    end: toLocalISO(atTime(day(i), eh, em)),
  })

  return [
    {
      id: 'e-team-sync-mon',
      title: 'Team Sync',
      ...slot(1, 9, 0, 10, 0),
      calendarId: 'work',
      tone: 'blue',
      attendees: ['alex', 'sam', 'priya'],
      extraAttendees: 2,
    },
    {
      id: 'e-project-update',
      title: 'Project Update',
      ...slot(1, 11, 0, 12, 0),
      calendarId: 'work',
      tone: 'violet',
      attendees: ['marcus', 'priya'],
      extraAttendees: 2,
    },
    {
      id: 'e-design-review',
      title: 'Design Review',
      ...slot(1, 14, 0, 15, 30),
      calendarId: 'work',
      tone: 'red',
      attendees: ['alex', 'marcus'],
      extraAttendees: 2,
    },
    {
      id: 'e-gym',
      title: 'Gym',
      ...slot(1, 18, 0, 19, 0),
      calendarId: 'fitness',
      tone: 'red',
      attendees: [],
    },
    {
      id: 'e-team-sync-tue',
      title: 'Team Sync',
      ...slot(2, 9, 0, 10, 0),
      calendarId: 'work',
      tone: 'blue',
      attendees: ['alex', 'sam', 'priya'],
      extraAttendees: 2,
    },
    {
      id: 'e-deep-work-tue',
      title: 'Deep Work',
      ...slot(2, 11, 0, 13, 0),
      calendarId: 'school',
      tone: 'green',
      attendees: [],
      focus: true,
      focusProgress: 0.62,
    },
    {
      id: 'e-marketing-sync',
      title: 'Marketing Sync',
      ...slot(3, 14, 0, 15, 0),
      calendarId: 'work',
      tone: 'teal',
      attendees: ['priya'],
      extraAttendees: 2,
    },
    {
      id: 'e-lunch-alex',
      title: 'Lunch with Alex',
      ...slot(4, 12, 30, 13, 30),
      calendarId: 'personal',
      tone: 'amber',
      attendees: ['alex'],
      aiTouched: true,
    },
    {
      id: 'e-deep-work-thu',
      title: 'Deep Work',
      ...slot(4, 14, 0, 16, 0),
      calendarId: 'school',
      tone: 'green',
      attendees: [],
      focus: true,
      focusProgress: 0.45,
      aiTouched: true,
    },
    {
      id: 'e-coffee-sam',
      title: 'Coffee with Sam',
      ...slot(5, 9, 30, 10, 15),
      calendarId: 'personal',
      tone: 'amber',
      attendees: ['sam'],
    },
    {
      id: 'e-client-call',
      title: 'Client Call',
      ...slot(5, 12, 0, 13, 0),
      calendarId: 'work',
      tone: 'violet',
      attendees: ['marcus', 'priya'],
      extraAttendees: 3,
    },
    {
      id: 'e-one-on-one',
      title: '1:1 with Manager',
      ...slot(5, 16, 0, 17, 0),
      calendarId: 'work',
      tone: 'violet',
      attendees: ['marcus'],
    },
  ]
}

const isoDate = (d: Date) => toLocalISO(d).slice(0, 10)

/**
 * Tasks are anchored to the same reference week as the events so the "linked
 * event" relationship is always real rather than a dangling id.
 */
export function seedTasks(now = new Date()): Task[] {
  const week = startOfWeek(now)
  const day = (i: number) => addDays(week, i)
  return [
    {
      id: 't-agenda',
      title: 'Write agenda for Team Sync',
      due: isoDate(day(1)),
      done: true,
      eventId: 'e-team-sync-mon',
      sourceId: 'notion',
      createdAt: toLocalISO(day(0)),
    },
    {
      id: 't-deck',
      title: 'Finish Q3 roadmap deck',
      due: isoDate(day(1)),
      done: false,
      eventId: 'e-project-update',
      sourceId: 'notion',
      createdAt: toLocalISO(day(0)),
    },
    {
      id: 't-review-specs',
      title: 'Review design specs before review',
      due: isoDate(day(1)),
      done: false,
      eventId: 'e-design-review',
      sourceId: 'slack',
      createdAt: toLocalISO(day(1)),
    },
    {
      id: 't-thesis',
      title: 'Draft thesis outline',
      due: isoDate(day(2)),
      done: false,
      eventId: 'e-deep-work-tue',
      sourceId: 'notion',
      createdAt: toLocalISO(day(1)),
    },
    {
      id: 't-book-table',
      title: 'Book a table for lunch with Alex',
      due: isoDate(day(4)),
      done: false,
      eventId: 'e-lunch-alex',
      sourceId: 'gmail',
      createdAt: toLocalISO(day(2)),
    },
    {
      id: 't-client-brief',
      title: 'Send client the pre-call brief',
      due: isoDate(day(5)),
      done: false,
      eventId: 'e-client-call',
      sourceId: 'gmail',
      createdAt: toLocalISO(day(3)),
    },
    {
      id: 't-expenses',
      title: 'Submit expense report',
      due: isoDate(day(5)),
      done: false,
      sourceId: 'gmail',
      createdAt: toLocalISO(day(3)),
    },
  ]
}

export function seedBookingLinks(now = new Date()): BookingLink[] {
  return [
    {
      id: 'bl-intro',
      name: 'Intro call',
      slug: 'intro-30',
      duration: 30,
      availability: { days: [1, 2, 3, 4, 5], from: '10:00', to: '16:00' },
      buffer: 10,
      createdAt: toLocalISO(now),
    },
    {
      id: 'bl-office-hours',
      name: 'Office hours',
      slug: 'office-hours',
      duration: 15,
      availability: { days: [2, 4], from: '15:00', to: '17:00' },
      buffer: 0,
      createdAt: toLocalISO(now),
    },
  ]
}

export const DEFAULT_SETTINGS: Settings = {
  timezone: 'UTC',
  workdayStart: '09:00',
  workdayEnd: '18:00',
  workdays: [1, 2, 3, 4, 5],
  focusBlockMinutes: 120,
  protectFocus: true,
  weekStartsOn: 0,
  notifications: {
    proposals: true,
    dailyDigest: true,
    conflicts: true,
    bookings: false,
  },
}

/** a compact, well-known list — enough to feel real without shipping the full IANA db */
export const TIMEZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Madrid',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Addis_Ababa',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export const CONNECTIONS: Connection[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    group: 'social',
    unlocks: 'Two-way event sync and free/busy lookups.',
    connected: true,
    accent: '#4285f4',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    group: 'social',
    unlocks: 'Turns "let\'s meet next week" threads into draft events.',
    connected: true,
    accent: '#ea4335',
  },
  {
    id: 'slack',
    name: 'Slack',
    group: 'social',
    unlocks: 'Reads standup times and posts your focus status.',
    connected: true,
    accent: '#611f69',
  },
  {
    id: 'x',
    name: 'X',
    group: 'social',
    unlocks: 'Schedules posts around your quiet hours.',
    connected: false,
    accent: '#0f1419',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    group: 'social',
    unlocks: 'Queues content drops into open evening slots.',
    connected: false,
    accent: '#d62976',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    group: 'social',
    unlocks: 'Pulls intro requests into a weekly networking block.',
    connected: false,
    accent: '#0a66c2',
  },
  {
    id: 'notion',
    name: 'Notion',
    group: 'social',
    unlocks: 'Links meeting notes and task due dates to events.',
    connected: true,
    accent: '#111111',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    group: 'ai',
    unlocks: 'Reuses your saved prompts when drafting agendas.',
    connected: true,
    accent: '#10a37f',
  },
  {
    id: 'claude',
    name: 'Claude',
    group: 'ai',
    unlocks: 'Long-context summaries of recurring meeting history.',
    connected: true,
    accent: '#d97757',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    group: 'ai',
    unlocks: 'Cross-checks travel time and location conflicts.',
    connected: false,
    accent: '#4285f4',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    group: 'ai',
    unlocks: 'Researches attendees before external calls.',
    connected: false,
    accent: '#20808d',
  },
]
