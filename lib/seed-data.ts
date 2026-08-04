import { atTime, startOfWeek, addDays, toLocalISO } from './time'
import type { CalendarEvent, CalendarSource, Connection, Person } from './types'

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

import type { BookingLink, Task } from './types'

// ─── Tasks seed ───────────────────────────────────────────────────────────────

export function seedTasks(now = new Date()): Task[] {
  const week = startOfWeek(now)
  const dateStr = (offset: number) => {
    const d = addDays(week, offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return [
    {
      id: 't-1',
      title: 'Finalize Q3 project proposal',
      dueDate: dateStr(1),
      done: false,
      priority: 'high',
      linkedEventId: 'e-project-update',
      calendarId: 'work',
    },
    {
      id: 't-2',
      title: 'Review design mockups before meeting',
      dueDate: dateStr(1),
      done: true,
      priority: 'high',
      linkedEventId: 'e-design-review',
      calendarId: 'work',
    },
    {
      id: 't-3',
      title: 'Send weekly status update to team',
      dueDate: dateStr(2),
      done: false,
      priority: 'medium',
      calendarId: 'work',
    },
    {
      id: 't-4',
      title: 'Read chapter 4 of "Deep Work"',
      dueDate: dateStr(2),
      done: false,
      priority: 'low',
      linkedEventId: 'e-deep-work-tue',
      calendarId: 'school',
    },
    {
      id: 't-5',
      title: 'Book restaurant for lunch with Alex',
      dueDate: dateStr(4),
      done: false,
      priority: 'medium',
      linkedEventId: 'e-lunch-alex',
      calendarId: 'personal',
    },
    {
      id: 't-6',
      title: 'Prepare 1:1 talking points',
      dueDate: dateStr(5),
      done: false,
      priority: 'high',
      linkedEventId: 'e-one-on-one',
      calendarId: 'work',
    },
    {
      id: 't-7',
      title: 'Submit client deliverables',
      dueDate: dateStr(5),
      done: false,
      priority: 'high',
      linkedEventId: 'e-client-call',
      calendarId: 'work',
    },
    {
      id: 't-8',
      title: 'Gym — track workout notes',
      dueDate: dateStr(1),
      done: true,
      priority: 'low',
      linkedEventId: 'e-gym',
      calendarId: 'fitness',
    },
  ]
}

// ─── Bookings seed ────────────────────────────────────────────────────────────

export const BOOKING_LINKS: BookingLink[] = [
  {
    id: 'bl-intro',
    title: '30-min Intro Call',
    slug: 'daniel/intro',
    durationMinutes: 30,
    active: true,
    availability: [
      { day: 1, startHour: 9, endHour: 12 },
      { day: 2, startHour: 9, endHour: 12 },
      { day: 3, startHour: 14, endHour: 17 },
      { day: 4, startHour: 9, endHour: 12 },
      { day: 5, startHour: 10, endHour: 13 },
    ],
  },
  {
    id: 'bl-deep',
    title: '60-min Deep Dive',
    slug: 'daniel/deep-dive',
    durationMinutes: 60,
    active: true,
    availability: [
      { day: 2, startHour: 14, endHour: 17 },
      { day: 4, startHour: 14, endHour: 17 },
    ],
  },
  {
    id: 'bl-quick',
    title: '15-min Quick Sync',
    slug: 'daniel/quick-sync',
    durationMinutes: 15,
    active: false,
    availability: [
      { day: 1, startHour: 13, endHour: 15 },
      { day: 3, startHour: 13, endHour: 15 },
      { day: 5, startHour: 13, endHour: 15 },
    ],
  },
]
