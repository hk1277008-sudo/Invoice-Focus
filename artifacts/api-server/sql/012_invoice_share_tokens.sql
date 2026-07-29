create extension if not exists pgcrypto;

create table if not exists public.invoice_share_tokens (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  enabled boolean not null default true,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  access_count integer not null default 0,
  constraint invoice_share_tokens_access_count_nonnegative check (access_count >= 0)
);

create index if not exists invoice_share_tokens_invoice_idx
  on public.invoice_share_tokens(invoice_id, created_at desc);
create index if not exists invoice_share_tokens_user_idx
  on public.invoice_share_tokens(user_id, created_at desc);
create index if not exists invoice_share_tokens_active_hash_idx
  on public.invoice_share_tokens(token_hash)
  where enabled = true and revoked_at is null;

create or replace function public.record_invoice_share_access(p_token_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.invoice_share_tokens
  set last_accessed_at = now(), access_count = access_count + 1
  where id = p_token_id
    and enabled = true
    and revoked_at is null;
$$;

revoke all on function public.record_invoice_share_access(uuid) from public;
grant execute on function public.record_invoice_share_access(uuid) to service_role;

alter table public.invoice_share_tokens enable row level security;

drop policy if exists "Users can view their invoice share tokens" on public.invoice_share_tokens;
create policy "Users can view their invoice share tokens"
  on public.invoice_share_tokens for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their invoice share tokens" on public.invoice_share_tokens;
create policy "Users can create their invoice share tokens"
  on public.invoice_share_tokens for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their invoice share tokens" on public.invoice_share_tokens;
create policy "Users can update their invoice share tokens"
  on public.invoice_share_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their invoice share tokens" on public.invoice_share_tokens;
create policy "Users can delete their invoice share tokens"
  on public.invoice_share_tokens for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';