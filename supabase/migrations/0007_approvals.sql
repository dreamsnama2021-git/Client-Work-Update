-- Phase 6: client approval + revision requests.
-- An admin submits a deliverable for a client to sign off on. The linked
-- client (via clients.profile_id) can approve it or send it back with
-- feedback; approvals are never deleted, only resubmitted, so the history
-- stays intact.

create type approval_status as enum ('pending', 'approved', 'revision_requested');

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  status approval_status not null default 'pending',
  feedback text,
  submitted_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists approvals_project_id_idx on public.approvals (project_id);
create index if not exists approvals_status_idx on public.approvals (status);

alter table public.approvals enable row level security;

create policy "Admins can view all approvals"
  on public.approvals for select
  using (public.is_admin());

create policy "Admins can insert approvals"
  on public.approvals for insert
  with check (public.is_admin());

create policy "Admins can update approvals"
  on public.approvals for update
  using (public.is_admin());

create policy "Clients can view their approvals"
  on public.approvals for select
  using (
    exists (
      select 1 from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = approvals.project_id and c.profile_id = auth.uid()
    )
  );

create policy "Clients can respond to their pending approvals"
  on public.approvals for update
  using (
    status = 'pending'
    and exists (
      select 1 from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = approvals.project_id and c.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = approvals.project_id and c.profile_id = auth.uid()
    )
  );

create trigger set_approvals_updated_at
  before update on public.approvals
  for each row execute function public.set_updated_at();
