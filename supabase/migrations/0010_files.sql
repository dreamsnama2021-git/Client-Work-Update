-- Phase 8: file management.
-- Files live in a private Storage bucket, keyed by `{project_id}/{uuid}-{name}`
-- so RLS on storage.objects can check the leading folder segment against the
-- same clients->projects join used everywhere else. Metadata (original name,
-- size, uploader) lives in its own table for listing without hitting Storage.

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  name text not null,
  storage_path text not null unique,
  size_bytes bigint not null,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists files_project_id_created_at_idx
  on public.files (project_id, created_at);

alter table public.files enable row level security;

create policy "Admins can view all files"
  on public.files for select
  using (public.is_admin());

create policy "Admins can insert files"
  on public.files for insert
  with check (public.is_admin());

create policy "Admins can delete files"
  on public.files for delete
  using (public.is_admin());

create policy "Clients can view their project files"
  on public.files for select
  using (
    exists (
      select 1 from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = files.project_id and c.profile_id = auth.uid()
    )
  );

create policy "Clients can upload to their projects"
  on public.files for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = files.project_id and c.profile_id = auth.uid()
    )
  );

create policy "Clients can delete their own uploads"
  on public.files for delete
  using (uploaded_by = auth.uid());

-- Storage bucket + object-level policies
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 26214400)
on conflict (id) do nothing;

create policy "Admins can manage all storage objects"
  on storage.objects for all
  using (bucket_id = 'project-files' and public.is_admin())
  with check (bucket_id = 'project-files' and public.is_admin());

-- `storage.objects.name` must be qualified explicitly inside the EXISTS
-- subquery below — `projects` also has a `name` column, and an unqualified
-- `name` resolves to the closer subquery scope (p.name), not the outer
-- storage.objects row, silently breaking the folder-prefix check.
create policy "Clients can read their project storage objects"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id::text = (storage.foldername(storage.objects.name))[1] and c.profile_id = auth.uid()
    )
  );

create policy "Clients can upload their project storage objects"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id::text = (storage.foldername(storage.objects.name))[1] and c.profile_id = auth.uid()
    )
  );

create policy "Clients can delete their own storage objects"
  on storage.objects for delete
  using (bucket_id = 'project-files' and owner = auth.uid());
