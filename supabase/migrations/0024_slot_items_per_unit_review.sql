-- Move from one link per slot to one link per completed unit, so a client
-- can review (and reject) each individual post/reel instead of the whole
-- batch turning on a single link. A slot with zero items still falls back
-- to the original whole-slot Approve-only flow (client_approved_at on the
-- slot itself), which is how every pre-existing slot was approved before
-- links existed at all.
create table public.client_work_slot_items (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.client_work_slots(id) on delete cascade,
  item_number integer not null,
  content_link text,
  client_approved_at timestamptz,
  client_rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slot_id, item_number),
  check (client_approved_at is null or client_rejected_at is null)
);

create index client_work_slot_items_slot_idx on public.client_work_slot_items(slot_id);

alter table public.client_work_slot_items enable row level security;

create policy "Admins can view all slot items"
  on public.client_work_slot_items for select using (public.is_admin());
create policy "Admins can insert slot items"
  on public.client_work_slot_items for insert with check (public.is_admin());
create policy "Admins can update slot items"
  on public.client_work_slot_items for update using (public.is_admin());
create policy "Admins can delete slot items"
  on public.client_work_slot_items for delete using (public.is_admin());

create policy "Clients can view their own slot items"
  on public.client_work_slot_items for select
  using (
    exists (
      select 1 from public.client_work_slots s
      join public.clients c on c.id = s.client_id
      where s.id = client_work_slot_items.slot_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Clients can approve or reject their own slot items"
  on public.client_work_slot_items for update
  using (
    exists (
      select 1 from public.client_work_slots s
      join public.clients c on c.id = s.client_id
      where s.id = client_work_slot_items.slot_id
        and c.profile_id = auth.uid()
    )
  );

create or replace function public.prevent_slot_item_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.slot_id is distinct from old.slot_id
      or new.item_number is distinct from old.item_number
      or new.content_link is distinct from old.content_link
    then
      raise exception 'Only admins can change this field';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_slot_item_tampering
  before update on public.client_work_slot_items
  for each row
  execute function public.prevent_slot_item_tampering();

create trigger set_client_work_slot_items_updated_at
  before update on public.client_work_slot_items
  for each row
  execute function public.set_updated_at();

-- Carry forward the single link + approval each slot already has as item 1
-- (this covers the Param slot that already used the single-link flow).
insert into public.client_work_slot_items
  (slot_id, item_number, content_link, client_approved_at, client_rejected_at)
select id, 1, content_link, client_approved_at, client_rejected_at
from public.client_work_slots
where content_link is not null;
