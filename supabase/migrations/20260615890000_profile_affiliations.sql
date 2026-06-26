-- Talent affiliations imported from NILiance (past teams, collectives, leagues,
-- charities, clubs, sponsors, etc.). Array of { organization, role }.
alter table public.profiles
  add column if not exists affiliations jsonb not null default '[]'::jsonb;
