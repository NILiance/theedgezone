-- ============================================================================
-- Bulk enrollment + outreach
-- ============================================================================
-- Admins upload a CSV of prospective talents/brands, optionally fire a
-- templated invitation email through Resend, and track per-recipient
-- delivery status.

create table if not exists public.enrollment_invitations (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  display_name    text,
  sport           text,
  school          text,
  programs        text[] not null default '{}'::text[],
  notes           text,
  status          text not null default 'pending',
  -- pending | queued | sent | opened | failed | converted
  resend_id       text,
  failure_message text,
  enrolled_by     uuid references auth.users(id) on delete set null,
  enrolled_at     timestamptz not null default now(),
  sent_at         timestamptz,
  opened_at       timestamptz,
  converted_user_id uuid references auth.users(id) on delete set null,
  metadata        jsonb not null default '{}'::jsonb,
  unique (email)
);
create index if not exists enrollment_invitations_status_idx
  on public.enrollment_invitations (status, enrolled_at desc);

alter table public.enrollment_invitations enable row level security;
create policy "enrollment_admin_only"
  on public.enrollment_invitations for all
  using (public.is_admin())
  with check (public.is_admin());

-- Single editable template — same idea as branding_settings (one row).
create table if not exists public.enrollment_template (
  id              int primary key default 1,
  subject         text not null default 'You''re invited to Edge Zone',
  body            text not null default '',
  reply_to        text,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users(id) on delete set null,
  check (id = 1)
);

insert into public.enrollment_template (id, subject, body)
values (1,
  'You''re invited to Edge Zone',
  E'Hey {NAME},\n\nWe just set up an Edge Zone profile for you. Click below to claim it and start building your NIL toolkit.\n\n{LOGIN_URL}\n\n— The Edge Zone team'
)
on conflict (id) do nothing;

alter table public.enrollment_template enable row level security;
create policy "enrollment_template_admin_only"
  on public.enrollment_template for all
  using (public.is_admin())
  with check (public.is_admin());
