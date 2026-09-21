-- Phase 11: close column-level privilege-escalation gaps left open by row-level RLS.
-- RLS policies operate on whole rows; without these triggers, any policy that lets a
-- user update a row they own lets them change EVERY column on that row, including ones
-- that should be admin-only.

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only admins can change role';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Only admins can change email';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_privilege_escalation on public.profiles;
create trigger trg_prevent_profile_privilege_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_profile_privilege_escalation();

create or replace function public.prevent_approval_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.title is distinct from old.title then
      raise exception 'Only admins can change approval title';
    end if;
    if new.description is distinct from old.description then
      raise exception 'Only admins can change approval description';
    end if;
    if new.project_id is distinct from old.project_id then
      raise exception 'Only admins can change approval project';
    end if;
    if new.submitted_by is distinct from old.submitted_by then
      raise exception 'Only admins can change approval submitter';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_approval_tampering on public.approvals;
create trigger trg_prevent_approval_tampering
  before update on public.approvals
  for each row
  execute function public.prevent_approval_tampering();
