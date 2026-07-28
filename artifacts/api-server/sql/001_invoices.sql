create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled')),
  issue_date date not null,
  due_date date,
  client text not null default '',
  company text not null default '',
  total numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, invoice_number)
);

create index if not exists invoices_user_updated_idx on public.invoices (user_id, updated_at desc);
create index if not exists invoices_user_status_idx on public.invoices (user_id, status);
create index if not exists invoices_user_issue_date_idx on public.invoices (user_id, issue_date desc);

create or replace function public.set_invoice_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists invoices_updated_at on public.invoices;
create trigger invoices_updated_at
before update on public.invoices
for each row execute function public.set_invoice_updated_at();

alter table public.invoices enable row level security;

drop policy if exists "Users can view their invoices" on public.invoices;
create policy "Users can view their invoices"
on public.invoices for select using (auth.uid() = user_id);

drop policy if exists "Users can create their invoices" on public.invoices;
create policy "Users can create their invoices"
on public.invoices for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their invoices" on public.invoices;
create policy "Users can update their invoices"
on public.invoices for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their invoices" on public.invoices;
create policy "Users can delete their invoices"
on public.invoices for delete using (auth.uid() = user_id);