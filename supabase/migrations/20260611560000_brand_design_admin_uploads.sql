-- Admin-uploaded artifacts on a brand design — concepts pushed in by the
-- design team, a final-logo upload that bypasses Ideogram, a custom
-- brand-guide PDF, and a free-text notes field for handoffs.
alter table public.brand_designs
  add column if not exists admin_concepts jsonb not null default '[]'::jsonb,
  add column if not exists admin_final_logo_url text,
  add column if not exists admin_brand_guide_url text,
  add column if not exists admin_notes text,
  add column if not exists admin_updated_at timestamptz,
  add column if not exists admin_updated_by uuid references public.profiles(id);
