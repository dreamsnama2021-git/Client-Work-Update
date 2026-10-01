-- Same change-request note feature as References and slot items, now for
-- Posts template revisions: lets a client leave a note (plus an optional
-- link) on a revision they've rejected, visible to the team.
create table public.client_work_post_revision_notes (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.client_work_post_revisions(id) on delete cascade,
  note text not null,
  link text,
  created_at timestamptz not null default now()
);

create index client_work_post_revision_notes_revision_idx
  on public.client_work_post_revision_notes(revision_id);

alter table public.client_work_post_revision_notes enable row level security;

create policy "Admins can view all post revision notes"
  on public.client_work_post_revision_notes for select using (public.is_admin());
create policy "Admins can delete post revision notes"
  on public.client_work_post_revision_notes for delete using (public.is_admin());

create policy "Clients can view their own post revision notes"
  on public.client_work_post_revision_notes for select
  using (
    exists (
      select 1 from public.client_work_post_revisions r
      join public.client_work_posts p on p.id = r.post_id
      join public.clients c on c.id = p.client_id
      where r.id = client_work_post_revision_notes.revision_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Clients can add notes to their own rejected post revisions"
  on public.client_work_post_revision_notes for insert
  with check (
    exists (
      select 1 from public.client_work_post_revisions r
      join public.client_work_posts p on p.id = r.post_id
      join public.clients c on c.id = p.client_id
      where r.id = client_work_post_revision_notes.revision_id
        and c.profile_id = auth.uid()
        and r.client_rejected_at is not null
    )
  );
