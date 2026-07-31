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
  invoice_viewed_emails boolean not null default true,
  invoice_paid_emails boolean not null default true,
  weekly_summary_emails boolean not null default true,
  payment_reminder_emails boolean not null default true,
  product_updates boolean not null default true,
  security_alerts boolean not null default true,
  marketing_emails boolean not null default false,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  account_timezone text not null default 'UTC',
  account_country text not null default '',
  compact_mode boolean not null default false,
  font_size text not null default 'medium' check (font_size in ('small', 'medium', 'large')),
  workspace_accent_color text not null default '#2e5bff',
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