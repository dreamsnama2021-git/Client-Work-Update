-- Projects are removed as a concept. Tasks, Approvals, Messages, and Files
-- now link directly to a Client instead of going through a Project.

-- 1. Add client_id, backfill from the project each row currently belongs
--    to, then make it required.
alter table public.tasks add column client_id uuid references public.clients(id) on delete cascade;
update public.tasks t set client_id = p.client_id from public.projects p where p.id = t.project_id;
alter table public.tasks alter column client_id set not null;

alter table public.approvals add column client_id uuid references public.clients(id) on delete cascade;
update public.approvals a set client_id = p.client_id from public.projects p where p.id = a.project_id;
alter table public.approvals alter column client_id set not null;

alter table public.messages add column client_id uuid references public.clients(id) on delete cascade;
update public.messages m set client_id = p.client_id from public.projects p where p.id = m.project_id;
alter table public.messages alter column client_id set not null;

alter table public.files add column client_id uuid references public.clients(id) on delete cascade;
update public.files f set client_id = p.client_id from public.projects p where p.id = f.project_id;
alter table public.files alter column client_id set not null;

-- 2. Drop the old project_id columns (and every policy that references
--    project_id — including the profiles policy that reaches messages via
--    a project join — which must go first).
drop policy if exists "Clients can view senders of their messages" on public.profiles;

drop policy if exists "Admins can view all tasks" on public.tasks;
drop policy if exists "Admins can insert tasks" on public.tasks;
drop policy if exists "Admins can update tasks" on public.tasks;
drop policy if exists "Admins can delete tasks" on public.tasks;

drop policy if exists "Admins can view all approvals" on public.approvals;
drop policy if exists "Admins can insert approvals" on public.approvals;
drop policy if exists "Admins can update approvals" on public.approvals;
drop policy if exists "Clients can view their approvals" on public.approvals;
drop policy if exists "Clients can respond to their pending approvals" on public.approvals;

drop policy if exists "Admins can view all messages" on public.messages;
drop policy if exists "Admins can send messages" on public.messages;
drop policy if exists "Clients can view their project messages" on public.messages;
drop policy if exists "Clients can send messages on their projects" on public.messages;

drop policy if exists "Admins can view all files" on public.files;
drop policy if exists "Admins can insert files" on public.files;
drop policy if exists "Admins can delete files" on public.files;
drop policy if exists "Clients can view their project files" on public.files;
drop policy if exists "Clients can upload to their projects" on public.files;
drop policy if exists "Clients can delete their own uploads" on public.files;

alter table public.tasks drop column project_id;
alter table public.approvals drop column project_id;
alter table public.messages drop column project_id;
alter table public.files drop column project_id;

-- 3. Recreate RLS directly against client_id (no more project join).
create policy "Admins can view all tasks" on public.tasks for select using (public.is_admin());
create policy "Admins can insert tasks" on public.tasks for insert with check (public.is_admin());
create policy "Admins can update tasks" on public.tasks for update using (public.is_admin());
create policy "Admins can delete tasks" on public.tasks for delete using (public.is_admin());

create policy "Admins can view all approvals" on public.approvals for select using (public.is_admin());
create policy "Admins can insert approvals" on public.approvals for insert with check (public.is_admin());
create policy "Admins can update approvals" on public.approvals for update using (public.is_admin());
create policy "Clients can view their approvals" on public.approvals for select
  using (exists (select 1 from public.clients c where c.id = approvals.client_id and c.profile_id = auth.uid()));
create policy "Clients can respond to their pending approvals" on public.approvals for update
  using (
    status = 'pending'
    and exists (select 1 from public.clients c where c.id = approvals.client_id and c.profile_id = auth.uid())
  )
  with check (exists (select 1 from public.clients c where c.id = approvals.client_id and c.profile_id = auth.uid()));

create policy "Admins can view all messages" on public.messages for select using (public.is_admin());
create policy "Admins can send messages" on public.messages for insert with check (public.is_admin());
create policy "Clients can view their messages" on public.messages for select
  using (exists (select 1 from public.clients c where c.id = messages.client_id and c.profile_id = auth.uid()));
create policy "Clients can send their own messages" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.clients c where c.id = messages.client_id and c.profile_id = auth.uid())
  );

create policy "Admins can view all files" on public.files for select using (public.is_admin());
create policy "Admins can insert files" on public.files for insert with check (public.is_admin());
create policy "Admins can delete files" on public.files for delete using (public.is_admin());
create policy "Clients can view their files" on public.files for select
  using (exists (select 1 from public.clients c where c.id = files.client_id and c.profile_id = auth.uid()));
create policy "Clients can upload their own files" on public.files for insert
  with check (
    uploaded_by = auth.uid()
    and exists (select 1 from public.clients c where c.id = files.client_id and c.profile_id = auth.uid())
  );
create policy "Clients can delete their own uploads" on public.files for delete
  using (uploaded_by = auth.uid());

create policy "Clients can view senders of their messages"
  on public.profiles for select
  using (
    exists (
      select 1 from public.messages m
      join public.clients c on c.id = m.client_id
      where m.sender_id = profiles.id and c.profile_id = auth.uid()
    )
  );

-- 4. Storage: check against the files table (which now carries client_id)
--    for reads, and against the upload folder prefix for new writes — this
--    avoids depending on any folder-naming convention for existing files.
drop policy if exists "Clients can read their project storage objects" on storage.objects;
drop policy if exists "Clients can upload their project storage objects" on storage.objects;

create policy "Clients can read their client's storage objects"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.files f
      join public.clients c on c.id = f.client_id
      where f.storage_path = storage.objects.name
        and c.profile_id = auth.uid()
    )
  );

create policy "Clients can upload to their client folder"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.clients c
      where c.profile_id = auth.uid()
        and c.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

-- 5. activity_events.project_id was never rendered (display uses actor +
--    message + target text only) — drop it rather than migrate it.
alter table public.activity_events drop column if exists project_id;

-- 6. Drop the now-unreferenced projects table and its status enum.
drop table public.projects;
drop type public.project_status;
