create table if not exists public.recurring_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  interval_count integer not null default 1 check (interval_count >= 1 and interval_count <= 365),
  start_date date not null,
  end_date date,
  next_run_date date not null,
  last_generated_at timestamptz,
  timezone text not null default 'UTC',
  due_date_offset integer not null default 14 check (due_date_offset >= 0 and due_date_offset <= 3650),
  auto_invoice_number boolean not null default true,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  template_data jsonb not null default '{}'::jsonb,
  generated_invoice_count integer not null default 0 check (generated_invoice_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date is null or end_date >= start_date),
  check (next_run_date >= start_date)
);

create index if not exists recurring_invoices_user_status_idx
  on public.recurring_invoices (user_id, status);
create index if not exists recurring_invoices_due_idx
  on public.recurring_invoices (status, next_run_date);
create index if not exists recurring_invoices_user_next_idx
  on public.recurring_invoices (user_id, next_run_date);

alter table public.invoices
  add column if not exists recurring_invoice_id uuid references public.recurring_invoices(id) on delete set null;
create index if not exists invoices_recurring_invoice_idx
  on public.invoices (recurring_invoice_id);

create or replace function public.set_recurring_invoice_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists recurring_invoices_updated_at on public.recurring_invoices;
create trigger recurring_invoices_updated_at
before update on public.recurring_invoices
for each row execute function public.set_recurring_invoice_updated_at();

alter table public.recurring_invoices enable row level security;
drop policy if exists "Users can view their recurring invoices" on public.recurring_invoices;
create policy "Users can view their recurring invoices"
on public.recurring_invoices for select using (auth.uid() = user_id);
drop policy if exists "Users can create their recurring invoices" on public.recurring_invoices;
create policy "Users can create their recurring invoices"
on public.recurring_invoices for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their recurring invoices" on public.recurring_invoices;
create policy "Users can update their recurring invoices"
on public.recurring_invoices for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their recurring invoices" on public.recurring_invoices;
create policy "Users can delete their recurring invoices"
on public.recurring_invoices for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';