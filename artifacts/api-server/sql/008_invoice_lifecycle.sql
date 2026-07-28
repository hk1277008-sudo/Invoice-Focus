-- Sprint 7: invoice lifecycle, payment history, delivery, reminders, and activity.
alter table public.invoices
  drop constraint if exists invoices_status_check;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.invoices'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.invoices drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.invoices
  add constraint invoices_status_check
  check (status in ('Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'));

alter table public.invoices
  add column if not exists amount_paid numeric(14, 2) not null default 0 check (amount_paid >= 0),
  add column if not exists sent_at timestamptz,
  add column if not exists viewed_at timestamptz,
  add column if not exists last_viewed_at timestamptz;

create index if not exists invoices_user_lifecycle_idx
  on public.invoices (user_id, status, due_date);

create table if not exists public.invoice_activity (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in (
    'created', 'edited', 'sent', 'reminder_sent', 'viewed',
    'payment_recorded', 'marked_paid', 'marked_partially_paid', 'marked_cancelled'
  )),
  description text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists invoice_activity_invoice_created_idx
  on public.invoice_activity (invoice_id, created_at desc);
create index if not exists invoice_activity_user_created_idx
  on public.invoice_activity (user_id, created_at desc);

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  payment_date date not null,
  payment_method text not null default 'Other',
  reference_number text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists invoice_payments_invoice_date_idx
  on public.invoice_payments (invoice_id, payment_date desc);
create index if not exists invoice_payments_user_created_idx
  on public.invoice_payments (user_id, created_at desc);

create table if not exists public.invoice_email_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('sent', 'delivered', 'opened', 'failed')),
  recipient_email text not null,
  subject text not null default '',
  personal_message text not null default '',
  provider_message_id text,
  occurred_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists invoice_email_events_invoice_occurred_idx
  on public.invoice_email_events (invoice_id, occurred_at desc);
create index if not exists invoice_email_events_user_occurred_idx
  on public.invoice_email_events (user_id, occurred_at desc);

create table if not exists public.invoice_reminders (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('before_3_days', 'before_1_day', 'due_date', 'overdue_3_days', 'overdue_7_days', 'manual')),
  enabled boolean not null default true,
  scheduled_for date,
  sent_at timestamptz,
  recipient_email text not null,
  subject text not null default '',
  personal_message text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists invoice_reminders_due_idx
  on public.invoice_reminders (enabled, scheduled_for);
create index if not exists invoice_reminders_invoice_idx
  on public.invoice_reminders (invoice_id, created_at desc);

create or replace function public.set_invoice_child_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists invoice_payments_updated_at on public.invoice_payments;
create trigger invoice_payments_updated_at before update on public.invoice_payments
for each row execute function public.set_invoice_child_updated_at();

drop trigger if exists invoice_reminders_updated_at on public.invoice_reminders;
create trigger invoice_reminders_updated_at before update on public.invoice_reminders
for each row execute function public.set_invoice_child_updated_at();

alter table public.invoice_activity enable row level security;
alter table public.invoice_payments enable row level security;
alter table public.invoice_email_events enable row level security;
alter table public.invoice_reminders enable row level security;

drop policy if exists "Users can view their invoice activity" on public.invoice_activity;
create policy "Users can view their invoice activity" on public.invoice_activity
for select using (auth.uid() = user_id);
drop policy if exists "Users can create their invoice activity" on public.invoice_activity;
create policy "Users can create their invoice activity" on public.invoice_activity
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can view their invoice payments" on public.invoice_payments;
create policy "Users can view their invoice payments" on public.invoice_payments
for select using (auth.uid() = user_id);
drop policy if exists "Users can create their invoice payments" on public.invoice_payments;
create policy "Users can create their invoice payments" on public.invoice_payments
for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their invoice payments" on public.invoice_payments;
create policy "Users can update their invoice payments" on public.invoice_payments
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their invoice payments" on public.invoice_payments;
create policy "Users can delete their invoice payments" on public.invoice_payments
for delete using (auth.uid() = user_id);

drop policy if exists "Users can view their invoice email events" on public.invoice_email_events;
create policy "Users can view their invoice email events" on public.invoice_email_events
for select using (auth.uid() = user_id);
drop policy if exists "Users can create their invoice email events" on public.invoice_email_events;
create policy "Users can create their invoice email events" on public.invoice_email_events
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can view their invoice reminders" on public.invoice_reminders;
create policy "Users can view their invoice reminders" on public.invoice_reminders
for select using (auth.uid() = user_id);
drop policy if exists "Users can create their invoice reminders" on public.invoice_reminders;
create policy "Users can create their invoice reminders" on public.invoice_reminders
for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their invoice reminders" on public.invoice_reminders;
create policy "Users can update their invoice reminders" on public.invoice_reminders
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their invoice reminders" on public.invoice_reminders;
create policy "Users can delete their invoice reminders" on public.invoice_reminders
for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';