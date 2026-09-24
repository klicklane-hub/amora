drop policy if exists paystack_webhook_events_no_client_access on public.paystack_webhook_events;
create policy paystack_webhook_events_no_client_access
on public.paystack_webhook_events
for all to authenticated using (false) with check (false);
