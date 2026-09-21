-- Replace the single mutually-exclusive Approval radio with two
-- independent ticks: "Team" (auto-stamped when work is sent to the client)
-- and "Client" (auto-stamped when the client approves it themselves from
-- their own portal). Clients get a narrow UPDATE policy for this, locked
-- down to only the client_approved_at column by a trigger.

alter table public.client_work_slots drop column approval_with;
alter table public.client_work_slots rename column approved_at to client_approved_at;
drop type public.approval_owner;

create policy "Clients can approve their own slots"
  on public.client_work_slots for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_work_slots.client_id
        and c.profile_id = auth.uid()
    )
  );

create or replace function public.prevent_slot_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.client_id is distinct from old.client_id
      or new.month is distinct from old.month
      or new.content_type is distinct from old.content_type
      or new.slot_number is distinct from old.slot_number
      or new.completed_count is distinct from old.completed_count
      or new.ready_at is distinct from old.ready_at
      or new.sent_to_client_at is distinct from old.sent_to_client_at
    then
      raise exception 'Only admins can change this field';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_slot_tampering on public.client_work_slots;
create trigger trg_prevent_slot_tampering
  before update on public.client_work_slots
  for each row
  execute function public.prevent_slot_tampering();
