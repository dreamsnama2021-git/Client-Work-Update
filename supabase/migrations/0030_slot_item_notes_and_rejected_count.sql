-- Same change-request note feature as References, now for slot items: lets
-- a client leave a free-text note (plus an optional link) on an item they've
-- rejected, visible to the team on the admin dashboard.
create table public.client_work_slot_item_notes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.client_work_slot_items(id) on delete cascade,
  note text not null,
  link text,
  created_at timestamptz not null default now()
);

create index client_work_slot_item_notes_item_idx
  on public.client_work_slot_item_notes(item_id);

alter table public.client_work_slot_item_notes enable row level security;

create policy "Admins can view all slot item notes"
  on public.client_work_slot_item_notes for select using (public.is_admin());
create policy "Admins can delete slot item notes"
  on public.client_work_slot_item_notes for delete using (public.is_admin());

create policy "Clients can view their own slot item notes"
  on public.client_work_slot_item_notes for select
  using (
    exists (
      select 1 from public.client_work_slot_items i
      join public.client_work_slots s on s.id = i.slot_id
      join public.clients c on c.id = s.client_id
      where i.id = client_work_slot_item_notes.item_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Clients can add notes to their own rejected slot items"
  on public.client_work_slot_item_notes for insert
  with check (
    exists (
      select 1 from public.client_work_slot_items i
      join public.client_work_slots s on s.id = i.slot_id
      join public.clients c on c.id = s.client_id
      where i.id = client_work_slot_item_notes.item_id
        and c.profile_id = auth.uid()
        and i.client_rejected_at is not null
    )
  );
