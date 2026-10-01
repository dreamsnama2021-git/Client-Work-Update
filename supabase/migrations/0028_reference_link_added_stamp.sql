-- References have no "Team" approval tick like slots do — the admin just
-- pastes a link and it's immediately visible to the client. Stamp when that
-- link was placed so both dashboards can show "Team · <when>", same as the
-- sent_to_client_at stamp on slots. Re-stamped whenever the link changes,
-- same "stamp once, clear on change" rule used for client approval state.
alter table public.client_references
  add column link_added_at timestamptz;
