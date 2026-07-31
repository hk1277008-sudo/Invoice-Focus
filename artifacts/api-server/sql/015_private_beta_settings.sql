-- Private-beta preferences used by the account and appearance settings tabs.
-- Safe to run repeatedly; existing settings rows retain their values.
alter table public.user_settings
  add column if not exists invoice_viewed_emails boolean not null default true,
  add column if not exists invoice_paid_emails boolean not null default true,
  add column if not exists weekly_summary_emails boolean not null default true,
  add column if not exists account_timezone text not null default 'UTC',
  add column if not exists account_country text not null default '',
  add column if not exists compact_mode boolean not null default false,
  add column if not exists font_size text not null default 'medium',
  add column if not exists workspace_accent_color text not null default '#2e5bff';

alter table public.user_settings
  drop constraint if exists user_settings_font_size_check;
alter table public.user_settings
  add constraint user_settings_font_size_check
  check (font_size in ('small', 'medium', 'large'));

notify pgrst, 'reload schema';