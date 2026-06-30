# Claude → Sharetribe two-way sync — implementation plan

Maps the *"Niliance Claude to Sharetribe Sync Guide"* (2026‑06‑14) onto this repo.
"Claude" in the guide = this Edge Zone Next.js backend. Sharetribe is reached via
NILiance (`lib/sharetribe.ts` + `lib/niliance.ts`).

## What already exists

| Guide build item | Status in repo |
|---|---|
| Sharetribe API client (§2) | ✅ `lib/sharetribe.ts` (Integration + Marketplace SDKs) |
| User upsert write (§4 `user.upserted`) | ⚠️ `lib/niliance.ts` `createNilianceUser` / `syncProfile` — **fire‑and‑forget**, not durable |
| Inbound poll | ✅ `app/api/cron/niliance-poll` + `pullProfileFromNiliance` |
| Event log | ⚠️ `niliance_sync_events` — a human log, **not** a retry outbox |
| Mapping table (§2) | ⚠️ only `profiles.niliance_link_status`; no stable id map |
| Sync outbox (§2) | ❌ |
| Sync worker (§2) | ❌ |
| Reconciliation job (§2) | ❌ |
| Listing / stock / association / transaction / referral sync (§4) | ❌ |

So this is **Phase 2 of the existing bridge**: make it durable, add the outbox +
worker + mapping, then extend from users to the full entity set.

## Target architecture (guide §3)

```
domain change → enqueueSyncEvent() → sharetribe_sync_outbox (pending)
  → processOutbox() worker → resolve Sharetribe id (sharetribe_links)
  → fetch current ST state if merge‑sensitive → write/transition → verify 2xx
  → mark synced | backoff‑retry (failed) → cron reconciliation drains the rest
```

## File / migration map

| Guide section | Repo artifact | Phase |
|---|---|---|
| §2 Mapping table | `sharetribe_links` (migration `…_sharetribe_sync.sql`) | **1** |
| §2 Sync outbox | `sharetribe_sync_outbox` (same migration) | **1** |
| §2 Sync worker | `lib/sharetribe-sync.ts` → `processOutbox()` | **1** |
| §2 Reconciliation | `app/api/cron/sharetribe-sync/route.ts` + `vercel.json` cron | **1** |
| §4 `user.upserted` | `syncUser()` in `lib/sharetribe-sync.ts` (wraps `createNilianceUser`/`syncProfile`) | **1** |
| §4 enqueue points | signup, admin user create, profile save → `enqueueSyncEvent()` | **1** |
| §6 User mapping, §10.2/10.3 | `syncUser()` payload + `lib/niliance.ts` field push | **1** |
| §4 `listing.upserted`, §5 publicData, §6 Listing mapping, §10.4–10.6 | `syncListing()` + a Sharetribe listing client in `lib/sharetribe.ts`; enqueue from listing edits (services/EPK/store product) | **2** |
| §4 `listing.stock_changed`, §5 stock CAS, §10.8 | `syncStock()` (compare‑and‑set); enqueue from store inventory changes | **2** |
| §4 `association.changed`, §10.7 | `syncAssociation()` (fetch‑before‑merge parent listing + talent profile) | **3** |
| §4 `transaction.fulfillment_updated`, §5 transitions, §10.9/10.10 | `syncTransaction()` via valid ST **transitions** (not metadata‑only) | **4** (last — riskiest) |
| §4 `referral.updated` | `syncReferral()` → referrer privateData | **3** |
| §7 sync rules (create‑vs‑update, fetch‑before‑merge, 409, retry) | implemented in `processOutbox()` + per‑entity handlers | **1‑4** |
| §8 security (HMAC, creds backend‑only) | already: creds in `env`/secret manager. Add HMAC verify only if signed callbacks are used (§9) | as needed |
| §9 signed callback fallback | optional `app/api/sharetribe/callback` (HMAC SHA‑256, 5‑min window) — only if transitions need marketplace actor context | **4** |
| §11 error handling | retryable (network/429/5xx) vs terminal (400/403) in `processOutbox()` | **1** |
| §12 client confirmations | see "Open questions" below | — |

## Phasing

1. **Durable user sync** *(this commit)* — outbox + mapping + worker + cron, users only, reusing the existing NILiance functions.
2. **Listings + stock** — the highest‑value marketplace data; needs a Sharetribe *listing* client + the configured option‑value map.
3. **Associations + referrals** — fetch‑before‑merge relationship writes.
4. **Transactions** — last, because lifecycle transitions must use valid Sharetribe transitions and may need signed callbacks.

## Open questions to confirm with NILiance (guide §12)

- Can Edge Zone **create** Sharetribe users or only update existing ones? *(Current code creates — confirm that's intended.)*
- Exact Claude event names + field names *(we use `claude.<entity>.<verb>` per the guide).*
- Which fields Edge Zone **owns** vs only mirrors (don't overwrite fresher payment/subscription data).
- Service‑status → Sharetribe **transition** map (for Phase 4).
- Configured Sharetribe **option values** (roles, sports, talent types, schools, divisions, conferences, subscription plans) — writes 400 if these don't match.
- Transaction transitions: **direct API** vs **signed callback**.
- Media/attachment storage + access policy for delivered assets.
- Alerting requirements for failed / high‑priority syncs.
