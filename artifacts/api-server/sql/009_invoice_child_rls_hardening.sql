-- Security hardening: child lifecycle rows must reference an invoice owned
-- by the authenticated user, not merely carry that user's user_id value.

drop policy if exists "Users can view their invoice activity" on public.invoice_activity;
drop policy if exists "Users can create their invoice activity" on public.invoice_activity;
create policy "Users can view owned invoice activity" on public.invoice_activity
for select using (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_activity.invoice_id and i.user_id = auth.uid()
  )
);
create policy "Users can create owned invoice activity" on public.invoice_activity
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_activity.invoice_id and i.user_id = auth.uid()
  )
);

drop policy if exists "Users can view their invoice payments" on public.invoice_payments;
drop policy if exists "Users can create their invoice payments" on public.invoice_payments;
drop policy if exists "Users can update their invoice payments" on public.invoice_payments;
drop policy if exists "Users can delete their invoice payments" on public.invoice_payments;
create policy "Users can view owned invoice payments" on public.invoice_payments
for select using (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_payments.invoice_id and i.user_id = auth.uid()
  )
);
create policy "Users can create owned invoice payments" on public.invoice_payments
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_payments.invoice_id and i.user_id = auth.uid()
  )
);
create policy "Users can update owned invoice payments" on public.invoice_payments
for update using (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_payments.invoice_id and i.user_id = auth.uid()
  )
) with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_payments.invoice_id and i.user_id = auth.uid()
  )
);
create policy "Users can delete owned invoice payments" on public.invoice_payments
for delete using (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_payments.invoice_id and i.user_id = auth.uid()
  )
);

drop policy if exists "Users can view their invoice email events" on public.invoice_email_events;
drop policy if exists "Users can create their invoice email events" on public.invoice_email_events;
create policy "Users can view owned invoice email events" on public.invoice_email_events
for select using (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_email_events.invoice_id and i.user_id = auth.uid()
  )
);
create policy "Users can create owned invoice email events" on public.invoice_email_events
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_email_events.invoice_id and i.user_id = auth.uid()
  )
);

drop policy if exists "Users can view their invoice reminders" on public.invoice_reminders;
drop policy if exists "Users can create their invoice reminders" on public.invoice_reminders;
drop policy if exists "Users can update their invoice reminders" on public.invoice_reminders;
drop policy if exists "Users can delete their invoice reminders" on public.invoice_reminders;
create policy "Users can view owned invoice reminders" on public.invoice_reminders
for select using (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_reminders.invoice_id and i.user_id = auth.uid()
  )
);
create policy "Users can create owned invoice reminders" on public.invoice_reminders
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_reminders.invoice_id and i.user_id = auth.uid()
  )
);
create policy "Users can update owned invoice reminders" on public.invoice_reminders
for update using (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_reminders.invoice_id and i.user_id = auth.uid()
  )
) with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_reminders.invoice_id and i.user_id = auth.uid()
  )
);
create policy "Users can delete owned invoice reminders" on public.invoice_reminders
for delete using (
  auth.uid() = user_id
  and exists (
    select 1 from public.invoices i
    where i.id = invoice_reminders.invoice_id and i.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';