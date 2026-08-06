-- AI suggestions table
-- Run this in your Supabase SQL editor or via the Supabase CLI

create table if not exists public.suggestions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_id    text not null,        -- Google Calendar event ID
  status      text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  title       text not null,        -- e.g. "Protect Deep Work Block"
  reason      text not null,        -- one-sentence rationale from Gemini
  current_json  jsonb not null,     -- { date, start_time, end_time, calendar }
  proposed_json jsonb not null,     -- { date, start_time, end_time, calendar }
  created_at  timestamptz not null default now()
);

-- Index for the "suggestions for today" rate-limit query
create index if not exists suggestions_user_created
  on public.suggestions (user_id, created_at desc);

-- Index so we can quickly skip rejected event_ids
create index if not exists suggestions_user_event
  on public.suggestions (user_id, event_id);

-- Row Level Security: users can only see their own suggestions
alter table public.suggestions enable row level security;

create policy "Users can read own suggestions"
  on public.suggestions for select
  using (auth.uid() = user_id);

create policy "Users can insert own suggestions"
  on public.suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own suggestions"
  on public.suggestions for update
  using (auth.uid() = user_id);
