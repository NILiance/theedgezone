-- The original brand_design_addons schema had a CHECK constraint that
-- only allowed 6 fixed `kind` values. The Brand Arsenal generates 20+
-- categories (business_card, social_media, merch_mockup, sport_uniform,
-- virtual_background, phone_wallpaper, story_highlight, letterhead,
-- presentation, thank_you_card, media_kit, icon_generator, game_day,
-- email_signature_image, logo_on_photo, …) — every insert silently
-- failed the check, so generated assets never appeared in Your Creations.
--
-- This migration:
--  1. Drops the restrictive `kind` CHECK so any string is accepted.
--  2. Drops the (brand_design_id, kind) UNIQUE so the talent can generate
--     multiple variants of the same kind (e.g., several social posts).
--  3. Adds owner INSERT / UPDATE / DELETE RLS policies so the regular
--     auth-bound supabase client can write — no service-role required.

alter table public.brand_design_addons
  drop constraint if exists brand_design_addons_kind_check;

alter table public.brand_design_addons
  drop constraint if exists brand_design_addons_brand_design_id_kind_key;

drop policy if exists "brand_design_addons owner insert" on public.brand_design_addons;
create policy "brand_design_addons owner insert"
  on public.brand_design_addons for insert
  to authenticated
  with check (
    exists (
      select 1 from public.brand_designs bd
      where bd.id = brand_design_addons.brand_design_id and bd.user_id = auth.uid()
    )
  );

drop policy if exists "brand_design_addons owner update" on public.brand_design_addons;
create policy "brand_design_addons owner update"
  on public.brand_design_addons for update
  to authenticated
  using (
    exists (
      select 1 from public.brand_designs bd
      where bd.id = brand_design_addons.brand_design_id and bd.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.brand_designs bd
      where bd.id = brand_design_addons.brand_design_id and bd.user_id = auth.uid()
    )
  );

drop policy if exists "brand_design_addons owner delete" on public.brand_design_addons;
create policy "brand_design_addons owner delete"
  on public.brand_design_addons for delete
  to authenticated
  using (
    exists (
      select 1 from public.brand_designs bd
      where bd.id = brand_design_addons.brand_design_id and bd.user_id = auth.uid()
    )
  );
