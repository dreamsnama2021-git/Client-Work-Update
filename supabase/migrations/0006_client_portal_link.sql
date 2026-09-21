-- Phase 6: link a client CRM record to the portal account (profiles row)
-- that logs in as that client, and let that client read their own
-- clients/projects rows.

alter table public.clients
  add column if not exists profile_id uuid references public.profiles (id) on delete set null;

create unique index if not exists clients_profile_id_key on public.clients (profile_id);

create policy "Clients can view own client record"
  on public.clients for select
  using (profile_id = auth.uid());

create policy "Clients can view their projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = projects.client_id and c.profile_id = auth.uid()
    )
  );
