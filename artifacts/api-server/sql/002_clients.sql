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
returns trigger
language plpgsql
as $$
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
create policy "Users can view their clients"
on public.clients for select using (auth.uid() = user_id);

drop policy if exists "Users can create their clients" on public.clients;
create policy "Users can create their clients"
on public.clients for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their clients" on public.clients;
create policy "Users can update their clients"
on public.clients for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their clients" on public.clients;
create policy "Users can delete their clients"
on public.clients for delete using (auth.uid() = user_id);

alter table public.invoices add column if not exists client_id uuid references public.clients(id) on delete set null;
create index if not exists invoices_user_client_idx on public.invoices (user_id, client_id);