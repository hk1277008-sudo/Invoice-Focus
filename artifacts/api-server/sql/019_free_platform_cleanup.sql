-- InvoiceFocus is now a permanently free product. Remove legacy billing
-- persistence and usage-limit functions from Supabase.
drop function if exists public.reserve_invoice_usage(uuid);
drop function if exists public.release_invoice_usage(uuid);
drop function if exists public.subscription_permissions(text);
drop table if exists public.billing_payment_methods cascade;
drop table if exists public.billing_history cascade;
drop table if exists public.billing_webhook_events cascade;
drop table if exists public.billing_transactions cascade;
drop table if exists public.billing_payments cascade;
drop table if exists public.billing_invoices cascade;
drop table if exists public.subscriptions cascade;
notify pgrst, 'reload schema';