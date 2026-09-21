-- Ad-hoc work a client asks for outside their regular monthly scope (no
-- fixed target, unlike Static/Reel slots) — tracked per month, same
-- Team/Client dual-approval pattern as client_work_slots.

create table public.client_extra_work (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month date not null,
  description text not null default '',
  sent_to_client_at timestamptz,
  client_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_extra_work_client_month_idx on public.client_extra_work(client_id, month);

create trigger set_client_extra_work_updated_at
  before update on public.client_extra_work
  for each row
  execute function public.set_updated_at();

alter table public.client_extra_work enable row level security;

create policy "Admins can view all extra work"
  on public.client_extra_work for select
  using (public.is_admin());

create policy "Admins can insert extra work"
  on public.client_extra_work for insert
  with check (public.is_admin());

create policy "Admins can update extra work"
  on public.client_extra_work for update
  using (public.is_admin());

create policy "Admins can delete extra work"
  on public.client_extra_work for delete
  using (public.is_admin());

create policy "Clients can view their own extra work"
  on public.client_extra_work for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_extra_work.client_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Clients can approve their own extra work"
  on public.client_extra_work for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_extra_work.client_id
        and c.profile_id = auth.uid()
    )
  );

create or replace function public.prevent_extra_work_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.client_id is distinct from old.client_id
      or new.month is distinct from old.month
      or new.description is distinct from old.description
      or new.sent_to_client_at is distinct from old.sent_to_client_at
    then
      raise exception 'Only admins can change this field';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_extra_work_tampering
  before update on public.client_extra_work
  for each row
  execute function public.prevent_extra_work_tampering();
