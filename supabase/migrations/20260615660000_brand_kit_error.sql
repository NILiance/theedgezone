-- Track auto-assemble brand kit errors so the talent sees what went
-- wrong instead of a silent failure. selectFinalConcept used to swallow
-- the error via console.error; now it writes it here and the brand-
-- design page renders a banner with a Retry button.
alter table public.brand_designs
  add column if not exists brand_kit_error text;
