# Legacy Site Captures — theedgezone.com

Captured 2026-06-11 by walking the live site as `mike@niliance.com` (talent + admin role).

## URL pattern

All pages route through one shortcode: `https://theedgezone.com/?ez_view=<view>[&...params]`. Admin sub-tabs use `?ez_view=admin&tab=<tab>`.

## Top navigation (role-aware)

Captured for talent+admin user. URLs:

| Label | URL |
|---|---|
| Home / Dashboard | `?ez_view=home` (also `?ez_view=dashboard`) |
| Services | `?ez_view=directory&type=talent` (also `&type=brand`) |
| Opportunities | `?ez_view=opportunities` |
| NILiance for Talent | `?ez_view=niliance_for_talents` |
| Talent Directory | `?ez_view=talents` |
| My Postings | `?ez_view=my_opportunities` |
| NILiance for Brands | `?ez_view=niliance_for_brands` |
| Free Roadmap | `?ez_view=roadmap` |
| Free Resources | `?ez_view=resources` |
| Admin | `?ez_view=admin` |
| My Account ▾ | dropdown → `?ez_view=dashboard`, `?ez_view=profile`, more |

External: **NILiance marketplace** lives at `https://niliance-o0nl.onrender.com/` (Sharetribe app).

## Branding (from Admin → Platform)

- Site name: "The Edge Zone"
- Tagline: "Elevate Your Game"
- Primary color: **#C8A84E** (brighter gold than my current #ac8d3b — needs update)
- Secondary color: #000000
- Accent color: #FFFFFF

---

## HOME (talent dashboard view) — `?ez_view=home`

NILiance ready banner (dismissible):
> YOUR NILIANCE ACCOUNT IS READY
> When you joined The Edge Zone, we automatically set you up on NILiance — our NIL Innovations Marketplace. No separate signup needed.
> Log in there with the same email `<user>@niliance.com` and Edge Zone password.
> [LOG IN TO NILIANCE →] [WHAT CAN I DO THERE?]

MY DASHBOARD section:
- "Welcome back, <name>" + TALENT badge
- MY PROFILE button
- Complete your profile (X%) + UPDATE PROFILE button + tip card

NIL Readiness card:
- Score: **87/100** with letter grade **A**
- "What's this?" expandable

Stat tiles row:
- **PRODUCTS** (8 +2 SUB)
- **PROFILE** (62%)
- **POINTS** (3,374)
- **GOALS** (2/7 — 29% ACHIEVED)

Dashboard tabs (in-page tabs, not separate routes):
`Services | Roadmap | Resources | Profile | My Products | Goals | Points | Orders | For You | Account | Support | Insights`

"My Products" tab content — list of purchased services with status:
- Merch Store Onetime — READY — Purchased Jun 2, 2026 — *Managed by our team*
- Online Store / Merch Onetime — READY — Jun 2, 2026 — VIEW STORE / EDIT STORE
- Personal Brand Design Onetime — **ACTIVE** — May 16, 2026 — DESIGN STUDIO
- Talent Podcast Monthly — READY — Apr 17, 2026 — OPEN PODCAST STUDIO
- Custom Mobile App Onetime — READY — Apr 13, 2026 — VIEW APP / EDIT APP
- Electronic Press Kit Monthly — READY — Apr 10, 2026 — VIEW EPK / EDIT EPK
- Personal Website Monthly — READY — Apr 7, 2026 — VIEW SITE / EDIT SITE
- Several **PROVISIONING…** items (in-flight)

Statuses observed: `READY`, `ACTIVE`, `PROVISIONING...` plus a special *Managed by our team*.

---

## OPPORTUNITIES — `?ez_view=opportunities`

Title: "Opportunities — Brand campaigns, paid appearances, and gigs available right now."

Filter chips: `All categories | Campaigns | Single Jobs | Bulk Jobs | Subscription Boxes | Perks | Rewards & Coupons`

Search input. Initial state: "Searching…" (loads async).

Backend categories observed (from NILiance log): `talent, campaign, fan, brandreward, brand, brandperks, agency, brandbulkjobpost, brandsinglejobpost, schoolreward, agencycampaign, brandcampaign, schoolbulkjobpost, schoolsinglejobpost, schoolperks, schoolcampaign, perks, school`

Canonical buckets: `reward, perk, bulk_job, single_job, campaign`

Author types: `brand, fan, talent, agency, school, admin`

---

## NILIANCE FOR TALENT — `?ez_view=niliance_for_talents`

Title: "NILiance for Talent"
Tagline: "Monetize your name, image, and likeness on the leading NIL marketplace."

CTAs: `UPDATE YOUR NILIANCE PROFILE` / `BROWSE OPPORTUNITIES`

8 feature cards (icon + title + body):
1. **Sell Signature Offerings** — Set up your storefront for autographs, shoutouts, appearances, social media posts, and creative content. Set your own price; brands and fans buy directly.
2. **Get Discovered by Brands** — Brands search NILiance for talent by sport, conference, division, location, audience size, and more. A complete profile gets you found.
3. **Receive Brand Campaign Offers** — Brands post sponsorship and endorsement opportunities targeted to athletes like you. Browse and apply to ones that fit.
4. **Trading Cards & Talent Plus** — Unlock premium features — custom trading cards, exclusive content, subscription revenue from your fans, and priority placement.
5. **Connect with Agencies & Affiliations** — Link to your agency, school, conference, and other organizations. Show off your full credentialing.
6. **Direct Messaging** — Chat directly with brands, agencies, and fans through the in-marketplace messenger. Convert inquiries into deals.
7. **Unlockable Content** — Gate behind-the-scenes photos, videos, and posts for paying subscribers. New revenue stream that pays you for your time anyway.
8. **Earnings & Analytics** — Track every transaction, message, and follower in one dashboard. Get paid via Stripe Connect with same-week payouts.

"Ready to get started?" — Head over to NILiance to finish your profile, post offerings, and start earning. Your account is already set up — just log in with your Edge Zone email and password. `[UPDATE YOUR NILIANCE PROFILE →]`

---

## NILIANCE FOR BRANDS — `?ez_view=niliance_for_brands`

Title: "NILiance for Brands"
Tagline: "Find, book, and activate authentic athletes — campaigns to autographs, all in one place."

CTAs: `UPDATE YOUR NILIANCE BRAND PROFILE` / `POST YOUR FIRST OPPORTUNITY`

8 feature cards:
1. **Search the Talent Roster** — Filter thousands of verified athletes by sport, conference, division, location, audience size, and ethnicity to find your perfect match.
2. **Post Brand Opportunities** — Publish campaigns, appearances, and content briefs. Talent applies; you select. Built-in escrow protects both sides.
3. **Book Signature Services** — Order autographs, personalized shoutouts, social media posts, and appearances directly from athletes' storefronts.
4. **Commission Creative Content** — Get custom video, photo, voiceover, and podcast content created by the athlete themselves. UGC at scale.
5. **Enhanced Services** — Sign athletes for mentorship, training, business development, and ambassador-level deals. Long-term relationships, not one-offs.
6. **Campaign Analytics** — Track reach, engagement, and ROI on every athlete activation. See what works and double down.
7. **Direct Talent Communication** — Message athletes directly, negotiate terms, share assets — everything in one thread per athlete.
8. **Compliance & Verification** — Every athlete is verified — eligibility, school compliance, and NIL clearances handled before they're on the platform.

---

## TALENT DIRECTORY — `?ez_view=talents`

Title: "Talent Directory — Browse N public talent profiles."

Filters: `All sports | Basketball | Football` (dynamic per actual sports present)

Search input.

Talent cards shown:
- Mike Ball — Basketball — Rutgers Scarlet Knights
- Mike Ramirez — Football — Ohio State

---

## MY POSTINGS — `?ez_view=my_opportunities`

Title: "My Opportunities" + `+ NEW OPPORTUNITY` button.

Empty state for unlinked user:
> Connect your NILiance account from your profile to manage opportunities.

---

## PROFILE — `?ez_view=profile`

Title: "Your Profile — Talent · Edit your details below — changes sync to NILiance automatically"

Back link: `← DASHBOARD`

Progress card:
- Big "65% PROFILE COMPLETE" + TALENT badge
- Readiness chips: "Ready for Brand Design", "Ready for EPK", "Ready for Website"

Section tabs with per-section completion %:
`BASICS (83%) | ATHLETIC (100%) | BRAND (100%) | STORY (100%) | SOCIAL (50%) | CONTACTS | GOALS`

BASICS form fields:
- Profile Photo (clickable)
- Full Name *
- Email *
- Phone
- Street Address
- City
- State (dropdown — all 50 + DC)
- Website URL
- Weight (lbs)
- Hometown
- Height (ft 4-7, in 0-11 dropdowns)
- [SAVE PROFILE]

NILiance section:
- "Connect to manage opportunities, get paid through NILiance, and have your profile data sync automatically."
- `[CONNECT]` button
- "Don't have an account? Sign up at NILiance — we'll auto-create one when you save your profile."

Public Profile section:
- "Share a clean public page that aggregates your Edge Zone profile and your NILiance offerings. Off by default — turn it on when you're ready to be discoverable."
- Toggle: MAKE MY PROFILE PUBLICLY VISIBLE
- SLUG: `https://theedgezone.com/talent/<slug>`
- Buttons: [SAVE] [PREVIEW] [COPY LINK]

(Other section tabs need separate capture — ATHLETIC, BRAND, STORY, SOCIAL, CONTACTS, GOALS.)

---

## SERVICES (directory) — `?ez_view=directory&type=talent`

Hero: "YOUR EDGE STARTS HERE." / "70+ tools, services, and programs designed to build, grow, and dominate the NIL landscape."

Stats: `5 SERVICES | 5 SATELLITES | 310 USERS SERVED | 10% % SATISFACTION` (live values vs the public marketing numbers I had previously)

NIL Innovations callout box (gold border) — same as marketing pages.

Audience filters: `ALL SERVICES | FOR TALENT | FOR BRANDS`

Categories: 9 buckets (all match what's in my current code, plus **HEALTH & WELLNESS** which I had captured).

**Guided Paths — total 10 (I only had 5):**
1. Get Your First Brand Deal — 4 services
2. Build Your Brand Empire — 5 services
3. Make Money While You Sleep — 4 services
4. Protect Your Future — 5 services
5. Level Up Your Game — 4 services
6. **Go Digital** — 4 services *(missing from my data)*
7. **Create Content Like a Pro** — 4 services *(missing)*
8. **Life After Sports** — 5 services *(missing)*
9. **Get Financially Smart** — 5 services *(missing)*
10. **Legal Protection 101** — 4 services *(missing)*

**Services I'm missing (in addition to my current 35):**
- Performance Nutrition — $199 — HEALTH & WELLNESS, talent, expert team
- Healthcare & Wellness — Free/Custom — HEALTH & WELLNESS, talent, expert team
- Performance Improvement — Free/Custom — HEALTH & WELLNESS, talent, expert team

**Brand-specific services (from CRM mapping in Integrations tab):**
- Graphic Design Services (Brand)
- Digital Design Packs (Brand)
- Reputation & Reviews (Brand)
- Listings Management (Brand)
- Affiliate Marketing (Brand)
- Market Research (Brand)
- Investor Assistance (Brand)
- 3D Replica Event Truck (Brand)
- Philanthropic Support (Brand)
- Financial Wellness (Employees)
- Legal Support (Employees)
- Identity Theft Protection (Employees)
- Data Removal (Employees)
- Tax Services (Employees)
- Insurance Services (Employees)
- Legal Document Creation (Employees)

**Pricing observed (some need updating):**
- Personal Website: $29/mo
- Electronic Press Kit: $9.99/mo
- Custom Mobile App: $499
- Digital Business Cards: $49
- Talent Podcast: $49/mo
- Online Store / Merch: $99
- Personal Brand Design: **$150** *(I had $199 — wrong)*
- Brand Lite: $49
- Social Media Growth: $299/mo
- Social Media Management: $499/mo
- PPC & SEO Marketing: **$399/mo** *(I had $799 — wrong)*
- Press & Media Services: $199
- Tax Services: $249
- Bookkeeping: $149/mo
- Trademark: $349
- Data Removal: $99/mo
- Identity Theft Protection: $149/mo
- Resume Building: $99
- Interview Prep: $149
- Business Formation: $249
- Prep For NIL Academy: **$9/mo** *(I had $49 — wrong)*
- Legal Document Creation: $149

---

## ADMIN — `?ez_view=admin`

5 groups, 22 sub-tabs total:

**PLATFORM MANAGEMENT**
- Platform — `?ez_view=admin&tab=settings`
- Integrations — `?ez_view=admin&tab=integrations`
- NILiance — `?ez_view=admin&tab=niliance`
- Pricing — `?ez_view=admin&tab=pricing`
- Enrollment — `?ez_view=admin&tab=enrollment`
- App Defaults — `?ez_view=admin&tab=app_defaults`

**CONTENT & PAGES**
- Pages — `?ez_view=admin&tab=pages`
- Resources — `?ez_view=admin&tab=resources`
- Roadmap Builder — `?ez_view=admin&tab=roadmap`
- Climb Studio — `?ez_view=admin&tab=climb`

**PRODUCTS & ORDERS**
- Orders — `?ez_view=admin&tab=orders`
- Payouts — `?ez_view=admin&tab=payouts`
- Brand Designs — `?ez_view=admin&tab=brands`
- Websites — `?ez_view=admin&tab=websites`
- EPKs — `?ez_view=admin&tab=epks`
- Apps — `?ez_view=admin&tab=apps`
- Podcasts — `?ez_view=admin&tab=podcasts`
- Stores — `?ez_view=admin&tab=stores`

**USERS & ACCESS**
- Users — `?ez_view=admin&tab=users`
- Permissions — `?ez_view=admin&tab=permissions`

**ENGAGEMENT**
- Rewards Store — `?ez_view=admin&tab=rewards`
- Tickets — `?ez_view=admin&tab=tickets`

### ADMIN → Platform (`tab=settings`)

Section: Registration & Access
- SITE NAME (text)
- TAGLINE (text)
- LOGO URL (text)
- PRIMARY COLOR (HEX) — #C8A84E
- SECONDARY COLOR — #000000
- ACCENT COLOR — #FFFFFF
- REGISTRATION — Enabled / Disabled
- MAINTENANCE MODE — Off / On (Admin Only)
- DEFAULT LANDING PAGE — Home / Where To Start / Roadmap
- SUPPORT EMAIL (text)

Section: SEO & Social
- META TITLE
- META DESCRIPTION
- OG IMAGE URL
- GOOGLE ANALYTICS ID

`[SAVE PLATFORM SETTINGS]`

### ADMIN → Integrations (`tab=integrations`)

Top filter tabs: `All | Payments | AI & Generation | Data & CRM | Infrastructure`

**Stripe Payments** — mode toggle (Test / Live) — Test/Live Publishable Key, Secret Key, Webhook Secret.

**PayPal Payouts** — used to pay talent earnings. Mode (Sandbox/Live), Client ID, Secret, Platform Fee %.

**Smart Engine** — Claude API key, Gemini API key.

**Image Generation (Climb)** — OpenAI DALL-E 3 (best) → Replicate Flux → Unsplash fallback chain.

**Ideogram v3** — API key for brand-design logo generation.

**Phyllo (Social Data Import)** — Client ID, Secret.

**Vectorizer.ai** — API ID, API Secret. Converts raster PNGs to true SVG vectors.

**Google Drive (Asset Storage)** — Enable toggle, Shared Drive ID, Service Account email, Service Account private key.

**Logo Generation Prompts** — Round 1 / Round 2 / Round 3 templates (Gemini-style). Variables: `{name}, {sport}, {concept_style}, {initials}, {colors}, {jersey_number}, {bg_desc}`.

**Ideogram Prompt Templates** (overrides) — same idea, Ideogram-flavored. Variables: `{name}, {name_upper}, {sport}, {position}, {number}, {initials}, {concept_style}, {primary}, {secondary}, {bg_desc}`.

**CRM Connection** — REST URL, API key, Auto-create deal on purchase toggle, Legacy AJAX URL, Test connection.

**Namecheap Domain Reseller** — API user, API key, Username, Whitelisted Client IP, Mode (Sandbox/Production), Domain Markup %, Server Public IP. For talent to buy custom domains.

**Subdomain Routing (Talent Websites)** — Subdomain Domain (e.g. mytalentsite.com), cPanel username, API token, hostname.

**Subdomain Routing (EPK)** — same setup for talentepk.com wildcard.

**OneSource / PromoStandards** — 500+ promo product suppliers. Used by Brand Design Studio for Promo Items + Print Items tabs.

**Service → CRM Program Mapping** table — 38 talent services + 33 brand services, each mapped to a CRM Program name.

### ADMIN → NILiance (`tab=niliance`)

Toggle: ACTIVE ENVIRONMENT (Production / **Staging**). Switching clears cached tokens.

**Backend choice**: Sharetribe Integration API (Path A) **active** / NILiance Wrapper (Path B — future, requires service token).

**Sharetribe Integration API** — Client ID, Client Secret, API base, Marketplace ID.

**Sharetribe Marketplace API** (Path B for user create — Integration API can't):
- Note: "Create a second Sharetribe app: Build → Applications → Add new → Marketplace API (mark as trusted client)."
- MP Client ID, MP Client Secret, Token Scope (user / trusted:user)
- "Send password-reset email after background-created accounts (random password)"

**Sync behavior** — Auto-create NILiance account on Edge Zone signup, Poll NILiance for inbound profile changes (interval in min, batch size).

**Field sync** — Social handles, School/college, Sport/position.

Buttons: SAVE, TEST CONNECTION, INSTALL CRON, FLUSH PERMALINKS, RUN POLL.

**Public talent profiles** — Shortcode page slug, NILiance listing URL template, NILiance profile URL template. Variables: `{id}, {slug}, {uuid}`. Used by "Book on NILiance" and "View Full Profile on NILiance" CTAs.

**Staging credentials** — separate set for staging env.

**Sync dashboard**:
- N linked users / N in error counter
- "Recent events" log (timestamps + info-level Sharetribe sync messages)
- "User sync status" table — Email | Status (linked / error: …) | UUID | Last sync | RETRY / INSPECT / WIPE+RESYNC / RE-LINK actions

(Other admin tabs not yet captured: Pricing, Enrollment, App Defaults, Pages, Resources, Roadmap Builder, Climb Studio, Orders, Payouts, Brand Designs, Websites, EPKs, Apps, Podcasts, Stores, Users, Permissions, Rewards Store, Tickets.)

---

## Sharetribe NILiance integration — observed sync data

Inbound profile sync pulls **105+ field keys** per user from Sharetribe. Sample fields from user 52 (Mike Ball, basketball at Rutgers):

`associatedListingCategory, associatedListingId, ethnicity, favorites, gender, hometown, isTalentPlus, job_title, shirt_size, subscriptionType, userType, username, addressLine2, agencyName, associatedUsers, city, contactJobTitle, listingCategory, listingType, location, state, title, transactionProcessAlias, unitType, zipCode, affiliatedOrganizations, affiliations, age, agency_name, appearances, appearancesSubTypes, autographs, autographsSubTypes, conference, creativeMedia, creativeMediaSubTypes, currentCity, currentState, customInterests, customLinks, customTeam-*, dateOfBirth, division, endorsements, endorsementsSubTypes, enhancedServicesSubTypes, isAppearance, isAutograph, isCreativeMedia, isEndorsed, isEnhancedServices, isShoutout, isSignatureServices, isTalentPlusServices, position-*, positions, profileDetails, profileImage, profileVideos, pub_agency, pub_agency_custom, pub_current_town, pub_ethnicity, pub_gender, pub_height, pub_hometown, pub_interest, pub_jersey_number, pub_school_or_group_name, pub_shirt_size, pub_sports, pub_state, pub_talent_level, pub_talent_type, pub_weight, qASessions, qASessionsPrice, school, schoolDisplayName, selectedSport-*, shoutouts, shoutoutsSubTypes, talentPlus, team-*, totalFollowers, tradingCardImage, university, unlockableContent, unlockablePhotos, unlockablePosts, unlockableTypes, unlockableVideos`

This is the full domain model on the NILiance side. Edge Zone is the entry point but most data lives in NILiance/Sharetribe.

**Signature offerings sub-types** (from observed user data):
- **Appearances** — Autograph Session, etc. (18 sub-types observed)
- **Autographs** — Custom Talent Provided, Game Worn Jersey, etc. (5-6 sub-types)
- **Creative Media** — Audio Creation, etc. (11 sub-types)
- **Endorsements** — by platform (Facebook, etc.) × type (Post, etc.) (27 combinations)
- **Shoutouts** — Custom + 11 sub-types
- **Talent Plus** — Unlockable Content (Direct Message etc.) (14 sub-types)
- **Enhanced Services** — Direct Message etc. (14 sub-types)

**Sport-position fields** (one position field per sport):
`position-3-on-3-basketball, position-archery, position-bmx, position-mens-baseball, position-mens-basketball, position-mens-cross-country, position-mens-fencing, position-mens-football, ...`

---

### ADMIN → Pricing (`tab=pricing`)

Title: "Service Pricing & Tiers" + `[SAVE ALL PRICING]`.

Grouped sections (each row = service with Monthly / Yearly / One-time inputs + `+ TIERS` for Basic/Pro/Premium packages):
- Digital Presence: 5 services
- Revenue & Monetization: 4 (incl. Affiliate Marketing brand-side)
- Brand & Design: 4 (incl. Graphic Design Services, Digital Design Packs)
- Events & Physical: 3 (incl. 3D Replica Event Truck)
- Marketing & Growth: 8 (incl. Reputation & Reviews, Listings Management, Market Research, Philanthropic Support)
- Professional Services: 11
- Education & Development: 3
- Career Readiness: 6
- Health & Wellness: 3
- **Employee Benefits**: 7 (Financial Wellness, Legal Support, Identity Theft Protection, Data Removal, Tax Services, Insurance Services, Legal Document Creation — all (Employees) variants)

**Brand Design Pricing section** (separate sub-block) — overrides for the design module:
- FREE ASSET LIMIT
- ASSET PACK SIZE
- ASSET PACK PRICE ($)
- REVISION PRICE ($)
- CUSTOM GRAPHIC PRICE ($)
- LOGO MODIFICATION PRICE ($)
- ADDITIONAL LOGO DESIGN ($) — *"50% OFF"* note
- CONCEPT LOGO PRICE ($)
- EXTRA CONCEPT BATCH ($) PER 10 — *"AFTER FIRST 20 FREE"*

### ADMIN → Enrollment (`tab=enrollment`)

**Bulk Enrollment — CSV Upload**: columns `name, email, sport, school, programs` (programs comma-separated like `"brand-lite, personal-website"`). `[PREVIEW CSV]`.

**Manual Enrollment**: form with Name, Email, Sport, School, Programs (multi-select including "Brand Design ($299)", "Brand Lite ($49)", "Personal Website", "Electronic Press Kit"). `[ENROLL USER]`.

**Email Outreach**: CSV recipient list (or "USE ALL ENROLLED USERS"), subject, body with template variables `{NAME} {EMAIL} {PROGRAMS} {LOGIN_URL} {SCHOOL}`. `[SAVE TEMPLATE]` `[SEND TO LIST]`.

### ADMIN → App Defaults (`tab=app_defaults`)

Section: **Default Links for All Apps** — table (Title, URL, Icon, Position: Nav Grid / Links Screen / Footer) + `+ ADD LINK`. Talent can override per-app.

Section: **Ad Placements** — four placement types, each with Enabled toggle + Image URL + Click URL + Label:
- Splash Banner
- Footer Banner (persistent footer; hidden on splash if nav hidden)
- In-Feed Ad — with FREQUENCY (every N items)
- Interstitial (between screen navs)

Section: **Merch Defaults**
- AUTO-ENROLL NEW APPS IN EDGE ZONE MERCH (Yes/No)
- SHOW PLATFORM MERCH IN TALENT SHOP SCREENS (Yes/No)
- REVENUE SHARE — TALENT % (platform receives remainder)

`[SAVE APP DEFAULTS]`

### ADMIN → Pages (`tab=pages`)

Big table: `Title | URL/Slug | Source | Status | Updated | Actions (EDIT)`.

**Source types**: `Marketplace` (the 50+ service detail pages at `?ez_view=service&slug=...`), `Ez_view` (the shortcode views — home, directory, where_to_start, roadmap, login, register), and `Wordpress` (legacy WP pages — many program flyers, registration pages, etc.).

Captured **service slugs** (all 53 marketplace services, useful for the new routing):
`personal-website, electronic-press-kit, create-a-mobile-app, create-an-online-store, digital-business-cards, start-a-podcast, personal-brand-design, brand-lite, graphic-design, custom-design-packs, promotional-items, print-products, social-media-growth, social-media-management, ppc-seo-marketing, press-media, reputation-review, listings-management, affiliate-marketing, affiliate-opportunities, tiktok-monetization, market-research, investor-assistance, financial-advisory, legal-support, legal-document-creation, insurance-services, tax-services, bookkeeping, trademark-registration, data-removal, identity-theft-protection, prep-for-nil-academy, resume-building, interview-prep, business-formation, student-loan-refinance, performance-nutrition, healthcare-wellness, performance-improvement, financial-wellness, 3d-replica-events, nil-conferences, philanthropic-support, financial-wellness-employees, legal-support-employees, identity-theft-employees, data-removal-employees, tax-services-employees, insurance-employees, legal-docs-employees, admissions-academic, job-search-suite, internship-mentorship`

### ADMIN → Resources (`tab=resources`)

**WPDM (WordPress Download Manager Pro)** integration with category→audience mapping. Each WPDM category gets assigned to: Everyone / Talent Only / Brands Only.

Categories observed (26 entries — some doubled because of WP cat duplication):
Advertising (3), Artificial Intelligence (3), Brand Program Flyers (29), Branding (3+1), Business Operations (4), Content Creation (3), E-Commerce (3), Entrepreneurship (3), Financial (4+4), Leadership (1+3), Marketing (1+5), Mental Wellness (1), Motivation (1), NIL Resources (6+2), Personal Development (3+3), Program Flyers (37), Sales (3), Social Media (4+1), Talent (0).

Plus **Manual Resources** — admin can add resources that bypass WPDM. `+ ADD RESOURCE`.

### ADMIN → Roadmap Builder (`tab=roadmap`)

**Goal-based items config**. 16 goals (matches the priority list in the public Roadmap quiz). Each has a count of items shown when user selects that goal.

Goals + item counts:
- Learn about NIL (4)
- Grow my following (6)
- Sell products / merchandise (4)
- Establish a digital identity (6)
- Prepare for an NIL deal (6)
- Enhance athletic performance (3)
- Protect my NIL (6)
- Financial guidance (6)
- Sound mental & physical health (3)
- Enhance NIL on a budget (6)
- Attract brand partnerships (6)
- Build a personal brand (6)
- Create content for social media (5)
- Help with contract negotiation (4)
- Prepare for life after sports (6)
- Network with other talent (5)

Per-goal editor: GOAL LABEL + `+ ADD ITEM` + delete (×) per item. `[SAVE GOAL CONFIG]`.

### ADMIN → Climb Studio (`tab=climb`)

Title: "Climb Studio — Configure the public Path-to-the-Summit climb — narrator videos, hero images, analytics, and the marketing reel."

Sub-tabs: `HEYGEN CONFIG | NARRATION | HERO IMAGES | SLIDES | PLATFORM REEL | ANALYTICS`

**HeyGen Narrator Config** sub-tab content:
- "Configured (database)" status
- API CREDENTIALS section: HEYGEN API KEY field + `[Test key]` button (note: "Stored encrypted in wp_options; never echoed back to the page.")
- DEFAULT AVATAR: "Selected: Violante Sport Front 2 · Violante_Sport_Front_2_public" + `Sync avatars from HeyGen`
- DEFAULT VOICE: "Selected: Pro 40s Anchor" + `Sync voices from HeyGen`
- `Save HeyGen Config`

### ADMIN → Orders (`tab=orders`)

Sort: Newest First / Oldest First / Highest $ / Lowest $.

Columns: `Img | ID | Product | Customer | Plan | Amount | Status | Date | Actions`.

Sample rows (14 total observed):
- #11519 Personal Brand Design — Mike Ball <mikeball@yopmail.com> — Onetime — $150.00 — Active + CRM ✓ — 2026-06-11 12:04:48 — DEL
- #11493 Ultimate Snapback Hat SKU: #S122DR — Mike Ramirez — Onetime — $99.99 — Paid — 2026-04-13 — DEL (this is a physical merch order, no CRM)
- #11509 Start A Podcast — Monthly $49.00 — Active + CRM ✓

Status values observed: `Active`, `Paid`. CRM checkmark appears on services (provisioned), not physical merch.

### ADMIN → Payouts (`tab=payouts`)

Title: "Talent Payouts — Talent earn from tips, merch, shoutouts & memberships. **Platform fee: 15%**."

Four KPI tiles:
- Gross Revenue
- Platform Earned
- Owed to Talent
- Total Paid Out

Outstanding balances table: `Talent | Gross | We Earned | Owed | Paid Out | Txns | Method | Action`.

**Revenue Report** sub-section: date range filter + `[FILTER]` `[RESET]` `[EXPORT CSV]`, plus Period summary (Revenue / We Earned / Paid to Talent / Transactions) and transaction-level table.

### ADMIN → Brand Designs (`tab=brands`)

Card grid of brand designs. Each card shows:
- Athlete name + email
- Status badge: `COMPLETED` / `DRAFT`
- Progress: `R1: 10`, `R2: 12` (concepts generated per round), `Kit: 15 files`
- Created date
- Credits: `Asset Credits: 3 / 10 used`, `Logo Concept Credits: 0`
- Actions row: `OPEN STUDIO | PREVIEW | ASSET CREDITS | LOGO CREDITS | BUILD KIT | RESET | REGENERATE | DELETE`
- Also: nested completed-brand section "Mike Ball / ACTIVE / Reset / Build Kit / Regen" (one logo can be active, marked Completed, with operations)

### ADMIN → Websites (`tab=websites`)

Simple list. Each row: athlete name, email, status (`Live • <slug>` or `Draft`), `EDIT | DELETE`.

### ADMIN → EPKs (`tab=epks`)

Simple list — same shape as Websites.

### ADMIN → Apps (`tab=apps`)

Title: "Mobile Apps" + KPI tiles: `6 TOTAL APPS | 0 PUBLISHED | 6 DRAFT | $49,900 REVENUE`.

Sub-tabs: `ALL APPS | ADS & DEFAULTS | ORDERS`.

Each app card: athlete name, email, `● Draft`, `5 screens` (or 7), slug (mike-ramirez, mike-ramirez-2, etc.), actions `EDIT | VIEW APP | DELETE`.

### ADMIN → Podcasts (`tab=podcasts`)

Each podcast: title, owner email, status (`● Live`), episode count, actions `EDIT | PREVIEW | RSS | DELETE`.

**Podcast Module Settings** section (platform-wide):
- DEFAULT APPLE CONNECT EMAIL
- MEGAPHONE API KEY (DAI — PHASE 2)
- ART19 API KEY (DAI — PHASE 2)
- TRANSCRIPT PROVIDER (Whisper / Gemini / Deepgram — PHASE 2)
- `[SAVE SETTINGS]`

### ADMIN → Stores (`tab=stores`)

Title: "NIL Stores" + KPI tiles: `2 TOTAL STORES | 0 PUBLISHED | 2 ORDERS | $0 REVENUE`.

Sub-tabs: `ALL STORES | PLATFORM DEFAULTS | APPROVED PRODUCTS | SUPPLIERS | FULFILLMENT CONFIG | ORDERS`.

**Platform Default Commission to Talent** input — "Applied to new stores. Each store can be overridden below. % of net margin (gross − supplier − shipping) paid to talent."

Each store card: athlete name's "Shop", email, `● Draft`, product count, commission % override, actions `SAVE | EDIT | VIEW STORE | LOGO CREDITS | RESET DESIGN STUDIO`.

### ADMIN → Users (`tab=users`)

Filter tabs: `All | Talent | Brand`. Content lazy-loaded ("Loading...").

### ADMIN → Permissions (`tab=permissions`)

Title: "Permission System — Super Admins (WordPress `manage_options`) always have full access. This system lets you create limited admin roles and restrict user capabilities."

Sub-tabs: `Role Permissions | Staff Accounts`.

**Role Permissions** matrix — Talent and Brand columns, ON/OFF per capability:

TALENT CAPABILITIES (9):
- View Marketplace — Browse available services
- Purchase Services — Buy products and subscriptions
- Brand Design Studio — Access their brand design portal
- Website Editor — Edit their personal website
- EPK Editor — Edit their Electronic Press Kit
- Free Resources — Download free resources
- Roadmap — Access the personalized roadmap tool
- Support Tickets — Create and manage support tickets
- Rewards Store — View and redeem points for rewards

BRAND CAPABILITIES (6):
- View Marketplace
- Purchase Services
- Talent Search — Search and view talent profiles
- Free Resources
- Roadmap
- Support Tickets

`[SAVE PERMISSIONS]`

### ADMIN → Rewards Store (`tab=rewards`)

Title: "Rewards Store — Add items that members can redeem with their earned points. Items appear in the Points tab of their dashboard."

`+ ADD REWARD ITEM`. Table columns: `Image | Name | Points | Stock | Status | Actions (EDIT, DELETE)`.

Sample: "Edge Zone Hat — A high-end trucker hat in black and gray — 500 points — unlimited stock — Active".

Plus **Recent Redemptions** section.

### ADMIN → Tickets (`tab=tickets`)

KPI tiles: `0 Open | 1 In Progress | 0 Resolved Today`.

Filter tabs: `ALL (1) | OPEN (0) | IN PROGRESS (1) | RESOLVED`.

Sample ticket row: `#11491 — I can't setup my DNS — In progress — Mike Ramirez • Product • Apr 10, 2026 7:07pm`.

---

## Open captures TODO

- Profile section tabs (ATHLETIC, BRAND, STORY, SOCIAL, CONTACTS, GOALS) — may be in-page tabs, need to find URL pattern
- Dashboard inner tabs (Services, Roadmap, Resources, My Products, Goals, Points, Orders, For You, Account, Support, Insights) — also in-page
- Individual module editors (Design Studio, Site Builder, EPK editor, App editor, Podcast Studio, Store editor)
- Service detail page (`?ez_view=service&slug=personal-website` as sample)
- Login + Register flows
- Brand-role dashboard (requires brand user credentials)
