-- Phase 9: activity timeline + notifications.
-- activity_events is a shared, admin-facing log of what happened across
-- every project. notifications are personal, per-recipient, with a
-- read/unread state — created alongside activity_events whenever the
-- "other side" of an interaction should be told about it (e.g. an admin
-- submits an approval -> the linked client gets a notification; a client
-- responds -> every admin gets one).

create type activity_type as enum (
  'client_created',
  'project_created',
  'task_created',
  'task_completed',
  'approval_requested',
  'approval_approved',
  'revision_requested',
  'message_sent',
  'file_uploaded'
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  type activity_type not null,
  actor_id uuid references public.profiles (id) on delete set null,
  project_id uuid references public.projects (id) on delete cascade,
  message text not null,
  target text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_created_at_idx
  on public.activity_events (created_at desc);

alter table public.activity_events enable row level security;

create policy "Admins can view all activity"
  on public.activity_events for select
  using (public.is_admin());

-- actor_id must be the caller's own id, so no one can log activity under
-- another user's name.
create policy "Users can log their own activity"
  on public.activity_events for insert
  with check (actor_id = auth.uid());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_id_created_at_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "Users can update their own notifications"
  on public.notifications for update
  using (recipient_id = auth.uid());

-- Admins may notify anyone (e.g. a client, on their own projects).
create policy "Admins can create any notification"
  on public.notifications for insert
  with check (public.is_admin());

-- A client may only notify an admin (never another client), so responding
-- to an approval or sending a message can reach the agency team.
create policy "Clients can notify admins"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = recipient_id and p.role = 'admin'
    )
  );
