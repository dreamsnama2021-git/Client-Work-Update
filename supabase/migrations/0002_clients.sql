-- Phase 3: client management
-- The CRM record for a client company. Deliberately independent of
-- auth/profiles for now (an admin can log a client before that client has
-- any portal login) — a future phase can add a nullable profile_id to link
-- a client record to an actual portal account.

create extension if not exists pgcrypto;

create type client_status as enum ('active', 'inactive');

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  phone text,
  website text,
  status client_status not null default 'active',
  notes text,
  avatar_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_company_name_idx on public.clients (company_name);

alter table public.clients enable row level security;

-- Only admins manage the client roster in this phase; a later phase can add
-- a policy letting a linked client read their own row.
create policy "Admins can view all clients"
  on public.clients for select
  using (public.is_admin());

create policy "Admins can insert clients"
  on public.clients for insert
  with check (public.is_admin());

create policy "Admins can update clients"
  on public.clients for update
  using (public.is_admin());

create policy "Admins can delete clients"
  on public.clients for delete
  using (public.is_admin());

create trigger set_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();
