create type public.approval_owner as enum ('client', 'team');
create type public.website_status as enum ('live', 'in_making', 'maintenance');

alter table public.client_services
  add column post_target integer,
  add column post_completed integer not null default 0,
  add column post_approval_with public.approval_owner,
  add column reel_target integer,
  add column reel_completed integer not null default 0,
  add column reel_approval_with public.approval_owner,
  add column site_status public.website_status;
