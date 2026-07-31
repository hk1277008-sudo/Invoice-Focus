-- Provider identifiers are idempotency keys. These indexes intentionally fail
-- rather than deleting historical rows if a prior rollout created duplicates;
-- resolve those rows explicitly and rerun this migration.
create unique index if not exists billing_transactions_provider_transaction_uidx
  on public.billing_transactions(provider, provider_transaction_id)
;

create unique index if not exists billing_payment_methods_provider_method_uidx
  on public.billing_payment_methods(provider, provider_payment_method_id)
;

create unique index if not exists billing_history_provider_event_uidx
  on public.billing_history(provider, provider_event_id)
;

notify pgrst, 'reload schema';