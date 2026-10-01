-- Lets a client leave a free-text change request (plus an optional link,
-- e.g. a marked-up example) on a Reference they've rejected. Multiple notes
-- can pile up across rejection rounds — this is a flat history, not a
-- single mutable field, so nothing is ever overwritten.
create table public.client_reference_notes (
  id uuid primary key default gen_random_uuid(),
  reference_id uuid not null references public.client_references(id) on delete cascade,
  note text not null,
  link text,
  created_at timestamptz not null default now()
);

create index client_reference_notes_reference_idx
  on public.client_reference_notes(reference_id);

alter table public.client_reference_notes enable row level security;

create policy "Admins can view all reference notes"
  on public.client_reference_notes for select using (public.is_admin());
create policy "Admins can delete reference notes"
  on public.client_reference_notes for delete using (public.is_admin());

create policy "Clients can view their own reference notes"
  on public.client_reference_notes for select
  using (
    exists (
      select 1 from public.client_references r
      join public.clients c on c.id = r.client_id
      where r.id = client_reference_notes.reference_id
        and c.profile_id = auth.uid()
    )
  );

-- A note can only be added while the client's own rejection is the current
-- state — prevents notes being attached to a reference they never rejected,
-- or one the admin has already approved/moved past.
create policy "Clients can add notes to their own rejected references"
  on public.client_reference_notes for insert
  with check (
    exists (
      select 1 from public.client_references r
      join public.clients c on c.id = r.client_id
      where r.id = client_reference_notes.reference_id
        and c.profile_id = auth.uid()
        and r.client_rejected_at is not null
    )
  );
