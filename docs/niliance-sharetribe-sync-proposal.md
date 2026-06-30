# Edge Zone ↔ Sharetribe Sync — Implementation Plan & Decision Guide

**Prepared in response to:** *Niliance Claude to Sharetribe Sync Guide* (2026‑06‑14)
**"Claude" backend** in that guide = the Edge Zone platform.
**Status:** Phase 1 (durable user sync) implemented; Phases 2–4 await the answers in §10.

---

## 1. Overview

The NILiance guide asks Edge Zone to reliably push data **back into Sharetribe** whenever
Edge Zone creates or changes something the marketplace cares about (users, listings, orders,
stock, referrals, relationships). Today that direction is partial and best‑effort. This plan
makes it **durable, event‑driven, and complete**, while keeping **Sharetribe as the source of
truth** for marketplace UUIDs, checkout, payments, stock, and transaction lifecycle.

It is delivered in **four phases**, lowest‑risk first. Phase 1 is built. Phases 2–4 depend on a
small set of answers from the NILiance/Sharetribe team (§10) — each answer has a clear "if this,
then we build that" path so there is no ambiguity once you reply.

---

## 2. Current state & the gap

| Capability | Today |
|---|---|
| Sharetribe API access (Integration + Marketplace) | ✅ In place |
| Inbound (Sharetribe → Edge Zone) profile pull | ✅ In place (on‑connect + manual) |
| Outbound user create/update | ⚠️ Worked, but **fire‑and‑forget** — lost if Sharetribe was unavailable |
| Stable Edge Zone ↔ Sharetribe id mapping | ⚠️ Partial (user link status only) |
| Durable retry queue (outbox) | ❌ → **built in Phase 1** |
| Background worker + reconciliation | ❌ → **built in Phase 1** |
| Listing / stock / association / transaction / referral sync | ❌ → Phases 2–4 |

**The core fix:** stop firing updates and hoping. Every change writes a durable **sync event**;
a **worker** delivers it to Sharetribe, verifies the response, and a **reconciliation job** retries
anything that failed — so nothing is silently lost.

---

## 3. Goals & non‑goals

**Goals**
- Reliable, idempotent, retry‑safe outbound sync for all marketplace‑relevant entities.
- Stable id mapping so updates always target the right Sharetribe record.
- Observability: every event's status, attempts, and last error are queryable.

**Non‑goals**
- Edge Zone will **not** run a competing order lifecycle. For transactions it writes display
  data and triggers **valid Sharetribe transitions** — it never just flips a status field.
- Edge Zone will not become the source of truth for payments, stock, or transaction state.

---

## 4. Architecture

```
Edge Zone change
   → write a durable sync event (outbox)
   → worker picks it up
   → resolve the Sharetribe id from the mapping table (create + store it on first sight)
   → fetch current Sharetribe state when the update is merge-sensitive
   → send the create / update / transition
   → verify a 2xx response (read-after-write)
   → mark the event "synced", or back-off and retry on failure
   → a scheduled reconciliation job drains anything still pending/failed
```

Direct Sharetribe API calls are the default (the change originates in Edge Zone). A **signed
server‑to‑server callback** into the Sharetribe backend is used only where an action must be
performed by a trusted marketplace flow with actor context (certain transaction transitions).

---

## 5. Phased delivery

| Phase | Scope | Risk | Depends on |
|---|---|---|---|
| **1. Durable user sync** ✅ done | Outbox, mapping table, worker, reconciliation cron; users only | Low | — |
| **2. Listings + stock** | Listing create/update (services, prices, public/search fields) + atomic stock | Medium | Q2, Q3, Q5 |
| **3. Associations + referrals** | Talent↔brand/agency/school links; referral state | Medium | Q3 |
| **4. Transactions** | Fulfillment/delivery via **valid transitions**; order display metadata | High | Q4, Q6, Q7 |

Each phase is independently shippable and testable in a Sharetribe sandbox before production.

---

## 6. Components

| Component | Purpose |
|---|---|
| **Sharetribe API client** | Server‑to‑server calls using backend‑only credentials. *(Exists.)* |
| **Mapping table** (`sharetribe_links`) | Stable Edge Zone id ↔ Sharetribe UUID for users, listings, transactions. *(Phase 1.)* |
| **Sync outbox** (`sharetribe_sync_outbox`) | Durable event queue: event id, entity type/id, payload, status, attempts, last error, next‑attempt time. *(Phase 1.)* |
| **Sync worker** | Resolves ids, fetches‑before‑merge when needed, writes, verifies, marks synced/failed with exponential backoff. *(Phase 1; extended per phase.)* |
| **Reconciliation job** | Scheduled drain of failed/stale events (every 5 min). *(Phase 1.)* |
| **Per‑entity handlers** | `syncUser` *(done)*, `syncListing`, `syncStock`, `syncAssociation`, `syncReferral`, `syncTransaction`. |
| **Signed callback (optional)** | HMAC‑signed endpoint for trusted Sharetribe‑mediated actions, only if §10 Q6 requires it. |
| **Admin outbox viewer (optional)** | Pending/failed counts + manual retry. |

---

## 7. Data ownership & field mapping (summary)

We follow the guide's targets:

| Data | Sharetribe location | Rule |
|---|---|---|
| Public / searchable fields | listing & user **publicData** | Only public, searchable values |
| Private operational data | **privateData** | Referrals, subscription snapshots, recipient lists |
| Sensitive profile (phone, DOB) | **protectedData** | Only when required by a marketplace flow |
| Integration bookkeeping | **metadata.claudeSync** | last event id, source id, source timestamp, status |
| Order display | transaction **metadata.service / .attachments** | status, due date, delivered URL, summary |
| Order lifecycle | a **valid transition** | Never metadata‑only when state must change |
| Stock | **compare‑and‑set** | Atomic to avoid overselling |

The full per‑field map (user, listing, transaction) follows §6/§10 of the original guide and is
encoded in the per‑entity handlers, validated against the configured option values from §10 Q5.

---

## 8. Sync rules

- **Create vs update:** create only when no Sharetribe id exists; thereafter update by the stored UUID.
- **Idempotency:** every write carries the sync event id (`metadata.claudeSync.lastEventId`), so retries can't double‑apply.
- **Fetch‑before‑merge** for arrays/relationships (services, associated users, attachments) to avoid clobbering.
- **Retry** network/429/5xx with exponential backoff + jitter; **do not** retry validation/permission errors — flag them.
- **On 409 (conflict):** refetch, re‑merge, retry if the Edge Zone event is still the latest.
- **Done = a 2xx response *and* a read‑after‑write / returned‑resource check.**

---

## 9. Security

- Sharetribe Integration + Marketplace credentials live **only** in backend secret storage. Never in browser code.
- Never store OAuth tokens, Stripe secrets, raw payment details, or long‑lived signed URLs in publicData.
- publicData is for public marketplace display/search only.
- Any Edge Zone → Sharetribe webhook is signed with **HMAC SHA‑256** over timestamp + raw body; requests older than 5 minutes are rejected.
- Logs record event id and entity id, never secrets or payment details.

---

## 10. Questions for NILiance — and what we build for each answer

These are the only items blocking Phases 2–4. Each has a clear if/then so we can proceed the
moment you reply.

### Q1. Can Edge Zone **create** Sharetribe users, or only **update** existing ones?
*Why it matters:* determines whether a brand‑new Edge Zone signup provisions a marketplace user or must wait to be matched.
- **If create is allowed** *(current behavior)* → we keep create‑on‑first‑sync (Marketplace `current_user/create`), with an email‑match guard so we never duplicate an existing user. **No change needed.**
- **If update‑only** → we remove the auto‑create path. A user with no Sharetribe match is parked as `blocked` in the outbox and surfaced in admin for **manual linking** to an existing Sharetribe UUID; sync resumes automatically once linked.

### Q2. Do you accept our **event names and field names**, or do you have a required taxonomy?
*Why it matters:* the payload keys and event types must match what your side expects.
- **If our naming is fine** (`claude.<entity>.<verb>`, fields as in §6 of the guide) → no change.
- **If you have a required taxonomy** → we add a single config map that renames event types + payload field keys at the boundary; no rework of the worker.

### Q3. Which fields does **Edge Zone own** vs **only mirror**?
*Why it matters:* we must never overwrite fresher Sharetribe‑owned data (e.g., payment‑linked subscription state).
- **If Edge Zone owns profile/listing content and Sharetribe owns subscription/payment** → the worker writes profile/listing fields and treats entitlement/subscription as **mirror‑only** (writes confirmed entitlement, never overwrites payment‑fresh values).
- **If Sharetribe owns more fields** (e.g., username, certain publicData) → we add a per‑field **owner map**; the worker skips owner=Sharetribe fields and uses fetch‑before‑merge so it can't clobber them.

### Q4. What is the **service‑status → Sharetribe transition** map?
*Why it matters:* Phase 4 must fire **valid transitions**, not metadata‑only status changes.
- **If you provide the transition names** (e.g., delivered → `transition/mark-delivered`) → we encode the map and `syncTransaction` fires real transitions + writes order display metadata.
- **If transitions require buyer/provider actor context** → we route those through the **signed callback** path (Sharetribe performs the transition) — see Q6.
- **If transitions can't be exposed yet** → Phase 4 ships in **metadata‑only mode** (order display updates, no lifecycle change) and we switch on transitions later with no rework.

### Q5. What are the **configured option values** (enums)?
Sports, talent types, schools, divisions, conferences, interests, subscription plans, listing categories, transaction process aliases, unit types.
*Why it matters:* a value that isn't a configured Sharetribe option returns **400 validation_error**.
- **If you provide static enum lists** → we load them into a validation/normalization map; the worker validates + normalizes before every write (no 400s).
- **If the lists are dynamic/can't be shared** → we add a runtime "resolve option value" step that reads Sharetribe's configured options (cached) and maps Edge Zone values; **unmatched values are dropped and logged** rather than sent.

### Q6. Transaction transitions: **direct Integration API** or **signed callback**?
- **If direct Integration API is allowed** → `syncTransaction` calls the transition endpoint directly. Simplest.
- **If a trusted/actor context is required** → you expose a signed server endpoint; we build the HMAC SHA‑256 caller (timestamp + raw body, 5‑min window) and route transitions through it.

### Q7. **Media storage & access policy** for delivered assets.
*Why it matters:* §8 forbids long‑lived signed URLs in publicData.
- **If public CDN URLs are acceptable** → we put the asset URL in `transaction.metadata.attachments`.
- **If signed/time‑limited URLs are required** → we store the asset in our bucket and send an **asset id + a fetch endpoint** (or generate a fresh signed URL per request), never a long‑lived signed URL in marketplace data.

### Q8. **Alerting** for failed / high‑priority syncs.
- **If email** → we send to an ops inbox when an event exhausts retries or is a priority entity.
- **If webhook/Slack** → we POST failures to an endpoint you provide.
- **If dashboard‑only** → we expose the admin outbox viewer (pending/failed counts + retry) with no external alerting.

### Q9 (operational). **Sandbox & rate limits.**
- Please share **sandbox** marketplace + Integration/Marketplace API credentials for end‑to‑end testing before production.
- Please confirm **rate limits** so we can tune worker concurrency and backoff.

### Q10 (scope). **Inbound events.**
- Do you also want Edge Zone to **consume Sharetribe webhooks** for specific changes, or is the current on‑demand/poll inbound sufficient? *(Outbound is this plan's focus; inbound is unchanged unless you want more.)*

---

## 11. What we need from you to start each phase

- **Phase 2 (listings + stock):** answers to **Q2, Q3, Q5** + the listing/stock API capabilities (listing create/update, stock compare‑and‑set) + sandbox creds (Q9).
- **Phase 3 (associations + referrals):** answer to **Q3** (relationship field ownership).
- **Phase 4 (transactions):** answers to **Q4, Q6, Q7** + the transaction process alias(es) and the valid transition names.

---

## 12. Acceptance criteria (definition of done, per entity)

- A change in Edge Zone results in a sync event that reaches `synced` after a verified 2xx.
- The Sharetribe record reflects the change (read‑after‑write confirms it).
- Re‑running the same event does **not** duplicate or corrupt data (idempotent).
- A simulated Sharetribe outage results in retries, not lost data; the reconciliation job clears the backlog.
- Validation/permission errors are flagged for review, not retried forever.
- All credentials remain server‑side; no secrets in logs or publicData.

---

## 13. Status snapshot

- **Phase 1 — done:** durable user sync. Outbox + mapping + worker + reconciliation cron live; signup, admin user‑create, and profile saves now enqueue events instead of firing and forgetting; the explicit "Connect to NILiance" action stays synchronous for instant feedback.
- **Phases 2–4 — ready to build** on receipt of the §10 answers, in the order in §5.
