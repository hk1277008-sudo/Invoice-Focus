-- Keep the settings API and the settings tabs compatible when earlier
-- migrations were applied incompletely or against an older schema.
alter table public.user_settings
  add column if not exists business_name text not null default '',
  add column if not exists business_logo text not null default '',
  add column if not exists business_email text not null default '',
  add column if not exists business_phone text not null default '',
  add column if not exists website text not null default '',
  add column if not exists tax_id text not null default '',
  add column if not exists registration_number text not null default '',
  add column if not exists address text not null default '',
  add column if not exists city text not null default '',
  add column if not exists state text not null default '',
  add column if not exists postal_code text not null default '',
  add column if not exists country text not null default '',
  add column if not exists default_currency text not null default 'USD',
  add column if not exists default_language text not null default 'English',
  add column if not exists default_tax_rate numeric(8, 3) not null default 0,
  add column if not exists default_payment_terms text not null default 'Net 30',
  add column if not exists default_due_days integer not null default 30,
  add column if not exists invoice_number_format text not null default 'INV-{number}',
  add column if not exists invoice_prefix text not null default 'INV',
  add column if not exists starting_invoice_number integer not null default 1,
  add column if not exists default_notes text not null default '',
  add column if not exists default_terms text not null default '',
  add column if not exists invoice_sent_emails boolean not null default true,
  add column if not exists invoice_viewed_emails boolean not null default true,
  add column if not exists invoice_paid_emails boolean not null default true,
  add column if not exists weekly_summary_emails boolean not null default true,
  add column if not exists payment_reminder_emails boolean not null default true,
  add column if not exists product_updates boolean not null default true,
  add column if not exists security_alerts boolean not null default true,
  add column if not exists marketing_emails boolean not null default false,
  add column if not exists theme text not null default 'system',
  add column if not exists account_timezone text not null default 'UTC',
  add column if not exists account_country text not null default '',
  add column if not exists compact_mode boolean not null default false,
  add column if not exists font_size text not null default 'medium',
  add column if not exists workspace_accent_color text not null default '#2e5bff',
  add column if not exists recurring_default_timezone text not null default 'UTC',
  add column if not exists recurring_default_frequency text not null default 'monthly',
  add column if not exists recurring_default_due_date_offset integer not null default 14,
  add column if not exists recurring_default_invoice_status text not null default 'Draft',
  add column if not exists recurring_default_auto_generation boolean not null default true,
  add column if not exists invoice_presentation jsonb not null default '{
    "template": "modern",
    "primaryColor": "#2e5bff",
    "accentColor": "#13a6a6",
    "font": "Inter",
    "headerLayout": "Split",
    "footerLayout": "Simple",
    "paperSize": "A4",
    "titleStyle": "default"
  }'::jsonb;

alter table public.user_settings
  drop constraint if exists user_settings_theme_check;
alter table public.user_settings
  add constraint user_settings_theme_check check (theme in ('system', 'light', 'dark'));

alter table public.user_settings
  drop constraint if exists user_settings_font_size_check;
alter table public.user_settings
  add constraint user_settings_font_size_check check (font_size in ('small', 'medium', 'large'));

notify pgrst, 'reload schema';