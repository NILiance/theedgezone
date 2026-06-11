# Replication Plan

Based on the capture walkthrough on 2026-06-11 (see [CAPTURES.md](CAPTURES.md)) plus the legacy PHP modules in `C:\wp-content\snippet-code\edgezone\`. This is what "exact replication" maps to in Next.js + Supabase.

## Phase summary

| # | Phase | Scope | Est. |
|---|---|---|---|
| 1 | Catalog corrections | Update brand color #C8A84E, add 5 missing guided paths, 3 missing H&W services, 16 brand services, fix prices, sync service slugs | 1-2 days |
| 2 | Service detail pages | One template, 53 service slugs from the legacy `Pages` admin | 4-5 days |
| 3 | Authed shell + role-based nav | Talent dashboard (NILiance banner, NIL Readiness score, profile %, dashboard tabs, My Products grid), role-aware menus, user_type field (talent/brand) | 1-2 weeks |
| 4 | Profile (multi-tab form) | BASICS / ATHLETIC / BRAND / STORY / SOCIAL / CONTACTS / GOALS — each with completion %, NILiance sync hooks | 1 week |
| 5 | Admin shell (22 sub-tabs) | Route + stub layout for all admin sections, fleshed out as their modules land | 1-2 weeks |
| 6 | Marketplace (catalog + checkout + orders) | Stripe wire-up, provisioning queue, CRM sync hooks | 3-4 weeks |
| 7 | NILiance / Sharetribe bridge | Auto-account creation on signup, profile sync (105+ fields), opportunities feed, talent directory sync | 3-4 weeks |
| 8 | Brand Design Studio | Ideogram integration, multi-round concepts (R1/R2/R3), asset/logo credits, build kit, regenerate, reset, brand kit assembly to Google Drive | 4-6 weeks |
| 9 | Site Builder | 40+ content blocks, drag-and-drop editor, multi-page, custom domains via Namecheap + cPanel subdomains, fan support, merch, rewards, polls, blog | 6-8 weeks |
| 10 | EPK Editor | Smart-generated EPK pages, media gallery, sponsor showcase, subdomain on talentepk.com | 3-4 weeks |
| 11 | App Builder | Visual editor with phone-frame preview, 5-7 screens per app, ads (4 placement types), merch integration, push tokens | 4-6 weeks |
| 12 | Podcast Studio | RSS, episodes, distribution (Apple/Spotify), dynamic ad insertion (Megaphone/Art19 stubs), transcripts (Whisper/Gemini/Deepgram stubs) | 3-4 weeks |
| 13 | NIL Stores | POD storefronts, supplier APIs (OneSource/PromoStandards), approved products, fulfillment config, talent commission % | 3-4 weeks |
| 14 | Climb (Path-to-Summit) | Public climb experience, HeyGen narrator videos, hero image chain (OpenAI → Replicate → Unsplash), platform reel, analytics | 2-3 weeks |
| 15 | Roadmap Builder + personalized roadmap | Goal-to-items config, user roadmap rendering, integration with profile goals | 1-2 weeks |
| 16 | Resources Library | WPDM-equivalent (or import from WP via API), audience filters, manual resources | 1 week |
| 17 | Rewards Store + Points | Items, redemptions, points ledger | 1 week |
| 18 | Tickets / Support | Create, assign, status, in-thread messaging, email notifications via Resend | 1-2 weeks |
| 19 | Talent Payouts | Stripe Connect, 15% platform fee, payout schedule, revenue reports, CSV export | 2-3 weeks |
| 20 | Bulk enrollment + outreach email | CSV upload, sport/school/programs assignment, email template variables, Resend send | 1 week |
| 21 | Brand-side dashboard | Talent search, post opportunity, manage campaigns, analytics | 2-3 weeks |
| 22 | Cutover | Data migration from `wp_options` blobs, user migration with password reset, DNS swap, parallel-run + sunset | 4-6 weeks |

**Total**: 7-9 months solo full-time. (Matches the original estimate.)

## Architectural decisions captured from walkthrough

1. **Service catalog**: 53 services (37 talent, 22 brand, 7 employee-benefit subset). Each has a stable slug → Pages admin shows this is the source of truth for URLs.
2. **Routing pattern**: legacy uses `?ez_view=<view>[&tab=...]`. New app uses clean Next.js paths.
3. **Pricing model**: every service has monthly / yearly / one-time tiers. Optional `+ Tiers` for Basic/Pro/Premium bundles. Stored per-service in DB (not env / config).
4. **Brand Design pricing**: separate pricing block (asset credits, revision price, custom graphic price, logo modification, additional logo, concept logo, extra concept batch).
5. **Roles + capabilities**: 9 talent capabilities, 6 brand capabilities, each toggle-able. Super admin (WP `manage_options`) bypasses. Replicate with Supabase RLS + role tags.
6. **Integrations the admin can configure**: Stripe (test/live), PayPal Payouts, Claude API, Gemini API, OpenAI, Replicate, Unsplash, Ideogram v3, Phyllo, Vectorizer.ai, Google Drive (Shared Drive ID + service account), CRM (REST + AJAX legacy), Namecheap (domains), cPanel × 2 (talent site + EPK subdomains), OneSource/PromoStandards.
7. **NILiance backend**: currently Sharetribe Integration API + Marketplace API (for user create). Path B (NILiance Wrapper) noted as future. Active env is **Staging**.
8. **Sharetribe sync**: pulls 105+ profile fields per user. Inbound poll runs on cron, batch size + interval configurable.
9. **App Builder ad model**: 4 placement types (Splash, Footer, In-Feed with N-frequency, Interstitial). Platform vs talent merch revenue split is configurable per-platform default.
10. **NIL Stores**: net margin commission to talent = (gross − supplier − shipping) × commission %. Default platform-wide, overridable per-store.
11. **Climb Studio**: HeyGen narrator with sync'd avatars/voices, image chain (OpenAI DALL-E 3 → Replicate Flux → Unsplash fallback).
12. **Resources**: legacy uses WordPress Download Manager Pro. Categories are tag-style with audience scoping (Everyone / Talent Only / Brands Only).
13. **WPDM** has 26 categories observed, including duplicates (WP cat ID collisions).
14. **Talent Payouts**: 15% platform fee, owed-to-talent calculation, KPI tiles, revenue report with CSV export.
15. **Roadmap goals**: 16 goals (Learn about NIL, Grow following, Sell products, etc.), each maps to 3-6 roadmap items.
16. **Opportunities canonical buckets**: reward, perk, bulk_job, single_job, campaign. Author types: brand, fan, talent, agency, school, admin.
17. **NIL Readiness score**: shown on talent dashboard (87/100 → grade A). Algorithm unknown — read [EdgeZoneCore.php](../wp-content/snippet-code/edgezone/EdgeZoneCore.php) when building.

## Immediate quick-wins (Phase 1)

Before any deeper work, fix what we already got wrong using today's captures:

- [ ] Change primary color from `#ac8d3b` → **`#C8A84E`** (and check secondary/accent)
- [ ] Add 5 missing guided paths: Go Digital, Create Content Like a Pro, Life After Sports, Get Financially Smart, Legal Protection 101
- [ ] Add 3 missing Health & Wellness services: Performance Nutrition ($199), Healthcare & Wellness, Performance Improvement
- [ ] Add 16 brand-side services from the CRM Program Mapping (Graphic Design Services, Digital Design Packs, Reputation & Reviews, Listings Management, Affiliate Marketing, Market Research, Investor Assistance, 3D Replica Event Truck, Philanthropic Support, + 7 Employee Benefits)
- [ ] Fix prices: Personal Brand Design $150 (not $199), PPC & SEO Marketing $399/mo (not $799), Prep For NIL Academy $9/mo (not $49)
- [ ] Sync service slugs to the legacy 53-slug list (some I have don't match — e.g., legacy uses `create-a-mobile-app` not `mobile-app`)
- [ ] Update services to support `audience: 'talent' | 'brand' | 'employee'` (third value for the (Employees) variants)

## What I'll need from you (per phase)

- **Phase 1**: Nothing — I can apply all the data corrections from captures.
- **Phase 3 (authed shell)**: Brand role login fix + a brand-user walkthrough (or admin walkthrough of brand views).
- **Phase 6 (Marketplace)**: Stripe API keys (test mode is fine; we already have them slot in `.env.local`).
- **Phase 7 (NILiance)**: Sharetribe staging Client ID + Secret (Integration API + Marketplace API both).
- **Phase 8 (Brand Design)**: Ideogram API key, Google Drive Shared Drive ID + service account JSON.
- **Phase 9 (Site Builder)**: Namecheap API + cPanel for talent subdomain. Or skip subdomain wiring and just use Vercel domains.
- **Phase 11 (App Builder)**: Optional Firebase / OneSignal credentials for push.
- **Phase 12 (Podcast)**: Optional Megaphone/Art19 (DAI) + Whisper/Deepgram/Gemini (transcripts) — deferred to Phase 2.
- **Phase 14 (Climb)**: OpenAI key (DALL-E 3) + HeyGen key.
- **Phase 22 (Cutover)**: Existing WP database access for `wp_options` blob export + user table dump.
