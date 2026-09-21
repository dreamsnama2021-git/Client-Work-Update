-- Phase 4: project management
-- `priority` is deliberately generic (not project_priority) so Phase 5's
-- tasks table can reuse the same enum, matching the shared Priority type
-- already used on the frontend for both projects and tasks.

create type project_status as enum ('on_track', 'at_risk', 'delayed', 'completed');
create type priority as enum ('low', 'medium', 'high', 'urgent');

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  project_type text not null,
  description text,
  status project_status not null default 'on_track',
  priority priority not null default 'medium',
  progress smallint not null default 0 check (progress between 0 and 100),
  deadline date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects (client_id);
create index if not exists projects_status_idx on public.projects (status);

alter table public.projects enable row level security;

create policy "Admins can view all projects"
  on public.projects for select
  using (public.is_admin());

create policy "Admins can insert projects"
  on public.projects for insert
  with check (public.is_admin());

create policy "Admins can update projects"
  on public.projects for update
  using (public.is_admin());

create policy "Admins can delete projects"
  on public.projects for delete
  using (public.is_admin());

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
