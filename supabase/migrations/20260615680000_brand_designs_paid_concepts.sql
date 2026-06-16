-- Concept-pack credit tracking. brand_designs ships with N free
-- concepts (max_free_concepts from service_pricing.extras, default 20).
-- Each paid pack the talent purchases bumps paid_concepts_total. The
-- generateConcepts action checks total_concepts < (max_free_concepts +
-- paid_concepts_total) before letting Gemini run — without this gate
-- talents can burn an unlimited number of Gemini calls.
alter table public.brand_designs
  add column if not exists paid_concepts_total integer not null default 0;
