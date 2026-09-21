-- Static/reel completion and approval-with are now tracked per calendar
-- month (client_monthly_work) so past months stay visible instead of being
-- overwritten. Targets stay fixed on client_services since they're set once
-- and apply every month; "post" is renamed to "static" to match how content
-- is actually categorized (statics + reels = total posts).

alter table public.client_services rename column post_target to static_target;
alter table public.client_services drop column post_completed;
alter table public.client_services drop column post_approval_with;
alter table public.client_services drop column reel_completed;
alter table public.client_services drop column reel_approval_with;

create table public.client_monthly_work (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month date not null,
  static_completed integer not null default 0,
  static_approval_with public.approval_owner,
  reel_completed integer not null default 0,
  reel_approval_with public.approval_owner,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, month)
);

create index client_monthly_work_client_id_idx on public.client_monthly_work(client_id);
create index client_monthly_work_month_idx on public.client_monthly_work(month);

create trigger set_client_monthly_work_updated_at
  before update on public.client_monthly_work
  for each row
  execute function public.set_updated_at();

alter table public.client_monthly_work enable row level security;

create policy "Admins can view all monthly work"
  on public.client_monthly_work for select
  using (public.is_admin());

create policy "Admins can insert monthly work"
  on public.client_monthly_work for insert
  with check (public.is_admin());

create policy "Admins can update monthly work"
  on public.client_monthly_work for update
  using (public.is_admin());

create policy "Admins can delete monthly work"
  on public.client_monthly_work for delete
  using (public.is_admin());

create policy "Clients can view their own monthly work"
  on public.client_monthly_work for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_monthly_work.client_id
        and c.profile_id = auth.uid()
    )
  );
