# Brand Design — WordPress → Next.js Parity Audit

Audit of `C:\wp-content\snippet-code\edgezone\BrandDesign.php` (8,652 lines, self-contained legacy module) against the current Next.js port at `C:\projects\edgezone-next`. Captures every user-facing surface, the PHP function backing it, the Next.js equivalent, and what's still missing.

---

## 1. Feature Inventory

### 1.1 Public landing page (`/brand-design` shortcode + wizard)

The legacy module ships an entire pre-auth funnel — a full-screen 4-step wizard that lets a talent walk in cold, generate logos, pay Stripe, and create an account in a single sitting.

| # | Feature | One-liner | PHP functions / hooks | Persisted fields |
|---|---|---|---|---|
| 1.1.1 | Rewrite rule `^brand-design/?$` | Maps `/brand-design/` → wizard render | `init` rewrite (L 7081); `template_redirect` (L 7086); `nilbd_render_wizard` (L 7107) | n/a |
| 1.1.2 | `wp_ajax_nilbd_wizard` render fallback | Wizard reachable via AJAX when used cross-domain | `nilbd_ajax_render_wizard` (L 7096) | n/a |
| 1.1.3 | Public wizard branding load | Loads page title, accent, bg, logo, button text, Stripe pk, payment amount | `nilbd_ajax_wizard_settings` (L 7018) | reads `nil_crm_brand_design_settings` |
| 1.1.4 | Public CORS preflight | Allows wizard embedded on `theedgezone.com` to call `admin-ajax.php` on CRM site | anonymous `init` action (L 450) — scoped to `nil_bd_form_*`, `nilbd_*`, `nil_bd_portal*` | reads `allowed_origins` |
| 1.1.5 | Cross-site bridge code generator | Generates two installable proxies (Proxy/Redirect) for external WP sites | `wp_ajax_nil_bd_bridge_code` (L 2967) | n/a |

### 1.2 Public form intake (Step 0 of the wizard)

Step 0 of the wizard. Self-contained form storage — every form is `nil_bd_form_{slug}` with its own fields, branding, payment, allowed-origin, post-submit actions. Auto-seeds the `brand-design` form on first admin visit.

| # | Feature | One-liner | PHP functions / hooks | Persisted fields |
|---|---|---|---|---|
| 1.2.1 | Athlete prefs form (wizard Step 0) | Name, email, sport, position, jersey #, initials, symbol, 3 style adjectives, colors, vibe, inspo | wizard markup L 7182–7188; submit handler `nilbd_ajax_start` (L 5765) | `nil_bd_session_{token}` (24h) → `prefs[]` |
| 1.2.2 | Form Builder schema | 20-field stored form (heading/text/email/phone/textarea/url/multi_select/select/image/signature/checkbox) with steps + AI-assist hints | `nil_bd_form_ensure` (L 329); defaults at L 336–373 | `nil_bd_form_brand-design`, indexed by `nil_bd_form_index` |
| 1.2.3 | Public form render (standalone) | Self-hosted HTML form page accessible via `?action=nil_bd_form&form=brand-design`, with full branding + Stripe + signature + AI-assist | `nil_bd_form_render_handler` (L 4365) | reads form |
| 1.2.4 | Form submit handler | Validates payment, stores submission, creates CRM entity + deal, fires post-submit actions, fires `nil_crm_intake_after_submit` hook | `nil_bd_form_submit_handler` (L 4612) | `nil_bd_sub_{id}`, `nil_bd_sub_idx`, CRM `nil_crm_lead` + `v33_deals` |
| 1.2.5 | Public file upload | Allows form file/image fields to upload via `wp_handle_upload` | `nil_bd_form_upload_handler` (L 4351) | uploaded file URL |
| 1.2.6 | Public AI field assist | Gemini-backed "AI Bio Writer" / "AI Awards Writer" content drafter inside the form | `nil_bd_form_ai_handler` (L 4331) | n/a |
| 1.2.7 | Form actions engine | After submit: `send_email`, `add_tag`, `send_credentials` (creates portal login), `send_guide` | inline switch in `nil_bd_form_submit_handler` L 4817–4869 | `crm_tags`, login email |
| 1.2.8 | Affiliate tracking + UTM | Captures `?ref=`, `utm_*` from URL; bumps clicks then conversions on submit/pay | `nil_bd_affiliate_track_handler` (L 4001), `nil_bd_affiliate_click` (L 4014), `nil_bd_affiliate_convert` (L 424) | `nil_bd_affiliates[code]` |
| 1.2.9 | Short link redirector | `?action=nil_bd_go&c=CODE` → 302 to wizard with ref code attached | `nil_bd_short_redirect` (L 4069) | `nil_bd_short_links` (click counter) |
| 1.2.10 | QR + embed code generator | Admin builds iframe / `<script>` autoresize embed, plus QR PNG via qrserver.com | `nil_bd_gen_qr` (L 4083), `nil_bd_embed_codes` (L 4092) | n/a |

### 1.3 Auth (talent + brand-customer login system)

The legacy module runs its own password auth (NOT WordPress users). One account per email, linked to one `brand_slug`. Session is a 32-char hex token in cookie `nil_bd_token` (30 days).

| # | Feature | One-liner | PHP functions / hooks | Persisted fields |
|---|---|---|---|---|
| 1.3.1 | Custom username/password auth | `nil_bd_auth_get/save/create/validate/by_token` — bcrypt hashes, stored in `nil_bd_auth` option keyed by email | L 234–271 | `email`, `password_hash`, `brand_slug`, `name`, `token`, `created`, `last_login` |
| 1.3.2 | Login page | Branded, self-contained HTML login form, sets `nil_bd_token` cookie | `nil_bd_login_handler` (L 486) | n/a |
| 1.3.3 | Logout | Clears cookie, redirects to login | `nil_bd_logout_handler` (L 522) | n/a |
| 1.3.4 | Self-serve change password | Authenticated, requires current + new ≥ 6 chars | `nil_bd_change_pw_handler` (L 2306) | `password_hash` |
| 1.3.5 | Admin send credentials | Generates 8-char password, emails login URL | `wp_ajax_nil_bd_send_credentials` (L 3307), `wp_ajax_nil_bd_send_creds_admin` (L 3277) | account + mailed pw |
| 1.3.6 | Admin auth CRUD | List, create, reset password, delete portal accounts | L 4227–4266 | `nil_bd_auth` |
| 1.3.7 | External portal URL override | All credential / "ready" emails point at `https://theedgezone.com/brand-portal` instead of `admin-ajax.php` | `nilbd_email_login_url` (L 282); `portal_external_url` setting | n/a |

### 1.4 Design Studio — wizard generation + revision flow

Two distinct AI flows: (a) the cold wizard (Gemini, 6 R1 concepts + 8 R2 refinements via image-conditioned generation), and (b) the admin/portal designer-concept + revision loop.

| # | Feature | One-liner | PHP functions / hooks | Persisted fields |
|---|---|---|---|---|
| 1.4.1 | Round-1 concept generation | 6 logos in parallel, each with a different `style_mods[]` index | `nilbd_ajax_gen_r1` (L 5793); `nilbd_build_prompts` (L 5680); `nilbd_gemini_generate_image` (L 4973) | `nil_bd_session_{token}.round1[idx] = {b64,data_url,mime,prompt}` |
| 1.4.2 | Round-1 pick + refinement notes | Lets talent type free-form direction before R2 | `nilbd_ajax_pick_r1` (L 5847) | session `chosen_r1`, `refinement_notes` |
| 1.4.3 | Round-2 refined logos (image-conditioned) | 8 variations, each remix of chosen R1 with `vibes[]` seed phrase + user notes | `nilbd_ajax_gen_r2` (L 5863) | session `round2[var_idx] = {logo:{b64,data_url}}` |
| 1.4.4 | Round-2 pick → final | Stores chosen R2 + returns triptych payload | `nilbd_ajax_pick_r2` (L 5912) | session `chosen_r2` |
| 1.4.5 | Spelling enforcement block | Sends name letter-by-letter ("M-I-K-E R-A-M-I-R-E-Z") + critical-text-accuracy rule | inline in `nilbd_build_prompts` L 5694–5712 | prompt only |
| 1.4.6 | Stripe payment intent (wizard) | Pre-confirm step calls `payment_intents` API | `nilbd_ajax_create_payment` (L 7045) | n/a |
| 1.4.7 | "Create deal" final submit | Verifies Stripe PI, creates CRM entity + deal + brand record + auth account, uploads to Drive, fires hook, issues 10-min `build_token` | `nilbd_ajax_create_deal` (L 5929) | `nil_bd_lead` entity, `v33_deals[]`, `nil_bd_{slug}`, `nil_bd_auth`, `build_token` |
| 1.4.8 | Auto-pipeline silent refine | Spawns 6 more "AI Refine" variations after submit, no admin interaction | `nilbd_auto_refine_step` (L 6699), called from `silentRefine()` JS L 7434 | `brand.designer_concepts[]` with `source=auto_refine` |
| 1.4.9 | Auto-pipeline silent build kit | Generates 12+ derivative files (5 PNG sizes, transparent, JPG, raster SVG, true SVG via vectorizer.ai, fonts, brand guide PDF), upgrades status to `delivered` | `nilbd_auto_build_kit` (L 6761), `nilbd_generate_brand_guide_pdf` (L 5150) | `brand.brand_kit_files[]`, `brand.brand_kit_built`, `brand.status=delivered` |
| 1.4.10 | Designer concept upload | Admin uploads pro logo concepts; emails talent | `wp_ajax_nil_bd_upload_concept` (L 2702) | `brand.designer_concepts[]` |
| 1.4.11 | Talent select final concept | Picks from `designer_concepts[]` or revision round; triggers auto-build-kit | `nil_bd_select_concept_fn` (L 2736) — also builds full kit inline (L 2772–2890) | `brand.final_logo_selected`, `brand.brand_kit_files[]`, `brand.status=delivered` |
| 1.4.12 | Revision request (free first, $10 paid after) | Talent types notes; admin sees email + uploads revised concepts; multi-round | `nil_bd_request_revision_fn` (L 2933); `wp_ajax_nil_bd_upload_revision_concept` (L 3025) | `brand.revision_rounds[][{notes,concepts[],paid_amount,created}]` |
| 1.4.13 | Pick revision concept as final | Same kit-build pipeline triggers | `nil_bd_select_concept_fn` with `source=revision` | as 1.4.11 |
| 1.4.14 | Admin AI Refine (post-launch) | Generates 6 concept variations from any selected logo, per style direction (mixed/minimal/bold/luxury/modern/vintage) | `wp_ajax_nil_bd_ai_refine` (L 6393) | `brand.designer_concepts[]` with `source=ai_refine` |
| 1.4.15 | Admin upload final logo files | Production deliverables (PNG/SVG/PDF/EPS) | `wp_ajax_nil_bd_upload_final_logo` (L 2979) | `brand.final_logo_files[]` |
| 1.4.16 | Admin reset selection | Clears `final_logo_selected` so talent can re-pick | `wp_ajax_nil_bd_reset_selection` (L 3009) | `brand.final_logo_selected=null` |
| 1.4.17 | Watermark + preview overlay | Wizard concept images blocked from right-click/drag, post-completion concepts shown with `PREVIEW` watermark text overlay | inline JS in portal handler L 940–953 + wizard L 7144–7174 | n/a |
| 1.4.18 | Per-concept purchase ($15) | Athlete can buy any wizard/designer concept as an additional final logo with its own kit | inline button + modal in portal L 963–966; backend in `bp` Stripe flow | `brand.purchased_concepts[]` |

### 1.5 Brand Arsenal — admin asset library + talent self-serve generation

After final logo, talent can self-generate branded assets from 14 categories using Gemini image-editing (logo sent as reference, scene composed around it).

| # | Feature | One-liner | PHP functions / hooks | Persisted fields |
|---|---|---|---|---|
| 1.5.1 | Self-serve asset generator (14 categories) | `social`, `merch`, `uniforms`, `business_card`, `email_signature`, `zoom_bg`, `phone_wallpaper`, `story_highlights`, `letterhead`, `presentation`, `thank_you_card`, `media_kit`, `logo_on_photo`, `photo` | `nil_bd_portal_generate_fn` (L 3408) | `brand.assets[]`, `social_templates[]`, `merch_mockups[]` |
| 1.5.2 | Asset credit gate | Free `asset_limit` (25) per account + purchased packs (10 for $4.99 default) | inline limit check L 3417–3425 | `brand.assets_created_total`, `assets_purchased_packs` |
| 1.5.3 | Asset pack purchase | Stripe PI + verify + add packs | `nil_bd_pack_payment_fn` (L 2367), `nil_bd_purchase_packs_fn` (L 2402) | also writes `ez_order` post with SKU `ASSET-PACK-10` |
| 1.5.4 | Photo + logo composite (GD, no AI) | Pure PHP GD overlay — picks placement (top_left ... bottom_right + watermark) and 3 sizes | inline at `category=='logo_on_photo'` L 3522–3631 | `brand.assets[] [type=photo_overlay]` |
| 1.5.5 | Soft-delete asset | Moves to `deleted_assets[]` instead of hard delete | `nil_bd_delete_asset_fn` (L 2454) | `brand.deleted_assets[]` |
| 1.5.6 | Admin social template generator | Admin can manually trigger social template for 1080×1080 / 1080×1920 / etc. | `wp_ajax_nil_bd_gen_social` (L 3339) | `brand.social_templates[]` |
| 1.5.7 | Admin merch mockup generator | Admin manual trigger for tshirt/hoodie/hat/jersey/poster | `wp_ajax_nil_bd_gen_merch` (L 3372) | `brand.merch_mockups[]` |
| 1.5.8 | Admin upload asset (any category) | Generic asset upload | `wp_ajax_nil_bd_upload_asset` (L 2577) | `brand.assets[]` |
| 1.5.9 | Admin upload logo variation | primary/secondary/icon/wordmark | `wp_ajax_nil_bd_upload_logo` (L 2610) | `brand.logo_urls[]` |
| 1.5.10 | Admin upload brand guide PDF | `brand.brand_guide_files[]` with email | `wp_ajax_nil_bd_upload_brand_guide` (L 3066) | `brand.brand_guide_files[]` |
| 1.5.11 | Brand toolkit personalized content | 10 Gemini-generated coaching docs: brand launch playbook, NIL deals toolkit, content strategy, growth playbook, brand protection guide, sponsor pitch deck, bio writer, email templates, game-day playbook, off-season strategy | `nil_bd_portal_toolkit_fn` (L 2484) | not persisted; returned per-request |
| 1.5.12 | Admin "get creations" panel | Returns all athlete-generated assets sorted by date | `wp_ajax_nil_bd_get_creations` (L 3096) | n/a |
| 1.5.13 | Vectorizer.ai upgrade | Raster → true SVG paths (separate from naked `<image>` SVG wrapper) | `nilbd_vectorize_image` (L 189) | added to `brand_kit_files[]` |
| 1.5.14 | Brand fonts auto-suggest | 10 paired Google-Font combos (bold/luxury/minimal/modern/vintage/elegant/sporty/futuristic/street/classic) keyed by vibe + sport | `nilbd_font_pairs` (L 160), `nilbd_auto_suggest_fonts` (L 176) | `brand.brand_fonts {heading, body}` |
| 1.5.15 | Brand guide PDF generator | Multi-page PDF with cover, colors, typography, do-don't rules (uses FPDF) | `nilbd_generate_brand_guide_pdf_impl` (L 5158) | added to `brand_kit_files[]` |
| 1.5.16 | Color extraction from logo | Reads logo image, returns top N hex colors | `nilbd_extract_logo_colors` (L 5073) | seeds `brand.brand_colors[]` on wizard complete |
| 1.5.17 | Image composite helper | Generic logo-on-base compositor with placements `center / center-upper / center-chest / top-left / top-right / bottom-right / left-center` | `nilbd_composite_logo` (L 5594) | n/a |
| 1.5.18 | "Brand Lite" upload-your-own | If brand was sold without design service, talent uploads existing logo; same kit-build pipeline runs | `ezf_brand_lite_upload` (called from portal; lives in EZF) — handler reference L 813 | sets `brand.type='lite'`, then 1.4.9 |
| 1.5.19 | Multi-logo per brand | `brand.logos[]` array each with own assets/social_templates/merch_mockups; `active_logo_id` switches active | L 616–622 (lite detection), L 3823 (active_logo_id), L 3837–3849 (per-logo dual write) | `brand.logos[]`, `brand.active_logo_id` |

### 1.6 Print Shop + Logo Mod

Not strictly inside BrandDesign.php — they live in sibling EZF files but the brand portal exposes a "Modify Logo" tab that calls these flows. Including for completeness since the user asked for the print shop.

| # | Feature | One-liner | PHP functions / hooks | Persisted fields |
|---|---|---|---|---|
| 1.6.1 | "Modify Logo" tab in portal | Buttons routing to logo-mod flow; price seeded from `logo_mod_price` setting | inline JS in portal handler around `_BLM` (L 685) | n/a here |
| 1.6.2 | Concept logo purchase ($15 default) | "Purchase as Final Logo" button in portal | `_BCP` setting L 686 | `brand.purchased_concepts[]` |

### 1.7 Brand Customer Portal (the gift/share-with-brand flow)

The talent's authenticated portal — 8 tabs that switch based on whether it's a "lite" brand or a designed brand.

| # | Feature | One-liner | PHP functions / hooks | Persisted fields |
|---|---|---|---|---|
| 1.7.1 | Portal shell (auth-gated) | Cookie or `?token=` lookup, renders branded HTML page with tabs | `nil_bd_portal_handler` (L 533) | n/a |
| 1.7.2 | Tab: Design Concepts | Grid of designer-uploaded + wizard concepts, with chosen-R1/R2/final badges, watermark on un-purchased after delivery | `bpLoadDesigner()` inline JS L 897 | reads brand |
| 1.7.3 | Tab: Final Logo | Download all `final_logo_files[]` | `bpLoadFinal()` (in JS below cut) | reads brand |
| 1.7.4 | Tab: Brand Toolkit | Picker for 10 coaching content types | `bpLoadToolkit()` + 1.5.11 | not persisted |
| 1.7.5 | Tab: Create | 14-category asset generator UI | `bpLoadCreate()` + 1.5.1 | as 1.5.1 |
| 1.7.6 | Tab: Modify Logo | Triggers logo-mod purchase flow | `bpLoadModify()` | downstream tables |
| 1.7.7 | Tab: Brand Guide | Lists `brand_kit_files[]` + `brand_guide_files[]` with download buttons | `bpLoadBrand()` | reads brand |
| 1.7.8 | Tab: My Info (Settings) | Edit `social_handles`, `follower_count`, `target_audience`, `goals`, `display_name`, `jersey_number`, `school`, `mascot`, `conference`, `team_colors`, `tagline`, `personal_website`, `contact_email`, `contact_phone`, `brand_tone`, `content_style`, `color_mode`, `headshot_url`, `nil_partners`, `achievements`, `grad_year`, change password | `nil_bd_save_profile_fn` (L 2324) | `brand[*]` |
| 1.7.9 | Tab: Help | Static FAQ + escalation form | `bpLoadHelp()` | n/a |
| 1.7.10 | Lightbox + image protection | Right-click block, drag block, `oncontextmenu` overrides — but `.ez-downloadable` opt-in class | inline CSS L 575–605, JS L 7276–7281 | n/a |
| 1.7.11 | Asset usage meter + buy-more modal | Shows credits used / remaining, prompts pack purchase when ≤ 5 left | inline meter in create tab + `nil_bd_pack_payment_fn` | `assets_purchased_packs` |

### 1.8 Admin settings (the ECD Brand Design Manager)

Reachable via Exec Collab Dashboard. 8 sub-tabs.

| # | Feature | One-liner | PHP functions / hooks | Persisted fields |
|---|---|---|---|---|
| 1.8.1 | Settings storage | `nil_crm_brand_design_settings` option holds 30+ fields | `nilbd_get_settings` (L 30), `nilbd_save_settings` (L 71) | `gemini_api_key`, `vectorizer_api_id/secret`, `allowed_origins`, `page_title`, `page_subtitle`, `accent_color`, `bg_color`, `logo_url`, `btn_text`, `confirmation_message`, `wizard_working_text`, `wizard_progress_color`, `wizard_progress_done`, `wizard_spinner_color`, login_* (5 fields), portal_* (5 fields incl `portal_external_url`), `stripe_pk`, `stripe_sk`, `payment_amount`, `asset_limit` (default 25), `asset_pack_size` (10), `asset_pack_price` (4.99), `payment_label`, 4 prompt templates |
| 1.8.2 | Save settings AJAX | All fields | `wp_ajax_nilbd_save_settings` (L 6341) | as above |
| 1.8.3 | Test Gemini connection | Generates a blue circle | `wp_ajax_nilbd_test_gemini` (L 6923) | n/a |
| 1.8.4 | Test Stripe connection | Creates+cancels $0.50 PI; reports key source (form/module/CRM global) + mode (test/live) | `wp_ajax_nilbd_test_stripe` (L 6938) | n/a |
| 1.8.5 | Test Vectorizer.ai | Sends 1px PNG, reports auth/credit status | `wp_ajax_nilbd_test_vectorizer` (L 6981) | n/a |
| 1.8.6 | Tab: Brands | Lists every brand record with status/asset count/email | `wp_ajax_nil_bd_list` (L 3205), full record `wp_ajax_nil_bd_get_brand` (L 3266) | reads `nil_bd_index` |
| 1.8.7 | Tab: Wizard Form | Form Builder UI (drag-drop, field types, AI assist hints, post-submit actions) | renders via `_nilbdRenderWizardForm()` JS; backed by L 3859–3953 | `nil_bd_form_{slug}` |
| 1.8.8 | Tab: Distribution | Trackable links, short links + QR, affiliate partner manager | reads from L 3958–4110 | `nil_bd_affiliates`, `nil_bd_short_links` |
| 1.8.9 | Tab: Auth | List/reset-pw/delete portal accounts | L 4227–4266 | `nil_bd_auth` |
| 1.8.10 | Tab: API | Gemini key, Vectorizer keys, allowed origins, DB cleanup button | L 7501–7527 | as 1.8.1 |
| 1.8.11 | Tab: Branding | 3 sections: Wizard / Login page / Portal, each with title, subtitle, accent, bg, logo URL; pair-synced color pickers | L 7529–7569 | as 1.8.1 |
| 1.8.12 | Tab: Payments | Stripe pk/sk, wizard amount, payment label, asset limit, pack size + price | L 7572–7594 | as 1.8.1 |
| 1.8.13 | Tab: Prompts | 4 editable Gemini prompt templates with {name}/{spelled}/{colors}/etc placeholders, reset-to-defaults button | L 7596–7611 | `prompt_r1_logo`, `prompt_r2_logo`, `prompt_r2_jersey`, `prompt_r2_board` |
| 1.8.14 | Tab: Help | Full 12-section admin guide rendered inline | L 7614–7777 | n/a |
| 1.8.15 | Brand card actions | Per-brand: send-login, upload concept, upload revision, upload final, upload guide, reset selection, view creations, delete | L 2702 (concept), 3009 (reset), 3025 (revision), 2979 (final), 3066 (guide), 3096 (creations), 3227 (delete) | various |
| 1.8.16 | Submission management | List/get/dismiss/delete/convert intake submissions (when auto-create failed) | L 4114–4221 | `nil_bd_sub_*` |
| 1.8.17 | DB cleanup (data-URL → file) | One-shot conversion of base64 data URLs stored in brand records → real uploads | `wp_ajax_nil_bd_cleanup_data_urls` (L 3112) | rewrites every `brand.*.url` field |
| 1.8.18 | Deal panel section | When viewing a Talent's CRM record, shows brand prefs + final triptych + Drive links inline in the deal body | `nil_crm_deal_body_section` filter (L 8589) | reads `v33_deals[].brand_design_*` |
| 1.8.19 | Stripe key resolution | 3-tier waterfall: per-form override → module settings → CRM global (`nil_crm_get_active_stripe`) | `nilbd_get_stripe_keys` (L 76) | reads multiple sources |

### 1.9 Helper utilities

| # | Function | Purpose | Location |
|---|---|---|---|
| 1.9.1 | `nil_bd_slug_from_name` | Sanitize-title + uniqueness loop (`-2`, `-3` suffix) | L 150 |
| 1.9.2 | `nilbd_save_image_to_uploads` | Decode b64 data URL → write to uploads folder → return URL | L 5042 |
| 1.9.3 | `nilbd_extract_logo_colors` | GD-based dominant color extraction | L 5073 |
| 1.9.4 | `NilPDF` class + `nilbd_ensure_fpdf` | Brand guide PDF generation via bundled FPDF | L 5110–5148 |
| 1.9.5 | `nilbd_stripe_request` | curl wrapper for Stripe API | L 213 |
| 1.9.6 | `nilbd_vectorize_image` | Vectorizer.ai POST → raw SVG paths | L 189 |
| 1.9.7 | `nilbd_composite_logo` | GD compositing with named placements | L 5594 |
| 1.9.8 | `nilbd_create_session` / `get_session` / `update_session` | 24-hour transient-style session store keyed by hex token | L 4934–4968 |
| 1.9.9 | `nilbd_ai_text` | Gemini text-only generation (used by toolkit + form AI assist) | L 5655 |
| 1.9.10 | `nilbd_build_prompts` | Round 1 + Round 2 prompt builder with per-concept style mods | L 5680 |
| 1.9.11 | `nil_bd_defaults` | Default shape of a brand record (39 fields) | L 126 |
| 1.9.12 | Cache busting | Force-clears `wp_cache` on every `nil_bd_save` (L 110–116) and pre-read in long-running flows | inline |

---

## 2. Current Next.js State

Legend: ✅ ported · 🟡 partial · ❌ missing · ⏸️ deferred (different infra)

### 2.1 Public landing page

| # | Feature | Status | Path / notes |
|---|---|---|---|
| 1.1.1–2 | Public `/brand-design` cold-funnel wizard | ❌ Missing | No public-facing wizard route. The Studio at `app/dashboard/brand-design/[id]/page.tsx` requires `requireUser()` — talent must already have an account. Path forward: marketing route `/brand-design` exists but only as a marketing page (via `app/services/...`). |
| 1.1.3 | Public wizard branding load | ❌ Missing | n/a — no public wizard |
| 1.1.4 | Cross-domain CORS for external sites | ⏸️ Deferred | Next.js is the canonical host — no other WP site needs to embed the wizard. CORS not needed. |
| 1.1.5 | Cross-site bridge code generator | ⏸️ Deferred | Same reason as 1.1.4 — Next is the public site. |

### 2.2 Public form intake

| # | Feature | Status | Path / notes |
|---|---|---|---|
| 1.2.1 | Intake form fields | 🟡 Partial | `BuildFromPicker` in `app/dashboard/brand-design/page.tsx` prefills from profile — but no public intake form. Athletes already authenticated via Supabase Auth, so the intake is the profile editor at `app/dashboard/profile/page.tsx`. Missing fields not on profile: `style_seed`/vibe/3 adjectives/initials/symbol/inspiration. |
| 1.2.2 | Form Builder schema | ❌ Missing | No equivalent — the intake form is hardcoded markup. Legacy lets admins drag-drop fields. |
| 1.2.3 | Public form render | ❌ Missing | n/a |
| 1.2.4 | Form submit handler | 🟡 Partial | `createBrandDesign` (`app/dashboard/brand-design/actions.ts` L 23) is the analog — it provisions a `brand_designs` row from profile. No CRM lead, no `nil_crm_intake_after_submit` hook (the equivalent provisioning lives in `lib/provisioning.ts` `provisionBrandDesign`). |
| 1.2.5 | Public file upload | ✅ Ported | `app/dashboard/brand-design/actions.ts` `saveCanvasOutput` handles upload; profile editor handles headshots. |
| 1.2.6 | AI field assist | ❌ Missing | No "AI Bio Writer" inside profile editor. Anthropic SDK is wired (`lib/brand-addons.ts`) but not exposed to profile fields. |
| 1.2.7 | Form actions engine (send_email, add_tag, send_credentials, send_guide) | 🟡 Partial | Resend welcome email is wired (`lib/emails/`). No configurable post-submit action pipeline. |
| 1.2.8 | Affiliate tracking + UTM | 🟡 Partial | Site-builder has its own affiliate + analytics (`supabase/migrations/20260611250000_analytics_short_links_affiliates.sql`) but it's scoped to talent sites, not the brand-design intake. |
| 1.2.9 | Short link redirector | 🟡 Partial | `app/go/` exists for short links (general) but no brand-design tracking. |
| 1.2.10 | QR + embed generator | 🟡 Partial | QR is in `lib/brand-addons.ts` `generateQrCode` (renders to site URL only). No embed-code generator for the brand-design wizard since there is no public wizard. |

### 2.3 Auth

| # | Feature | Status | Path / notes |
|---|---|---|---|
| 1.3.1 | Custom username/password | ⏸️ Deferred | Talent now uses Supabase Auth (`lib/auth.ts`, `lib/supabase/*`). Email = Supabase user; no parallel `nil_bd_auth` table needed. |
| 1.3.2–3 | Login/logout | ⏸️ Deferred | `app/(auth)/sign-in`, `app/(auth)/sign-up` cover this. |
| 1.3.4 | Change password | ✅ Ported | `app/(auth)/reset-password` |
| 1.3.5 | Admin send credentials | ✅ Ported (different shape) | `lib/brand-client-auth.ts` issues magic-link tokens for external brand customers; talent get standard Supabase password reset. |
| 1.3.6 | Admin auth CRUD | ✅ Ported | `app/dashboard/admin/users/page.tsx` (Phase 5 finish-line round). |
| 1.3.7 | External portal URL override | ⏸️ Deferred | Always `${NEXT_PUBLIC_SITE_URL}/brand-portal` — no override needed. |

### 2.4 Design Studio

| # | Feature | Status | Path / notes |
|---|---|---|---|
| 1.4.1 | Round-1 generation | ✅ Ported (different ratio: 20 vs 6) | `generateConcepts` action + `lib/ideogram.ts` `generateConcepts`. Uses Ideogram V3 (legacy uses Gemini 2.5 Flash Image). Issues N parallel calls. |
| 1.4.2 | R1 refinement notes | ❌ Missing | No free-form notes box between rounds. Studio uses ♡ shortlist instead of notes. |
| 1.4.3 | R2 image-conditioned remix | ✅ Ported | `refineRound` action + `lib/ideogram.ts` `remixConcept` (V3 Remix endpoint). Variations per shortlisted concept: R2=3, R3=2. Cap at 6/8 sources to limit API quota. |
| 1.4.4 | R2 pick → final | ✅ Ported | `selectFinalConcept` action. |
| 1.4.5 | Letter-by-letter name spelling block | ❌ Missing | `defaultR1Prompt` is much simpler. The legacy "M-I-K-E R-A-M-I-R-E-Z" CRITICAL TEXT ACCURACY rule is not in the Next.js prompts. |
| 1.4.6 | Stripe PI (pay-to-generate) | ⏸️ Deferred | Marketplace at `app/dashboard/marketplace` handles purchase; once paid, `provisionBrandDesign` runs. No pay-per-wizard flow inside the Studio because talent already paid. |
| 1.4.7 | Final-submit deal creation | ⏸️ Deferred | No CRM "deal" concept in Next; `orders` table is the equivalent (`supabase/migrations/20260611150000_user_type_and_orders.sql`). |
| 1.4.8 | Auto-pipeline silent refine | ❌ Missing | After purchase, Next just provisions an empty `brand_designs` row and waits for the athlete to click "Generate". No background generation runs. |
| 1.4.9 | Auto-pipeline silent build kit | 🟡 Partial | Talent must click "Assemble brand kit" (`assemble-kit.tsx`). `assembleBrandKit` in `lib/brand-kit.ts` outputs: original PNG, transparent PNG (sharp threshold), 6 social sizes, `brand.json`, `README.txt`. No font file, no brand guide PDF, no vectorizer SVG, no JPG-on-white, no Letter-size print sheet, no typography specimen PNG. Missing 10+ files vs. legacy. |
| 1.4.10 | Designer concept upload (admin) | ❌ Missing | Admin can view `brand_designs` at `app/dashboard/admin/brands/page.tsx` but cannot upload designer concepts. There is no `designer_concepts` column / table. |
| 1.4.11 | Talent select final + auto-build | 🟡 Partial | `selectFinalConcept` sets `final_logo_url` + `status='selected'`. Does NOT auto-build the kit. Does NOT email talent. Does NOT audit-log. |
| 1.4.12 | Revision request (free first + $10 paid) | ❌ Missing | No `revision_rounds` table. No revision request flow. |
| 1.4.13 | Pick revision as final | ❌ Missing | Depends on 1.4.12. |
| 1.4.14 | Admin AI Refine | 🟡 Partial | `refineRound` is the analog but it's athlete-driven, not admin. No "AI Refine" panel in admin Brands view. |
| 1.4.15 | Admin upload final logo files | ❌ Missing | No `final_logo_files[]` column / admin uploader. |
| 1.4.16 | Admin reset selection | ❌ Missing | No admin action to clear `final_logo_url`. |
| 1.4.17 | Watermark + preview overlay | 🟡 Partial | Next concept tiles use Next.js `Image` with `unoptimized` — no right-click block, no `PREVIEW` watermark for unpurchased concepts post-finalization. |
| 1.4.18 | Per-concept purchase ($15) | ❌ Missing | No "purchase this concept as a second final logo" flow. |

### 2.5 Brand Arsenal

| # | Feature | Status | Path / notes |
|---|---|---|---|
| 1.5.1 | Self-serve asset generator (14 categories) | 🟡 Partial | `AddonsSection` in `[id]/addons-section.tsx` exposes 6 of 14: `logo_animation`, `brand_voice_doc`, `qr_code`, `email_signature`, `social_avatars` (pack), `trading_card`. Missing: `social` per-platform templates, `merch` mockups, `uniforms`, `business_card`, `zoom_bg`, `phone_wallpaper`, `story_highlights`, `letterhead`, `presentation`, `thank_you_card`, `media_kit`, `logo_on_photo`, `photo`. |
| 1.5.2 | Asset credit gate | 🟡 Partial | `brand_designs.asset_credits_used` / `asset_credits_total` exist (migration `_brand_design.sql` L 31–32) but the addons flow doesn't check or decrement them. |
| 1.5.3 | Asset pack purchase | ❌ Missing | No "buy more credits" Stripe flow. |
| 1.5.4 | Photo + logo composite | ❌ Missing | No GD-equivalent compositor. The `lib/brand-addons.ts` `generateSocialAvatars` does centered logo placement on solid bg, but no user-photo upload. |
| 1.5.5 | Soft-delete asset | ❌ Missing | No `deleted_assets` track or restore flow. |
| 1.5.6 | Admin social template generator | ❌ Missing | |
| 1.5.7 | Admin merch mockup generator | ❌ Missing | |
| 1.5.8 | Admin upload asset | ❌ Missing | |
| 1.5.9 | Admin upload logo variation | ❌ Missing | |
| 1.5.10 | Admin upload brand guide PDF | ❌ Missing | |
| 1.5.11 | Brand toolkit personalized content (10 docs) | 🟡 Partial | `generateBrandVoiceDoc` covers 1 of 10. Missing: launch playbook, NIL deals toolkit, content strategy, growth playbook, brand protection guide, sponsor pitch, email templates, game-day playbook, off-season strategy. |
| 1.5.12 | Admin creations panel | ❌ Missing | |
| 1.5.13 | Vectorizer.ai SVG upgrade | ❌ Missing | No vectorizer integration. Brand kit only ships PNG. |
| 1.5.14 | Brand fonts auto-suggest | ❌ Missing | No `nilbd_font_pairs` analog. No font selection in the kit. |
| 1.5.15 | Brand guide PDF generator | ❌ Missing | No FPDF / PDF-Kit equivalent. |
| 1.5.16 | Color extraction from logo | ❌ Missing | Brand colors come from profile fields only; never extracted from chosen logo. |
| 1.5.17 | Image composite helper | ⏸️ Deferred | `sharp` is in `lib/brand-kit.ts` — capability exists, no named placements API. |
| 1.5.18 | "Brand Lite" upload-your-own | ❌ Missing | No "I already have a logo" path. |
| 1.5.19 | Multi-logo per brand | ❌ Missing | One `final_logo_url` per `brand_designs` row. No `logos[]` array with `active_logo_id` toggle. |

### 2.6 Print Shop + Logo Mod

| # | Feature | Status | Path / notes |
|---|---|---|---|
| 1.6.1 | Print Shop catalog + checkout | ✅ Ported | `app/dashboard/print-shop/` + `_print_logo_mod.sql`. 3 sample products seeded (vinyl banner, 500 business cards, full-color flyers). 8 categories. Stripe-ready. |
| 1.6.2 | Logo Mod request flow | ✅ Ported | `app/dashboard/logo-mod/` (assumed — schema is there at `_print_logo_mod.sql` L 72–100; admin queue at `app/dashboard/admin/logo-mod/page.tsx`). |
| 1.6.3 | Admin print orders queue | ✅ Ported | `app/dashboard/admin/print-shop/page.tsx` — status flow, tracking #, carrier. |
| 1.6.4 | "Modify Logo" entry from brand portal | ❌ Missing | The brand-design Studio doesn't link to Logo Mod. Athletes have to navigate via the dashboard nav. |

### 2.7 Brand Customer Portal

| # | Feature | Status | Path / notes |
|---|---|---|---|
| 1.7.1 | Portal shell (auth-gated) | ✅ Ported (different scope) | `app/brand-portal/page.tsx` is the magic-link portal for external brand customers buying brand packs. NOT the talent's portal — the talent portal IS `app/dashboard/brand-design/[id]/page.tsx`. |
| 1.7.2 | Tab: Design Concepts | ✅ Ported | Studio `[id]/page.tsx` shows concept rounds. |
| 1.7.3 | Tab: Final Logo | 🟡 Partial | Selected logo banner exists with download link. Missing: separate `final_logo_files[]` list with admin-uploaded production deliverables. |
| 1.7.4 | Tab: Brand Toolkit | 🟡 Partial | See 1.5.11. |
| 1.7.5 | Tab: Create | 🟡 Partial | See 1.5.1. |
| 1.7.6 | Tab: Modify Logo | ❌ Missing | No link inside Studio to `/dashboard/logo-mod`. |
| 1.7.7 | Tab: Brand Guide | ❌ Missing | No tab. Kit ZIP includes `README.txt` but no brand-guide PDF, no admin-uploaded `brand_guide_files[]`. |
| 1.7.8 | Tab: My Info | 🟡 Partial | Profile edits live at `app/dashboard/profile/` — not embedded in the Studio. Missing the brand-specific fields: `mascot`, `conference`, `team_colors`, `tagline`, `brand_tone`, `content_style`, `color_mode`, `nil_partners`, `goals`, `target_audience`. |
| 1.7.9 | Tab: Help | ❌ Missing | |
| 1.7.10 | Lightbox + image protection | ❌ Missing | No right-click block / drag block / watermark layer. |
| 1.7.11 | Asset usage meter + buy-more modal | ❌ Missing | |

### 2.8 Admin settings

| # | Feature | Status | Path / notes |
|---|---|---|---|
| 1.8.1 | Settings storage | 🟡 Partial | `branding_settings` table exists (`_branding_settings.sql`) — covers accent/bg/logo but NOT the 4 prompt templates, asset_limit, asset_pack_size/price, Gemini/Vectorizer API keys, login/portal subtitles. Most live in `.env`. |
| 1.8.2 | Save settings AJAX | 🟡 Partial | `app/dashboard/admin/branding/` covers basic theme. |
| 1.8.3 | Test Gemini | ❌ Missing | n/a — Next uses Ideogram + Anthropic; no health-check endpoint. |
| 1.8.4 | Test Stripe | ❌ Missing | |
| 1.8.5 | Test Vectorizer | ❌ Missing | |
| 1.8.6 | Tab: Brands list | ✅ Ported | `app/dashboard/admin/brands/page.tsx` — table with brand_name / owner / status / kit / created. |
| 1.8.7 | Tab: Wizard Form Builder | ❌ Missing | No drag-drop form builder. |
| 1.8.8 | Tab: Distribution | ❌ Missing | No brand-design affiliate / short link / QR tooling. |
| 1.8.9 | Tab: Auth | ✅ Ported | `app/dashboard/admin/users/` + `permissions/`. |
| 1.8.10 | Tab: API keys | 🟡 Partial | Lives in `.env` not in DB; not editable from UI. |
| 1.8.11 | Tab: Branding | 🟡 Partial | `branding_settings` table + admin UI, but only 1 section (not Wizard/Login/Portal split). |
| 1.8.12 | Tab: Payments | 🟡 Partial | `service_pricing` table + `_service_pricing.sql` covers product pricing. Asset pack price not configurable. |
| 1.8.13 | Tab: Prompts | ❌ Missing | Prompts are hardcoded in `lib/ideogram.ts` (`defaultR1Prompt`, `r2RefinePrompt`, `r3FinalizePrompt`). No DB-stored editable templates. |
| 1.8.14 | Tab: Help | ❌ Missing | |
| 1.8.15 | Per-brand card actions (8 buttons) | ❌ Missing | Admin brand list is read-only. No upload-concept, upload-final, upload-guide, reset-selection, send-login, view-creations, delete. |
| 1.8.16 | Submission management | ❌ Missing | No equivalent of failed-conversion review queue. |
| 1.8.17 | DB cleanup (data-URL → file) | ⏸️ Deferred | Next.js never stores data URLs in DB — all images go to Supabase Storage at upload time. Not needed. |
| 1.8.18 | Deal panel section | ⏸️ Deferred | No CRM deal concept. `orders` table is the analog and Admin Orders viewer at `app/dashboard/admin/orders/page.tsx` is the analog. |
| 1.8.19 | Stripe 3-tier key resolution | ⏸️ Deferred | Single Stripe account in `.env`. |

### 2.9 Helper utilities

| # | Function | Status | Path / notes |
|---|---|---|---|
| 1.9.1 | `nil_bd_slug_from_name` | ⏸️ Deferred | UUID PKs used instead. |
| 1.9.2 | `nilbd_save_image_to_uploads` | ✅ Ported | Supabase Storage upload in `lib/brand-kit.ts`, `lib/brand-addons.ts`, `actions.ts saveCanvasOutput`. |
| 1.9.3 | `nilbd_extract_logo_colors` | ❌ Missing | No color extraction from the chosen logo. Profile-supplied colors only. |
| 1.9.4 | `NilPDF` / FPDF brand guide | ❌ Missing | No PDF generator. |
| 1.9.5 | `nilbd_stripe_request` | ✅ Ported | `lib/stripe.ts` + Stripe SDK. |
| 1.9.6 | `nilbd_vectorize_image` | ❌ Missing | No Vectorizer.ai integration. |
| 1.9.7 | `nilbd_composite_logo` | ❌ Missing | `sharp` is in deps, no named-placement composite helper. |
| 1.9.8 | Session store | ⏸️ Deferred | Supabase Auth replaces session token plumbing. |
| 1.9.9 | `nilbd_ai_text` (Gemini text) | ✅ Ported (Anthropic) | `lib/brand-addons.ts` uses Anthropic SDK Claude Sonnet — same role, different provider. |
| 1.9.10 | `nilbd_build_prompts` | 🟡 Partial | `defaultR1Prompt` / `r2RefinePrompt` / `r3FinalizePrompt` exist but skip the per-concept `style_mods[]` rotation and the spelling-enforcement block. |
| 1.9.11 | Brand record defaults | ⏸️ Deferred | Replaced by SQL column defaults + RLS. |
| 1.9.12 | Cache busting | ⏸️ Deferred | n/a — no `wp_cache` in Next. |

---

## 3. Port Priority Matrix

### P0 — Blockers to feature parity (athletes can't get their final logos / assets)

1. **Auto-build kit on final selection** — `selectFinalConcept` in `app/dashboard/brand-design/actions.ts` must call `assembleAndUploadKit` automatically (today it only sets `final_logo_url`; talent must click a second button to even get a kit). Send an email when complete.
2. **Brand kit completeness** — `lib/brand-kit.ts` currently outputs 9 files. Legacy outputs 12+: missing the transparent PNG at 512px, JPG-on-white, raster SVG wrapper, true vector SVG (Vectorizer.ai), typography specimen PNG, brand guide PDF, fonts.txt reference. The current "kit" is not what was sold.
3. **Admin upload pipeline for designer concepts + final files** — Admin Brands page at `app/dashboard/admin/brands/page.tsx` is read-only. Need: upload designer concept, upload final logo file, upload brand guide, reset selection, send-credentials buttons. Backed by a new `brand_design_admin_assets` table.
4. **Spelling-enforcement prompt block** — Add the "M-I-K-E R-A-M-I-R-E-Z" letter-by-letter spelling rule + CRITICAL TEXT ACCURACY block to `defaultR1Prompt` / `r2RefinePrompt` in `lib/ideogram.ts`. Without it Ideogram routinely misspells athlete names.
5. **Color extraction from chosen logo** — Add a `sharp`-based `extractDominantColors()` to `lib/brand-kit.ts` and call it during assembly to seed the README + brand.json colors (today we use profile colors which often disagree with what Ideogram actually rendered).
6. **Final logo banner shows admin-uploaded production files** — Once an admin uploads `final_logo_files[]` (P0 #3), the studio page must list them with download buttons. Today the "Final logo selected" banner only shows the Ideogram PNG. (`app/dashboard/brand-design/[id]/page.tsx` L 159–200.)

### P1 — High-value (Brand Arsenal completeness, print product depth)

7. **Revision flow** — Add `revision_rounds` column (jsonb) or table; UI to request changes with notes; admin uploads revised concepts; first round free, subsequent $10 PaymentIntent. Backed by new `requestRevision` action + admin form.
8. **Per-concept purchase ($15)** — Allow talent to buy any non-selected concept as a second final logo with its own kit. New Stripe checkout → `brand_design_addons.kind='extra_final'` or similar.
9. **Asset credit gate + pack purchase** — Wire `asset_credits_used` / `asset_credits_total` decrement to each addon generation. Add `buyAssetPack` action ($4.99 / 10 credits, configurable).
10. **Vectorizer.ai true-SVG integration** — Add `lib/vectorizer.ts` and call during `assembleBrandKit`. Include the `.svg` (paths) file in the ZIP.
11. **Brand guide PDF generator** — Add `pdfkit` (or `@react-pdf/renderer`) and produce a multi-page PDF: cover, colors, typography, do-don't rules. Include in kit ZIP.
12. **Expand Brand Arsenal categories from 6 → 14** — Add the 8 missing categories to `lib/brand-addons.ts`: `social_template` (per-platform with size grid), `merch_mockup` (Ideogram-generated), `uniforms` (sport-specific 28 sub-types), `business_card`, `zoom_bg`, `phone_wallpaper`, `story_highlights`, `letterhead`, `presentation`, `thank_you_card`, `media_kit`, `logo_on_photo` (user uploads photo + placement picker), `photo` (logo-on-event-photo).
13. **Brand toolkit — remaining 9 docs** — Extend `lib/brand-addons.ts` with `generateLaunchPlaybook`, `generateNilDealsToolkit`, `generateContentStrategy`, `generateGrowthPlaybook`, `generateBrandProtectionGuide`, `generateSponsorPitch`, `generateEmailTemplates`, `generateGameDayPlaybook`, `generateOffSeasonStrategy` — same Anthropic prompt pattern as `generateBrandVoiceDoc`.
14. **Watermark + image protection on Studio tiles** — Overlay `PREVIEW` text on un-selected concepts post-finalization in `[id]/page.tsx` ConceptTile. Add `oncontextmenu` block + `user-select:none` on concept images.
15. **Multi-logo per brand** — Allow a brand to have multiple finalized logos (legacy supports `logos[]` with `active_logo_id`). Schema: rename or split off `final_logo_url` → new `brand_design_logos` table; each row owns its own asset history.

### P2 — Nice-to-have (font auto-suggest, mood board, brand-lite)

16. **Font pairing auto-suggest** — Port `nilbd_font_pairs()` (10 vibes) and inclusion in kit (`fonts.txt` + Google Fonts URL + typography specimen PNG).
17. **R1 refinement notes box** — Free-form `<textarea>` between R1 shortlist and R2 refine. Pipes into `r2RefinePrompt` as appended context.
18. **"Brand Lite" upload-your-own-logo path** — Lets talent who already have a logo skip generation and go straight to kit assembly + asset generator.
19. **Editable prompt templates in admin** — Mirror the 1.8.13 Prompts tab. New `brand_design_prompts` table + admin form.
20. **Admin AI Refine panel** — On Admin Brands detail page, button to spawn 6 variations of any brand's selected logo in one of 6 style buckets (mixed/minimal/bold/luxury/modern/vintage). Backed by `refineRound` w/ admin-only RLS bypass.
21. **DB cleanup utility** — ⏸️ Deferred (not needed in Next).
22. **Tab: Help (admin)** — 12-section in-app guide. Low-priority since onboarding docs live elsewhere.
23. **Affiliate + short link + QR for brand-design specifically** — Site-wide affiliate already exists; brand-design intake doesn't reuse it.

### Deferred (different infra by design)

- Per-plugin auth (`nil_bd_auth` + cookie token) → Supabase Auth.
- CORS for cross-WP-site embed → Next is the canonical host.
- WP cache busting → not needed.
- CRM deal panel section / `nil_crm_intake_after_submit` hook → replaced by `orders` table + `lib/provisioning.ts`.
- Stripe 3-tier key waterfall → single `.env`-scoped Stripe.
- Storing base64 data URLs in DB → never done in Next (all uploads via Supabase Storage immediately).
- Public `/brand-design` cold-funnel wizard → marketing site + checkout already cover the "convert and pay" flow; talent always pays before generating.

---

## 4. Concrete Next Steps

In dependency order. Each is sized for a single focused work session.

1. **Add spelling-enforcement + per-concept style-mod blocks to prompts** — Update `lib/ideogram.ts` `defaultR1Prompt` to take a `conceptIndex` and rotate through `['minimalist clean lines geometric sans-serif typography', 'bold high contrast dynamic angles athletic energy', 'luxury premium finish refined gold accents', 'futuristic tech-forward gradient sleek', 'dynamic motion-inspired action lines explosive power', 'classic timeless traditional crest heritage feel']`. Add the letter-by-letter `name.split('').join('-')` block. Re-add `r1Prompt` arg to the `generateConcepts` action. **Budget: 2h.** Files: `lib/ideogram.ts`, `app/dashboard/brand-design/actions.ts`.

2. **Auto-build kit on `selectFinalConcept` + send email** — In `app/dashboard/brand-design/actions.ts`, after `selectFinalConcept` updates the row, call `assembleAndUploadKit` server-side and `lib/emails/brand-kit-ready.ts` via Resend. Add `brand_kit_ready_at` timestamp column (`supabase/migrations/2026XX_brand_kit_ready.sql`). **Budget: 3h.**

3. **Beef up `assembleBrandKit` to legacy parity** — In `lib/brand-kit.ts`: add transparent-512 PNG, JPG-on-white, raster-SVG wrapper, fonts.txt (via new `lib/font-pairs.ts` with 10 vibe pairs), typography specimen PNG (via `sharp.text()` or pre-rendered via Anthropic). Defer true SVG to step 6. **Budget: 4h.**

4. **Color extraction from final logo** — Add `extractDominantColors(buffer: Buffer, n: number)` to `lib/brand-kit.ts` using `sharp.raw()` + a tiny k-means. Call during assembly; write into `brand_designs.extracted_colors` (new jsonb column). Use in brand.json / README. **Budget: 2h.**

5. **Admin upload pipeline (designer concepts + final files + brand guide)** — New migration `2026XX_brand_design_admin_assets.sql` with `brand_design_admin_assets` table (`brand_design_id`, `kind` enum: `designer_concept` | `final_file` | `brand_guide`, `url`, `label`, `uploaded_by`). New admin page `app/dashboard/admin/brands/[id]/page.tsx` with 4 upload forms (concept, final, guide, reset-selection) + send-login button + view-creations. Show `designer_concept` rows in the talent's Studio. **Budget: 5h.**

6. **Vectorizer.ai integration** — Add `lib/vectorizer.ts` with `vectorizeImageUrl(url)`. Env: `VECTORIZER_API_ID`, `VECTORIZER_API_SECRET`. Add `.svg` (true paths) to the kit ZIP. Catch + skip silently if not configured. **Budget: 2h.**

7. **Brand guide PDF generator** — Install `pdf-lib` or `@react-pdf/renderer`. Add `lib/brand-guide-pdf.ts` with 4-page output (cover, color palette, typography, do/don't). Include in kit ZIP. **Budget: 4h.**

8. **Expand `AddonsSection` from 6 → 14 categories** — Add UI cards for the 8 missing categories. Add server-side generators in `lib/brand-addons.ts` (mostly Anthropic-image-edit calls — see legacy L 3505–3804 for the prompt patterns). Plumb `asset_credits_used` decrement. Add `buyAssetPack` Stripe checkout. **Budget: 6h.** (Could split into 2 chapters: categories 1-7 then 8-14.)

**Total budget for parity-blocking work (1–5): ~16h.** Steps 6–8 add another ~12h. After step 8, the Studio + Brand Arsenal hit functional parity with the legacy module; outstanding P1 items (revision flow, multi-logo, watermark protection) and all P2 items (admin AI Refine, brand-lite, editable prompts, font auto-suggest UI) sit on top of that foundation.
