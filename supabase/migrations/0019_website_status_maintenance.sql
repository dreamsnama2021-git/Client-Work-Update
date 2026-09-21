-- "Live" splits into two: whether the site currently has an active
-- maintenance plan or not. Existing "live" rows default to "without
-- maintenance" — admins should double-check and correct if a maintenance
-- plan is actually in place.

alter type public.website_status rename to website_status_old;
create type public.website_status as enum (
  'live_with_maintenance',
  'live_without_maintenance',
  'in_making',
  'maintenance'
);

alter table public.client_services
  alter column site_status type public.website_status
  using (
    case site_status::text
      when 'live' then 'live_without_maintenance'
      when 'in_making' then 'in_making'
      when 'maintenance' then 'maintenance'
      else null
    end
  )::public.website_status;

drop type public.website_status_old;
