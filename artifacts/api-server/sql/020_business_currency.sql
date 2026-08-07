-- Reporting uses one business currency and never adds incompatible amounts.
-- Safe to run repeatedly; existing invoice currencies and payloads are unchanged.
alter table public.user_settings
  add column if not exists business_currency_manual boolean not null default false;

notify pgrst, 'reload schema';