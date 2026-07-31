-- Settings and provider-neutral billing completion fields.
alter table public.user_settings
  add column if not exists invoice_overdue_emails boolean not null default true,
  add column if not exists beta_announcements boolean not null default true,
  add column if not exists workspace_name text not null default '',
  add column if not exists workspace_logo text not null default '',
  add column if not exists date_format text not null default 'MM/dd/yyyy',
  add column if not exists number_format text not null default '1,234.56',
  add column if not exists password_last_changed_at timestamptz;

alter table public.user_settings
  add column if not exists default_discount_behavior text not null default 'none',
  add column if not exists default_discount_percent numeric(8, 3) not null default 0;

alter table public.user_settings
  drop constraint if exists user_settings_default_discount_behavior_check;
alter table public.user_settings
  add constraint user_settings_default_discount_behavior_check
  check (default_discount_behavior in ('none', 'percentage'));

alter table public.user_settings
  drop constraint if exists user_settings_date_format_check;
alter table public.user_settings
  add constraint user_settings_date_format_check
  check (date_format in ('MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd'));

alter table public.user_settings
  drop constraint if exists user_settings_number_format_check;
alter table public.user_settings
  add constraint user_settings_number_format_check
  check (number_format in ('1,234.56', '1.234,56', '1 234,56'));

create table if not exists public.billing_payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'private_beta',
  provider_payment_method_id text,
  brand text not null,
  last4 text not null check (last4 ~ '^[0-9]{4}$'),
  exp_month integer not null check (exp_month between 1 and 12),
  exp_year integer not null check (exp_year between 2000 and 2200),
  is_default boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists billing_payment_methods_user_idx
  on public.billing_payment_methods(user_id, created_at desc);

alter table public.billing_payment_methods enable row level security;
drop policy if exists "Users can view their payment methods" on public.billing_payment_methods;
create policy "Users can view their payment methods"
  on public.billing_payment_methods for select using (auth.uid() = user_id);

notify pgrst, 'reload schema';