-- Autonomous Ops Studio funnel schema
create extension if not exists pgcrypto;

create table if not exists public.funnel_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_page text,
  name text,
  email text,
  company text,
  notes text,
  cta_type text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stripe_checkout_session_id text unique,
  package_slug text not null,
  package_name text not null,
  amount_usd integer not null,
  currency text not null default 'usd',
  customer_email text,
  status text not null default 'created',
  success_url text,
  cancel_url text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_total integer,
  currency text default 'usd',
  customer_email text,
  package_slug text,
  package_name text,
  payment_status text,
  raw_event jsonb not null default '{}'::jsonb
);

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stripe_event_id text unique not null,
  stripe_event_type text not null,
  livemode boolean,
  api_version text,
  payload jsonb not null,
  processed boolean not null default false,
  processing_error text
);

alter table public.funnel_leads enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- public insert for lead capture and checkout creation (minimal surface)
drop policy if exists funnel_leads_insert_anon on public.funnel_leads;
create policy funnel_leads_insert_anon
on public.funnel_leads
for insert
to anon
with check (true);

drop policy if exists checkout_sessions_insert_service on public.checkout_sessions;
create policy checkout_sessions_insert_service
on public.checkout_sessions
for all
to service_role
using (true)
with check (true);

drop policy if exists orders_service_only on public.orders;
create policy orders_service_only
on public.orders
for all
to service_role
using (true)
with check (true);

drop policy if exists webhook_events_service_only on public.stripe_webhook_events;
create policy webhook_events_service_only
on public.stripe_webhook_events
for all
to service_role
using (true)
with check (true);
