-- References are now split Static/Reel so each pairs with its own
-- Static/Reel work section (same enum already used by slots/posts).
-- Existing rows default to 'static' — there were 2 pre-existing rows
-- (Param) created before this split; verify/recategorize them if needed.
alter table public.client_references
  add column content_type public.slot_content_type not null default 'static';

create index client_references_client_month_type_idx
  on public.client_references(client_id, month, content_type);

create or replace function public.prevent_reference_tampering()
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
      or new.content_link is distinct from old.content_link
    then
      raise exception 'Only admins can change this field';
    end if;
  end if;
  return new;
end;
$$;
