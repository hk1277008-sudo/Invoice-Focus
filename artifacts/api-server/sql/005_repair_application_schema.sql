-- Repairs the pre-subscription InvoiceFocus schema in Supabase.
-- Safe to run more than once: it only creates missing objects or policies.
-- Existing rows are preserved.

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
returns trigger language plpgsql as $$
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
create policy "Users can view their invoices" on public.invoices for select using (auth.uid() = user_id);
drop policy if exists "Users can create their invoices" on public.invoices;
create policy "Users can create their invoices" on public.invoices for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their invoices" on public.invoices;
create policy "Users can update their invoices" on public.invoices for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their invoices" on public.invoices;
create policy "Users can delete their invoices" on public.invoices for delete using (auth.uid() = user_id);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  company_name text not null default '',
  email text not null default '',
  phone text not null default '',
  billing_address text not null default '',
  city text not null default '',
  state text not null default '',
  postal_code text not null default '',
  country text not null default '',
  tax_id text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists clients_user_email_company_unique
on public.clients (user_id, lower(email), lower(company_name))
where email <> '';
create index if not exists clients_user_updated_idx on public.clients (user_id, updated_at desc);
create index if not exists clients_user_name_idx on public.clients (user_id, lower(full_name));

create or replace function public.set_client_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at
before update on public.clients
for each row execute function public.set_client_updated_at();

alter table public.clients enable row level security;
drop policy if exists "Users can view their clients" on public.clients;
create policy "Users can view their clients" on public.clients for select using (auth.uid() = user_id);
drop policy if exists "Users can create their clients" on public.clients;
create policy "Users can create their clients" on public.clients for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their clients" on public.clients;
create policy "Users can update their clients" on public.clients for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their clients" on public.clients;
create policy "Users can delete their clients" on public.clients for delete using (auth.uid() = user_id);

alter table public.invoices add column if not exists client_id uuid;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invoices_client_id_fkey'
      and conrelid = 'public.invoices'::regclass
  ) then
    alter table public.invoices
      add constraint invoices_client_id_fkey
      foreign key (client_id) references public.clients(id) on delete set null;
  end if;
end;
$$;
create index if not exists invoices_user_client_idx on public.invoices (user_id, client_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default '',
  business_logo text not null default '',
  business_email text not null default '',
  business_phone text not null default '',
  website text not null default '',
  tax_id text not null default '',
  registration_number text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  postal_code text not null default '',
  country text not null default '',
  default_currency text not null default 'USD',
  default_language text not null default 'English',
  default_tax_rate numeric(8, 3) not null default 0,
  default_payment_terms text not null default 'Net 30',
  default_due_days integer not null default 30,
  invoice_number_format text not null default 'INV-{number}',
  invoice_prefix text not null default 'INV',
  starting_invoice_number integer not null default 1,
  default_notes text not null default '',
  default_terms text not null default '',
  invoice_sent_emails boolean not null default true,
  payment_reminder_emails boolean not null default true,
  product_updates boolean not null default true,
  security_alerts boolean not null default true,
  marketing_emails boolean not null default false,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_user_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_user_settings_updated_at();

alter table public.user_settings enable row level security;
drop policy if exists "Users can view their settings" on public.user_settings;
create policy "Users can view their settings" on public.user_settings for select using (auth.uid() = user_id);
drop policy if exists "Users can create their settings" on public.user_settings;
create policy "Users can create their settings" on public.user_settings for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their settings" on public.user_settings;
create policy "Users can update their settings" on public.user_settings for update using (auth.uid() = user_id);

-- PostgREST does not automatically see newly-created/repaired tables immediately.
notify pgrst, 'reload schema';