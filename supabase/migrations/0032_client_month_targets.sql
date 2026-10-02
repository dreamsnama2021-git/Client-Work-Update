-- Month-specific Static/Reel targets. client_services.static_target/reel_target
-- stay as the baseline; a row here sets the target from that month onward
-- (until a later row overrides it), so past months keep their own numbers
-- when a client's monthly scope changes.
create table public.client_month_targets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month date not null,
  static_target integer,
  reel_target integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, month)
);

alter table public.client_month_targets enable row level security;

create policy "Admins can view all month targets"
  on public.client_month_targets for select using (public.is_admin());
create policy "Admins can insert month targets"
  on public.client_month_targets for insert with check (public.is_admin());
create policy "Admins can update month targets"
  on public.client_month_targets for update using (public.is_admin());
create policy "Admins can delete month targets"
  on public.client_month_targets for delete using (public.is_admin());

create policy "Clients can view their own month targets"
  on public.client_month_targets for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_month_targets.client_id
        and c.profile_id = auth.uid()
    )
  );

create trigger set_client_month_targets_updated_at
  before update on public.client_month_targets
  for each row
  execute function public.set_updated_at();
