-- Provider-neutral billing persistence. Provider adapters own external IDs;
-- subscription entitlements remain server-owned in public.subscriptions.

alter table public.subscriptions
  add column if not exists provider text,
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text;

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_user_id uuid references public.subscriptions(user_id) on delete set null,
  provider text,
  provider_invoice_id text,
  number text,
  status text not null default 'open' check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  amount integer not null default 0 check (amount >= 0),
  currency text not null default 'USD',
  hosted_url text,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_invoice_id uuid references public.billing_invoices(id) on delete set null,
  provider text,
  provider_payment_id text,
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  amount integer not null default 0 check (amount >= 0),
  currency text not null default 'USD',
  failure_code text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text,
  provider_transaction_id text,
  transaction_type text not null check (transaction_type in ('charge', 'refund', 'credit', 'adjustment')),
  status text not null default 'pending',
  amount integer not null default 0,
  currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  status text not null default 'received' check (status in ('received', 'processed', 'failed', 'ignored')),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (provider, provider_event_id)
);

create table if not exists public.billing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  provider text,
  provider_event_id text,
  status text not null default 'processed',
  amount integer,
  currency text default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists billing_invoices_user_idx on public.billing_invoices(user_id, created_at desc);
create index if not exists billing_payments_user_idx on public.billing_payments(user_id, created_at desc);
create index if not exists billing_transactions_user_idx on public.billing_transactions(user_id, created_at desc);
create index if not exists billing_history_user_idx on public.billing_history(user_id, occurred_at desc);
create index if not exists billing_webhook_provider_idx on public.billing_webhook_events(provider, provider_event_id);

alter table public.billing_invoices enable row level security;
alter table public.billing_payments enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.billing_webhook_events enable row level security;
alter table public.billing_history enable row level security;

create policy "Users can view their billing invoices" on public.billing_invoices for select using (auth.uid() = user_id);
create policy "Users can view their billing payments" on public.billing_payments for select using (auth.uid() = user_id);
create policy "Users can view their billing transactions" on public.billing_transactions for select using (auth.uid() = user_id);
create policy "Users can view their billing history" on public.billing_history for select using (auth.uid() = user_id);

revoke all on public.billing_webhook_events from anon, authenticated;
notify pgrst, 'reload schema';