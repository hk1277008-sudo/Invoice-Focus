-- Private-beta onboarding progress and product feedback.
-- Safe to run repeatedly.

alter table public.user_settings
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_skipped boolean not null default false,
  add column if not exists onboarding_current_step integer not null default 1,
  add column if not exists onboarding_business_profile jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_first_client jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_first_invoice jsonb not null default '{}'::jsonb;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  rating integer check (rating between 1 and 5),
  category text check (category in ('bug', 'feature_request', 'general_feedback', 'improvement')),
  message text not null,
  screenshot_url text not null default '',
  browser text not null default '',
  device text not null default '',
  screen_size text not null default '',
  current_page text not null default '',
  app_version text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "Users can view their feedback" on public.feedback;
create policy "Users can view their feedback"
on public.feedback for select using (auth.uid() = user_id);

drop policy if exists "Users can create their feedback" on public.feedback;
create policy "Users can create their feedback"
on public.feedback for insert with check (auth.uid() = user_id);

notify pgrst, 'reload schema';