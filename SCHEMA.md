# Edge Zone — Data Schema

Full normalized Postgres schema for the Supabase migration. Tables are added
in phases. Each section maps to one or more legacy WordPress modules and
documents the canonical replacement.

## Conventions

- All tables in `public` schema unless noted.
- Primary keys are UUID (`gen_random_uuid()`) for user-facing entities, `bigserial` for log/event streams, `text` for natural keys (slugs, Stripe IDs).
- `created_at`, `updated_at` are `timestamptz not null default now()`. `updated_at` is bumped by trigger.
- Money in cents (`bigint`). Currency code on each row.
- Soft deletes via `deleted_at timestamptz` only where audit history matters.
- RLS enabled on every public table. Service role bypasses all policies.
- All FKs cascade-on-delete or set-null based on whether the child row makes sense without its parent.

---

## Phase 0 — Foundation
*Replaces: WordPress user system, `current_user_can`, ad-hoc audit, subdomain proxy hosts.*

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users` — display name, avatar, CRM link, metadata blob. |
| `user_roles` | Many-to-many `(user_id, role)`. Roles: `athlete`, `vendor`, `admin`, `climb_admin`. |
| `audit_log` | Append-only stream of state-changing actions (action, resource, metadata, ip). |
| `custom_domains` | `domain → (target_type, target_slug, user_id, vercel_domain_id, cert_status)`. The O(1) lookup that powers all custom domain + subdomain routing. |
| `stripe_events` | Webhook idempotency log keyed by Stripe event ID. |
| `email_log` | Resend delivery tracking — to, from, template, status, timestamps. |
| `feature_flags` | Rollout toggles by key, with optional percentage. |

Helper: `public.is_admin()` for use inside RLS policies.

---

## Phase 1 — Marketplace + Fulfillment
*Replaces: `EdgeZoneMarketplace.php`, `EdgeZoneFulfillment.php`.*

### Marketplace
| Table | Purpose |
|---|---|
| `categories` | Product taxonomy (tree via `parent_id`). |
| `vendors` | Vendor accounts (separate from user profiles — a user can manage multiple vendors). |
| `products` | Master catalog. `vendor_id`, `category_id`, status, slug, base price. |
| `product_variants` | SKU-level — Stripe price ID, fulfillment type, stock policy. |
| `product_media` | Images/video per product (ordered). |

### Cart & checkout
| Table | Purpose |
|---|---|
| `carts` | One per session/user. |
| `cart_items` | `cart_id, variant_id, quantity, unit_price`. |
| `discount_codes` | Code, percent/amount, validity, usage limits. |

### Orders
| Table | Purpose |
|---|---|
| `orders` | `user_id`, `stripe_session_id`, `stripe_payment_intent`, status, totals, currency, addresses jsonb. |
| `order_items` | Snapshot of variant at purchase time (name, sku, unit_price, qty, metadata). |
| `payments` | `order_id`, Stripe payment intent, charge ID, status, amount. |
| `refunds` | `payment_id`, Stripe refund ID, amount, reason. |
| `subscriptions` | If/when recurring products exist. |

### Fulfillment
| Table | Purpose |
|---|---|
| `provisioning_jobs` | `order_item_id`, `kind` (site/epk/brand/app/store/podcast), `status`, `inngest_run_id`, attempts, last_error. |
| `crm_contacts` | Mirror of CRM contacts keyed by `crm_id`. |
| `crm_deals` | Mirror of CRM deals; `order_id` FK. |
| `crm_sync_log` | One row per sync attempt — payload, response, error. |

### Indexes (key)
- `orders (user_id, created_at desc)`, `orders (stripe_session_id)`, `orders (status)`.
- `provisioning_jobs (status, created_at)` (queue drain).
- `crm_sync_log (created_at desc)`.

---

## Phase 2 — BrandDesign + TalentEPK
*Replaces: `BrandDesign.php`, `TalentEPK.php`.*

### Brand
| Table | Purpose |
|---|---|
| `brands` | One per athlete-product purchase. `slug`, `user_id`, `order_item_id`, status. |
| `brand_preferences` | Sport, position, school, mascot, colors, tone — current values. |
| `logos` | Many per brand. `brand_id`, `style`, `is_active`, file URLs, transparent URL. |
| `logo_concepts` | Per-round generations (`logo_id`, `round` 1/2/3, `prompt`, `image_url`, `selected_at`). |
| `brand_assets` | Final deliverables — kit files, guide files, headshots (Drive URLs). |
| `brand_revisions` | Revision history with notes and timestamps (audit + undo). |

### EPK
| Table | Purpose |
|---|---|
| `epks` | One per athlete. `slug`, `user_id`, `theme`, `published_at`. |
| `epk_sections` | Bio, achievements, contact, custom — ordered. |
| `epk_media` | Videos, photos, press clippings. |
| `epk_stats` | Sport-specific stats blob (jsonb) — flexible per sport. |

---

## Phase 3 — TalentSiteBuilder
*Replaces: `TalentSiteBuilder.php`.*

| Table | Purpose |
|---|---|
| `sites` | One per athlete. `slug`, `user_id`, `theme_id`, `published_at`. |
| `site_pages` | Per-site pages. `site_id`, `path`, `title`, `seo_meta`. |
| `site_blocks` | Block-based content. `page_id`, `position`, `type`, `props` jsonb. |
| `site_themes` | Theme configs (colors, fonts, layout). |
| `site_navigation` | Nav menu items per site. |

Custom domains land in the global `custom_domains` table with `target_type = 'site'`.

---

## Phase 4 — NilStores + AppsForTalent
*Replaces: `NilStores.php`, `AppsForTalent.php`.*

### NilStores
| Table | Purpose |
|---|---|
| `stores` | One per athlete. `slug`, `user_id`, status. |
| `suppliers` | POD / wholesale supplier API configs. |
| `supplier_skus` | Cached supplier catalog. |
| `store_products` | Athlete-curated selection from `supplier_skus`. Markup, custom title. |
| `store_orders` | Separate from main `orders` — different shipping/fulfillment model. |
| `store_payouts` | Athlete payout records (Stripe Connect). |

### AppsForTalent
| Table | Purpose |
|---|---|
| `mobile_apps` | One per athlete. `slug`, `display_name`, `manifest` jsonb. |
| `app_screens` | Screen definitions per app (ordered). |
| `app_builds` | Build history if generating native bundles. |
| `app_push_tokens` | Device tokens for push notifications. |

---

## Phase 5 — PodcastForTalent
*Replaces: `PodcastForTalent.php`.*

| Table | Purpose |
|---|---|
| `podcasts` | One per athlete. `slug`, `user_id`, `title`, `description`, `cover_url`. |
| `episodes` | `podcast_id`, `episode_number`, `title`, `audio_url`, `transcript`, `published_at`. |
| `podcast_settings` | RSS feed metadata, distribution flags (Apple, Spotify, etc.). |
| `podcast_pages` | Custom pages for the public podcast site. |

---

## Phase 6 — Climb + Climb Admin
*Replaces: `EdgeZoneClimb.php`, `EdgeZoneClimbAdmin.php`.*

| Table | Purpose |
|---|---|
| `climb_stops` | The 40 stops. Could be MDX-in-repo if rarely edited, or DB-managed if Climb Admin needs CRUD. |
| `climb_progress` | `user_id`, `stop_id`, completed_at. |
| `climb_narrators` | HeyGen narrator configs (avatar, voice, script). |
| `climb_renders` | HeyGen render jobs and resulting video URLs. |
| `climb_analytics` | Per-stop engagement events. |

---

## Phase 7 — Niliance bridge
*Replaces: `EdgeZoneNiliance.php`.*

| Table | Purpose |
|---|---|
| `niliance_users` | Sharetribe user sync state — `user_id`, `sharetribe_id`, `last_synced_at`. |
| `niliance_listings` | Sharetribe listings cache for search/discovery. |
| `niliance_messages` | Cache of message threads if local rendering is needed. |

---

## Cross-cutting

| Table | Purpose |
|---|---|
| `media` | Generic uploaded files — Supabase Storage path or external URL (Drive). |
| `webhook_events` | Generic idempotency log for non-Stripe webhooks (HeyGen, Sharetribe, etc.). |
| `notifications` | In-app notifications. |
| `api_keys` | User-scoped API keys for partner integrations (post-acquisition value). |

---

## RLS pattern summary

- **Public read** (catalog data): `categories`, `products`, `product_variants` with `status = 'published'`.
- **Owner read/write**: `brands`, `sites`, `epks`, `stores`, `mobile_apps`, `podcasts`, `custom_domains`.
- **Admin-only read**: `audit_log`, `crm_sync_log`, `provisioning_jobs`.
- **Service-role only**: `stripe_events`, `email_log`, `webhook_events`, `feature_flags` (writes).

Owner = `user_id = auth.uid()`. Admin = `public.is_admin()`. Vendor scopes are added in Phase 1 via a `vendor_members` join table.
