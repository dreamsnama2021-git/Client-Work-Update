-- Phase 7 fix: a client couldn't see who sent a message on their own
-- project, because RLS on `profiles` only allowed viewing your own row or
-- (for admins) everyone's. Scope visibility to exactly what's needed: the
-- sender of a message on a project the client is linked to.

create policy "Clients can view senders of their messages"
  on public.profiles for select
  using (
    exists (
      select 1 from public.messages m
      join public.projects p on p.id = m.project_id
      join public.clients c on c.id = p.client_id
      where m.sender_id = profiles.id and c.profile_id = auth.uid()
    )
  );
