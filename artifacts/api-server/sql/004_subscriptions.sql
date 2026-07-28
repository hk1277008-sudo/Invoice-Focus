create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'cancelled', 'incomplete')),
  started_at timestamptz not null default timezone('utc', now()),
  renewal_date timestamptz,
  invoice_count_this_month integer not null default 0 check (invoice_count_this_month >= 0),
  last_reset_date date not null default (timezone('utc', now()))::date,
  feature_permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists subscriptions_plan_idx on public.subscriptions (plan);
create index if not exists subscriptions_renewal_idx on public.subscriptions (renewal_date);

create or replace function public.subscription_permissions(subscription_plan text)
returns jsonb language sql immutable as $$
  select case subscription_plan
    when 'pro' then '{
      "unlimitedInvoices": true, "unlimitedClients": true, "recurringInvoices": true,
      "advancedTemplates": true, "invoiceStatusTracking": true, "paymentReminders": true,
      "businessInsights": true, "dataExport": true, "multipleBusinesses": false,
      "teamCollaboration": false, "rolesPermissions": false, "advancedAnalytics": false,
      "apiAccess": false, "integrations": false, "auditLogs": false,
      "earlyAccess": false
    }'::jsonb
    when 'premium' then '{
      "unlimitedInvoices": true, "unlimitedClients": true, "recurringInvoices": true,
      "advancedTemplates": true, "invoiceStatusTracking": true, "paymentReminders": true,
      "businessInsights": true, "dataExport": true, "multipleBusinesses": true,
      "teamCollaboration": true, "rolesPermissions": true, "advancedAnalytics": true,
      "apiAccess": true, "integrations": true, "auditLogs": true,
      "earlyAccess": true
    }'::jsonb
    else '{
      "unlimitedInvoices": false, "unlimitedClients": false, "recurringInvoices": false,
      "advancedTemplates": false, "invoiceStatusTracking": false, "paymentReminders": false,
      "businessInsights": false, "dataExport": false, "multipleBusinesses": false,
      "teamCollaboration": false, "rolesPermissions": false, "advancedAnalytics": false,
      "apiAccess": false, "integrations": false, "auditLogs": false,
      "earlyAccess": false
    }'::jsonb
  end;
$$;

create or replace function public.reserve_invoice_usage(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_subscription public.subscriptions;
  current_month date := (timezone('utc', now()))::date;
  next_count integer;
  max_invoices integer := 15;
begin
  insert into public.subscriptions (user_id, feature_permissions)
  values (p_user_id, public.subscription_permissions('free'))
  on conflict (user_id) do nothing;

  select * into current_subscription
  from public.subscriptions
  where user_id = p_user_id
  for update;

  if current_subscription.last_reset_date < date_trunc('month', current_month)::date then
    update public.subscriptions
    set invoice_count_this_month = 0,
        last_reset_date = current_month,
        updated_at = timezone('utc', now())
    where user_id = p_user_id
    returning * into current_subscription;
  end if;

  if current_subscription.plan = 'free' then
    if current_subscription.invoice_count_this_month >= max_invoices then
      return jsonb_build_object(
        'allowed', false, 'plan', current_subscription.plan,
        'used', current_subscription.invoice_count_this_month, 'limit', max_invoices,
        'remaining', 0
      );
    end if;
    next_count := current_subscription.invoice_count_this_month + 1;
    update public.subscriptions
    set invoice_count_this_month = next_count, updated_at = timezone('utc', now())
    where user_id = p_user_id;
  else
    next_count := current_subscription.invoice_count_this_month + 1;
    update public.subscriptions
    set invoice_count_this_month = next_count, updated_at = timezone('utc', now())
    where user_id = p_user_id;
  end if;

  return jsonb_build_object(
    'allowed', true, 'plan', current_subscription.plan,
    'used', next_count, 'limit', case when current_subscription.plan = 'free' then max_invoices else null end,
    'remaining', case when current_subscription.plan = 'free' then greatest(max_invoices - next_count, 0) else null end
  );
end;
$$;

create or replace function public.release_invoice_usage(p_user_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.subscriptions
  set invoice_count_this_month = greatest(invoice_count_this_month - 1, 0),
      updated_at = timezone('utc', now())
  where user_id = p_user_id;
$$;

revoke all on function public.reserve_invoice_usage(uuid) from public, anon, authenticated;
revoke all on function public.release_invoice_usage(uuid) from public, anon, authenticated;
grant execute on function public.reserve_invoice_usage(uuid) to service_role;
grant execute on function public.release_invoice_usage(uuid) to service_role;

alter table public.subscriptions enable row level security;
drop policy if exists "Users can view their subscription" on public.subscriptions;
create policy "Users can view their subscription" on public.subscriptions for select using (auth.uid() = user_id);