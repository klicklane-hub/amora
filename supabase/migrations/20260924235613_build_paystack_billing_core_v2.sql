create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  subscription_type text not null check (subscription_type in ('regular_access','premium_profile')),
  name text not null,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  amount_minor integer not null check (amount_minor > 0),
  interval text not null default 'monthly' check (interval = 'monthly'),
  paystack_plan_code text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_type)
);

insert into public.billing_plans (subscription_type,name,currency,amount_minor,interval)
values
  ('regular_access','AMORA Regular Access','USD',999,'monthly'),
  ('premium_profile','AMORA Premium Profile','USD',1999,'monthly')
on conflict (subscription_type) do update
set name=excluded.name,currency=excluded.currency,amount_minor=excluded.amount_minor,interval=excluded.interval,updated_at=now();

alter table public.payment_transactions
  add column if not exists billing_plan_id uuid references public.billing_plans(id),
  add column if not exists authorization_url text,
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists verified_at timestamptz;

create unique index if not exists payment_transactions_provider_reference_uidx
on public.payment_transactions(provider, provider_reference)
where provider_reference is not null;

create index if not exists payment_transactions_provider_subscription_idx
on public.payment_transactions(provider_subscription_id)
where provider_subscription_id is not null;

create table if not exists public.paystack_webhook_events (
  id uuid primary key default gen_random_uuid(),
  payload_hash text not null unique,
  event_type text not null,
  provider_event_id text,
  provider_resource_id text,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.billing_plans enable row level security;
alter table public.paystack_webhook_events enable row level security;

revoke all on public.billing_plans from anon, authenticated;
revoke all on public.paystack_webhook_events from anon, authenticated;
grant select on public.billing_plans to authenticated;

drop policy if exists billing_plans_select_active on public.billing_plans;
create policy billing_plans_select_active on public.billing_plans for select to authenticated using (active = true);

create or replace function private.touch_billing_updated_at()
returns trigger language plpgsql set search_path=''
as $$
begin new.updated_at=now(); return new; end;
$$;

drop trigger if exists billing_plans_updated_at on public.billing_plans;
create trigger billing_plans_updated_at before update on public.billing_plans
for each row execute function private.touch_billing_updated_at();
