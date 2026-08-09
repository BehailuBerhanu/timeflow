-- user_preferences table for Stage 2: AI onboarding preferences
-- Run this in your Supabase SQL Editor

create table if not exists public.user_preferences (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  calendar_labels jsonb not null default '{}',
  focus_hours     jsonb not null default 'null'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at on every UPDATE
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.update_updated_at_column();

-- RLS: each user can only read/write their own row
alter table public.user_preferences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_preferences' and policyname = 'users_own_preferences'
  ) then
    execute 'create policy "users_own_preferences" on public.user_preferences
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;

-- Grant access to authenticated role
grant usage on schema public to authenticated;
grant all on public.user_preferences to authenticated;
