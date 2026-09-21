-- Phase 5: task management
-- `priority` reuses the enum created for projects in 0003. Assignee is a
-- plain text field for now (no team/staff table exists yet — Team is still
-- a placeholder page) rather than a half-built FK to nowhere.

create type task_status as enum ('todo', 'in_progress', 'in_review', 'done');

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text,
  assignee_name text not null,
  status task_status not null default 'todo',
  priority priority not null default 'medium',
  due_date date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_status_idx on public.tasks (status);

alter table public.tasks enable row level security;

create policy "Admins can view all tasks"
  on public.tasks for select
  using (public.is_admin());

create policy "Admins can insert tasks"
  on public.tasks for insert
  with check (public.is_admin());

create policy "Admins can update tasks"
  on public.tasks for update
  using (public.is_admin());

create policy "Admins can delete tasks"
  on public.tasks for delete
  using (public.is_admin());

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
