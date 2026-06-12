-- ============================================================================
-- Phase 9b v2-G — Add custom_domain column to sites
-- ============================================================================
-- Lets the editor display a single connected domain per site without
-- having to look it up in public.custom_domains. The custom_domains
-- table remains the authority for verification + routing.

alter table public.sites
  add column if not exists custom_domain text;

create index if not exists sites_custom_domain_idx
  on public.sites (custom_domain)
  where custom_domain is not null;
