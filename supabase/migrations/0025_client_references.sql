-- A free-form list of reference links per client per month — unlike
-- Static/Reel slots there's no count driving how many exist; the admin adds
-- as many as needed, and each one is independently reviewable by the client
-- the moment it has a link (same per-item review as client_work_slot_items).
create table public.client_references (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month date not null,
  content_link text,
  client_approved_at timestamptz,
  client_rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (client_approved_at is null or client_rejected_at is null)
);

create index client_references_client_month_idx on public.client_references(client_id, month);

alter table public.client_references enable row level security;

create policy "Admins can view all references"
  on public.client_references for select using (public.is_admin());
create policy "Admins can insert references"
  on public.client_references for insert with check (public.is_admin());
create policy "Admins can update references"
  on public.client_references for update using (public.is_admin());
create policy "Admins can delete references"
  on public.client_references for delete using (public.is_admin());

create policy "Clients can view their own references"
  on public.client_references for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_references.client_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Clients can approve or reject their own references"
  on public.client_references for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_references.client_id
        and c.profile_id = auth.uid()
    )
  );

create or replace function public.prevent_reference_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.client_id is distinct from old.client_id
      or new.month is distinct from old.month
      or new.content_link is distinct from old.content_link
    then
      raise exception 'Only admins can change this field';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_reference_tampering
  before update on public.client_references
  for each row
  execute function public.prevent_reference_tampering();

create trigger set_client_references_updated_at
  before update on public.client_references
  for each row
  execute function public.set_updated_at();
