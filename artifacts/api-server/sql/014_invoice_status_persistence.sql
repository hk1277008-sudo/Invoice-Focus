-- Keep invoice lifecycle values and owner checks aligned with the API.
-- Safe to run repeatedly; existing invoice rows are preserved.

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.invoices'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.invoices drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.invoices
  add constraint invoices_status_check
  check (status in ('Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'));

alter table public.invoices enable row level security;
drop policy if exists "Users can update their invoices" on public.invoices;
create policy "Users can update their invoices" on public.invoices
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';