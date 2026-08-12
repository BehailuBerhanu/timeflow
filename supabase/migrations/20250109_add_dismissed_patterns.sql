-- dismissed_patterns table for Stage 3: rejection feedback loop
-- Run this in your Supabase SQL Editor

create table if not exists public.dismissed_patterns (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  event_title_pattern text not null,
  dismissed_at        timestamptz not null default now()
);

-- Index for efficient 14-day window queries
create index if not exists idx_dismissed_patterns_user_time
  on public.dismissed_patterns (user_id, dismissed_at);

-- RLS: each user can only read/write their own rows
alter table public.dismissed_patterns enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'dismissed_patterns' and policyname = 'users_own_dismissed_patterns'
  ) then
    execute 'create policy "users_own_dismissed_patterns" on public.dismissed_patterns
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;

grant all on public.dismissed_patterns to authenticated;
