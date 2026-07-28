alter table public.user_settings
  add column if not exists recurring_default_timezone text not null default 'UTC',
  add column if not exists recurring_default_frequency text not null default 'monthly',
  add column if not exists recurring_default_due_date_offset integer not null default 14,
  add column if not exists recurring_default_invoice_status text not null default 'Draft',
  add column if not exists recurring_default_auto_generation boolean not null default true;

alter table public.recurring_invoices
  add column if not exists auto_generation boolean not null default true,
  add column if not exists invoice_status text not null default 'Draft'
    check (invoice_status in ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "Users can view their notifications" on public.notifications;
create policy "Users can view their notifications" on public.notifications
for select using (auth.uid() = user_id);
drop policy if exists "Users can update their notifications" on public.notifications;
create policy "Users can update their notifications" on public.notifications
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';