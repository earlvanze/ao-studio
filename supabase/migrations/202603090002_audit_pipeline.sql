-- Audit pipeline schema (upload + $20 checkout)

create table if not exists public.audit_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  email text not null,
  customer_email text,
  company text,
  notes text,
  file_name text not null,
  file_type text,
  file_size bigint,
  storage_bucket text not null default 'audit_uploads',
  storage_path text not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_usd integer not null default 20,
  currency text not null default 'usd',
  payment_status text,
  status text not null default 'checkout_created',
  delivery_window text not null default '1-2 business days',
  metadata jsonb not null default '{}'::jsonb
);

alter table public.audit_requests enable row level security;

drop policy if exists audit_requests_service_only on public.audit_requests;
create policy audit_requests_service_only
on public.audit_requests
for all
to service_role
using (true)
with check (true);

-- Storage bucket for upload artifacts
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'audit_uploads',
  'audit_uploads',
  false,
  104857600,
  array[
    'text/csv',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.ms-excel',
    'text/plain'
  ]
where not exists (
  select 1 from storage.buckets where id = 'audit_uploads'
);

drop policy if exists audit_uploads_service_insert on storage.objects;
create policy audit_uploads_service_insert
on storage.objects
for insert
to service_role
with check (bucket_id = 'audit_uploads');

drop policy if exists audit_uploads_service_select on storage.objects;
create policy audit_uploads_service_select
on storage.objects
for select
to service_role
using (bucket_id = 'audit_uploads');

drop policy if exists audit_uploads_service_update on storage.objects;
create policy audit_uploads_service_update
on storage.objects
for update
to service_role
using (bucket_id = 'audit_uploads')
with check (bucket_id = 'audit_uploads');

drop policy if exists audit_uploads_service_delete on storage.objects;
create policy audit_uploads_service_delete
on storage.objects
for delete
to service_role
using (bucket_id = 'audit_uploads');