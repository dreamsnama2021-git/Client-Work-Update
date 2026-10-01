-- A client can opt into a second way of tracking Static/Reel delivery:
-- "posts" instead of "slots". Slots (the existing template) batch N parallel
-- items under one count. Posts are one deliverable at a time, numbered
-- Post 1, Post 2… — when the client rejects a post's current link, the admin
-- adds a new link (a revision) for that same post rather than a sibling
-- item, and the client reviews the new revision in its place.
create type public.work_display_template as enum ('slots', 'posts');

alter table public.clients
  add column work_display_template public.work_display_template not null default 'slots';

create table public.client_work_posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month date not null,
  content_type public.slot_content_type not null,
  post_number integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, month, content_type, post_number)
);

create index client_work_posts_client_month_idx on public.client_work_posts(client_id, month);

create table public.client_work_post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.client_work_posts(id) on delete cascade,
  revision_number integer not null,
  content_link text not null,
  client_approved_at timestamptz,
  client_rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, revision_number),
  check (client_approved_at is null or client_rejected_at is null)
);

create index client_work_post_revisions_post_idx on public.client_work_post_revisions(post_id);

alter table public.client_work_posts enable row level security;
alter table public.client_work_post_revisions enable row level security;

create policy "Admins can view all posts"
  on public.client_work_posts for select using (public.is_admin());
create policy "Admins can insert posts"
  on public.client_work_posts for insert with check (public.is_admin());
create policy "Admins can update posts"
  on public.client_work_posts for update using (public.is_admin());
create policy "Admins can delete posts"
  on public.client_work_posts for delete using (public.is_admin());

create policy "Clients can view their own posts"
  on public.client_work_posts for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_work_posts.client_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Admins can view all post revisions"
  on public.client_work_post_revisions for select using (public.is_admin());
create policy "Admins can insert post revisions"
  on public.client_work_post_revisions for insert with check (public.is_admin());
create policy "Admins can update post revisions"
  on public.client_work_post_revisions for update using (public.is_admin());
create policy "Admins can delete post revisions"
  on public.client_work_post_revisions for delete using (public.is_admin());

create policy "Clients can view their own post revisions"
  on public.client_work_post_revisions for select
  using (
    exists (
      select 1 from public.client_work_posts p
      join public.clients c on c.id = p.client_id
      where p.id = client_work_post_revisions.post_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Clients can approve or reject their own post revisions"
  on public.client_work_post_revisions for update
  using (
    exists (
      select 1 from public.client_work_posts p
      join public.clients c on c.id = p.client_id
      where p.id = client_work_post_revisions.post_id
        and c.profile_id = auth.uid()
    )
  );

create or replace function public.prevent_post_revision_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.post_id is distinct from old.post_id
      or new.revision_number is distinct from old.revision_number
      or new.content_link is distinct from old.content_link
    then
      raise exception 'Only admins can change this field';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_post_revision_tampering
  before update on public.client_work_post_revisions
  for each row
  execute function public.prevent_post_revision_tampering();

create trigger set_client_work_posts_updated_at
  before update on public.client_work_posts
  for each row
  execute function public.set_updated_at();

create trigger set_client_work_post_revisions_updated_at
  before update on public.client_work_post_revisions
  for each row
  execute function public.set_updated_at();
