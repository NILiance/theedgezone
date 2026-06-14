-- HeyGen job tracking on climb milestones.
alter table public.climb_milestones
  add column if not exists heygen_job_id text,
  add column if not exists heygen_status text,
  add column if not exists heygen_prompt text,
  add column if not exists heygen_voice_id text,
  add column if not exists heygen_avatar_id text,
  add column if not exists heygen_started_at timestamptz,
  add column if not exists heygen_completed_at timestamptz,
  add column if not exists heygen_error text;

create index if not exists climb_heygen_job_idx on public.climb_milestones (heygen_job_id);
