-- Admin attaches a link to the actual static post / reel once it's ready.
-- Once a slot has a link, the client can Approve or Reject it from their
-- portal (previously they could only Approve, with no link to review).
alter table public.client_work_slots
  add column content_link text,
  add column client_rejected_at timestamptz;

alter table public.client_work_slots
  add constraint client_work_slots_approval_state_check
  check (client_approved_at is null or client_rejected_at is null);

-- content_link joins the admin-only column list; client_rejected_at is left
-- out on purpose so the client's own "Clients can approve their own slots"
-- update policy can set it, the same way client_approved_at already works.
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
      or new.content_link is distinct from old.content_link
    then
      raise exception 'Only admins can change this field';
    end if;
  end if;
  return new;
end;
$$;
