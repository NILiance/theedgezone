-- The brand_design_addons.kind CHECK constraint silently rejected inserts whose
-- kind wasn't in its hardcoded allow-list (e.g. 'brand_voice_lines'), so those
-- creations vanished. Kinds are app-controlled; drop the CHECK so new arsenal
-- item types persist without a schema migration each time.
alter table public.brand_design_addons drop constraint if exists brand_design_addons_kind_check;
