create type public.service_type as enum (
  'social_media',
  'website',
  'performance_marketing',
  'shoot'
);

create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_type public.service_type not null,
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, service_type)
);

create index client_services_client_id_idx on public.client_services(client_id);

create trigger set_client_services_updated_at
  before update on public.client_services
  for each row
  execute function public.set_updated_at();

alter table public.client_services enable row level security;

create policy "Admins can view all client services"
  on public.client_services for select
  using (public.is_admin());

create policy "Admins can insert client services"
  on public.client_services for insert
  with check (public.is_admin());

create policy "Admins can update client services"
  on public.client_services for update
  using (public.is_admin());

create policy "Admins can delete client services"
  on public.client_services for delete
  using (public.is_admin());

create policy "Clients can view their own services"
  on public.client_services for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_services.client_id
        and c.profile_id = auth.uid()
    )
  );
