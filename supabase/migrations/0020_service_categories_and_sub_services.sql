-- Service catalog restructure: "performance_marketing" is retired,
-- "shoot" becomes "production" (broader scope), and a new "offline"
-- category is added. Each main service now also carries a checklist of
-- specific sub-services (e.g. Website -> Design, SEO, Maintenance...).

-- Drop rows for the retired category before the enum swap.
delete from public.client_services where service_type = 'performance_marketing';

alter type public.service_type rename to service_type_old;
create type public.service_type as enum (
  'social_media',
  'website',
  'production',
  'offline'
);

alter table public.client_services
  alter column service_type type public.service_type
  using (
    case service_type::text
      when 'shoot' then 'production'
      else service_type::text
    end
  )::public.service_type;

drop type public.service_type_old;

create table public.client_service_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_type public.service_type not null,
  item text not null,
  created_at timestamptz not null default now(),
  unique (client_id, service_type, item)
);

create index client_service_items_client_id_idx on public.client_service_items(client_id);

alter table public.client_service_items enable row level security;

create policy "Admins can view all service items"
  on public.client_service_items for select
  using (public.is_admin());

create policy "Admins can insert service items"
  on public.client_service_items for insert
  with check (public.is_admin());

create policy "Admins can delete service items"
  on public.client_service_items for delete
  using (public.is_admin());

create policy "Clients can view their own service items"
  on public.client_service_items for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_service_items.client_id
        and c.profile_id = auth.uid()
    )
  );
