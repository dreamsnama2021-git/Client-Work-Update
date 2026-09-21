-- Phase 7: messages + communication
-- Flat, project-scoped thread. Both the admin side and the linked client
-- can read and post; RLS reuses the same clients->projects join pattern as
-- approvals so a client only ever sees their own projects' messages.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_project_id_created_at_idx
  on public.messages (project_id, created_at);

alter table public.messages enable row level security;

create policy "Admins can view all messages"
  on public.messages for select
  using (public.is_admin());

create policy "Admins can send messages"
  on public.messages for insert
  with check (public.is_admin());

create policy "Clients can view their project messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = messages.project_id and c.profile_id = auth.uid()
    )
  );

create policy "Clients can send messages on their projects"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = messages.project_id and c.profile_id = auth.uid()
    )
  );
