-- Static/reel completion moves from one aggregate number per month to a log
-- of individual "slots" (batches) per month — each with its own count,
-- approval-with, and a Ready → Sent to client → Approved timeline, matching
-- how content actually moves through review one batch at a time.

create type public.slot_content_type as enum ('static', 'reel');

create table public.client_work_slots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  month date not null,
  content_type public.slot_content_type not null,
  slot_number integer not null,
  completed_count integer not null default 0,
  approval_with public.approval_owner,
  ready_at timestamptz,
  sent_to_client_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, month, content_type, slot_number)
);

create index client_work_slots_client_month_idx on public.client_work_slots(client_id, month);

create trigger set_client_work_slots_updated_at
  before update on public.client_work_slots
  for each row
  execute function public.set_updated_at();

alter table public.client_work_slots enable row level security;

create policy "Admins can view all work slots"
  on public.client_work_slots for select
  using (public.is_admin());

create policy "Admins can insert work slots"
  on public.client_work_slots for insert
  with check (public.is_admin());

create policy "Admins can update work slots"
  on public.client_work_slots for update
  using (public.is_admin());

create policy "Admins can delete work slots"
  on public.client_work_slots for delete
  using (public.is_admin());

create policy "Clients can view their own work slots"
  on public.client_work_slots for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_work_slots.client_id
        and c.profile_id = auth.uid()
    )
  );

-- Carry forward any existing monthly aggregates as each client's first slot.
insert into public.client_work_slots
  (client_id, month, content_type, slot_number, completed_count, approval_with, ready_at)
select client_id, month, 'static'::slot_content_type, 1, static_completed, static_approval_with, created_at
from public.client_monthly_work
where static_completed > 0;

insert into public.client_work_slots
  (client_id, month, content_type, slot_number, completed_count, approval_with, ready_at)
select client_id, month, 'reel'::slot_content_type, 1, reel_completed, reel_approval_with, created_at
from public.client_monthly_work
where reel_completed > 0;

drop table public.client_monthly_work;
