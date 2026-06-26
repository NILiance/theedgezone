/**
 * Synchronous fallback for the Stripe webhook's order provisioning.
 *
 * The webhook (app/api/webhooks/stripe/route.ts) is the source of truth
 * for paid orders — but it's async and can lag a few seconds. When the
 * talent lands on /dashboard?checkout=success&session_id=... right after
 * paying, the order row often doesn't exist yet and the entitlement card
 * is missing. Refreshing eventually shows it.
 *
 * To close that gap we call fulfillCheckoutSession from the dashboard
 * page server component. It looks up the Stripe session, checks if the
 * order already landed, and if not creates the order + provisions the
 * matching module row. Idempotent — re-runs after the webhook also fires
 * are no-ops thanks to the stripe_session_id uniqueness check.
 *
 * Only handles the "regular catalog purchase" path. site_, store_,
 * bd_* metadata kinds (anonymous fan purchases, brand-design extras)
 * are intentionally skipped — those flows manage their own success URLs
 * and don't surface on the talent dashboard.
 */
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { provisionOrder, provisionBrandDesign } from '@/lib/provisioning'
import { awardPurchase } from '@/lib/points'

type Supabase = NonNullable<ReturnType<typeof createServiceClient>>

export type FulfillResult =
  | { ok: true; alreadyExisted: boolean; orderId?: string; brandId?: string }
  | { ok: false; reason: string }

export async function fulfillCheckoutSession(
  sessionId: string,
  expectedUserId: string
): Promise<FulfillResult> {
  if (!stripe) return { ok: false, reason: 'Stripe not configured.' }
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, reason: 'Service role key missing.' }

  // Fast path: order already landed via webhook.
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()
  if (existing) {
    return { ok: true, alreadyExisted: true, orderId: existing.id as string }
  }

  // Pull the session from Stripe — we need the metadata + payment status.
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'Could not load Stripe session.',
    }
  }

  // Only run for paid sessions — async payment flows still need the
  // webhook to fire later.
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return { ok: false, reason: `Session not paid yet (${session.payment_status}).` }
  }

  const md = session.metadata ?? {}
  const userId = md.user_id

  // Validate the session actually belongs to the dashboard's current user.
  // Without this anyone could trigger fulfilment for another user's
  // session by pasting the session_id into their URL.
  if (!userId || userId !== expectedUserId) {
    return { ok: false, reason: 'Session does not belong to this user.' }
  }

  // Reward the buyer with points for the purchase (deduped by session, so the
  // webhook + dashboard fallback can't double-award). Runs for every paid
  // session regardless of which fulfilment branch handles it below.
  if (typeof session.amount_total === 'number' && session.amount_total > 0) {
    await awardPurchase(userId, session.amount_total, sessionId)
  }

  // Brand-design "additional brand" purchase — bypasses orders and
  // provisions a new brand_designs row directly. Same logic as the
  // webhook's handleBrandDesignAdditional. Idempotent on stripe_session_id.
  if (md.kind === 'bd_additional') {
    const { data: existing } = await supabase
      .from('brand_designs')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()
    if (existing) {
      return { ok: true, alreadyExisted: true, brandId: existing.id as string }
    }
    const result = await provisionBrandDesign(supabase, userId, undefined, {
      fromProfile: true,
    })
    if (result.entity_id) {
      await supabase
        .from('brand_designs')
        .update({ stripe_session_id: session.id })
        .eq('id', result.entity_id)
      return { ok: true, alreadyExisted: false, brandId: result.entity_id }
    }
    return { ok: false, reason: 'Provisioning returned no entity.' }
  }

  // Brand-design "additional final logo" purchase — clones the parent
  // brand into a NEW brand_designs row using the chosen concept as
  // final_logo_url, then builds that brand's kit. Each final logo ends
  // up with its own brand row + its own kit in storage, which is what
  // the legacy "YOUR LOGOS:" row models. Idempotent on stripe_session_id.
  if (md.kind === 'bd_additional_final') {
    const parentBrandId = md.brand_id
    const conceptId = md.concept_id
    if (!parentBrandId || !conceptId) {
      return { ok: false, reason: 'Missing brand_id / concept_id on session.' }
    }
    const { data: existing } = await supabase
      .from('brand_designs')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()
    if (existing) {
      return { ok: true, alreadyExisted: true, brandId: existing.id as string }
    }
    const newBrandId = await cloneBrandForAdditionalFinal({
      supabase,
      userId,
      parentBrandId,
      conceptId,
      sessionId: session.id,
    })
    if (!newBrandId) {
      return { ok: false, reason: 'Could not clone brand or build kit.' }
    }
    return { ok: true, alreadyExisted: false, brandId: newBrandId }
  }

  // Concept-pack purchase — bumps brand_designs.paid_concepts_total so
  // the talent can keep generating past their free allowance. No new
  // brand; the dedup table keeps the bump idempotent.
  if (md.kind === 'bd_concept_pack') {
    const brandId = md.brand_id
    if (!brandId) return { ok: false, reason: 'Missing brand_id on session.' }
    const applied = await applyConceptPackPurchase({
      supabase,
      userId,
      brandId,
      sessionId: session.id,
      packSize: parseInt(md.pack_size ?? '10', 10) || 10,
      amountCents: session.amount_total ?? null,
    })
    if (!applied.ok) return { ok: false, reason: applied.reason }
    return { ok: true, alreadyExisted: applied.alreadyApplied, brandId }
  }

  const productSlug = md.product_slug
  const productTitle = md.product_title

  if (!productSlug || !productTitle) {
    // Anonymous / site_ / store_ / bd_extras flows. Webhook handles them.
    return { ok: false, reason: 'Non-catalog session — webhook will handle.' }
  }

  // Insert the order in provisioning state, same shape the webhook uses.
  const { data: inserted, error: insertErr } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      product_slug: productSlug,
      product_title: productTitle,
      plan: md.plan ?? 'onetime',
      amount_cents: session.amount_total ?? null,
      currency: session.currency ?? 'usd',
      status: 'provisioning',
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === 'string' ? session.payment_intent : null,
      purchased_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (insertErr || !inserted) {
    // Race with the webhook is fine — re-check existence then bail.
    const { data: postRaceExisting } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()
    if (postRaceExisting) {
      return { ok: true, alreadyExisted: true, orderId: postRaceExisting.id as string }
    }
    return {
      ok: false,
      reason: insertErr?.message ?? 'Failed to create order row.',
    }
  }

  // Provision the matching module row (sites / brand_designs / epks / …)
  try {
    const result = await provisionOrder(supabase, {
      id: inserted.id as string,
      user_id: userId,
      product_slug: productSlug,
    })
    await supabase
      .from('orders')
      .update({
        status: result.status,
        provisioned_entity_id: result.entity_id ?? null,
        provisioned_at: result.entity_id ? new Date().toISOString() : null,
      })
      .eq('id', inserted.id as string)
  } catch (err) {
    console.error('[checkout-fulfillment] provisioning failed', err)
    // Leave the order in provisioning state — webhook will retry.
  }

  return { ok: true, alreadyExisted: false, orderId: inserted.id as string }
}

/**
 * Clone the parent brand_designs row into a new row for an
 * "additional final logo" purchase, set the chosen concept's image as
 * the final, mark the concept purchased_as_final, then auto-assemble
 * the brand kit for the new brand. Returns the new brand id.
 *
 * Used by both fulfillCheckoutSession (sync) and the webhook
 * handler (async fallback) so the two stay in lockstep.
 */
export async function cloneBrandForAdditionalFinal(args: {
  supabase: Supabase
  userId: string
  parentBrandId: string
  conceptId: string
  sessionId: string
}): Promise<string | null> {
  const { supabase, userId, parentBrandId, conceptId, sessionId } = args
  // Pull parent brand prefs so the clone inherits sport/colors/etc.
  const { data: parent } = await supabase
    .from('brand_designs')
    .select(
      'brand_name, sport, athletic_position, school, jersey_number, primary_color, secondary_color, accent_color, neutral_color, style_seed, asset_credits_total, asset_credits_used'
    )
    .eq('id', parentBrandId)
    .maybeSingle()
  if (!parent) return null

  // Concept = source of the new final logo.
  const { data: concept } = await supabase
    .from('logo_concepts')
    .select('id, image_url, metadata, is_selected')
    .eq('id', conceptId)
    .maybeSingle()
  if (!concept?.image_url) return null

  // Create the new brand row with the concept's image already set as
  // the final. status='selected' so the talent's first view into this
  // brand isn't gated by "pick a final".
  const { data: newBrand, error: insertErr } = await supabase
    .from('brand_designs')
    .insert({
      user_id: userId,
      brand_name: parent.brand_name,
      sport: parent.sport,
      athletic_position: parent.athletic_position,
      school: parent.school,
      jersey_number: parent.jersey_number,
      primary_color: parent.primary_color,
      secondary_color: parent.secondary_color,
      accent_color: parent.accent_color,
      neutral_color: parent.neutral_color,
      style_seed: parent.style_seed,
      asset_credits_total: parent.asset_credits_total ?? 10,
      asset_credits_used: 0,
      final_logo_url: concept.image_url,
      finalized_at: new Date().toISOString(),
      status: 'selected',
      stripe_session_id: sessionId,
    })
    .select('id')
    .single()
  if (insertErr || !newBrand) return null

  // Mark the source concept so it doesn't show as up-for-grabs on the
  // parent brand and so the same purchase can't be applied twice.
  const meta = (concept.metadata ?? {}) as Record<string, unknown>
  await supabase
    .from('logo_concepts')
    .update({
      metadata: {
        ...meta,
        purchased_as_final: true,
        purchase_session_id: sessionId,
        clone_brand_id: newBrand.id,
      },
    })
    .eq('id', conceptId)

  // Auto-assemble the kit. Lazy-import so this module stays light when
  // the path isn't hit. assembleAndBuildKit captures any errors into
  // brand_kit_error on the row so the talent sees them in the UI.
  try {
    const { assembleKitForBrandId } = await import('@/app/dashboard/brand-design/actions')
    await assembleKitForBrandId(newBrand.id as string, userId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kit build failed'
    await supabase
      .from('brand_designs')
      .update({ brand_kit_error: msg })
      .eq('id', newBrand.id as string)
  }

  return newBrand.id as string
}

/**
 * Applies a concept-pack purchase: records the Stripe session in
 * brand_concept_pack_purchases (unique on session id) and, only if that
 * insert actually happened, bumps brand_designs.paid_concepts_total by
 * the pack size. The unique constraint makes this safe to call from both
 * the sync fulfillment and the async webhook — exactly one wins.
 */
export async function applyConceptPackPurchase(args: {
  supabase: Supabase
  userId: string
  brandId: string
  sessionId: string
  packSize: number
  amountCents: number | null
}): Promise<
  | { ok: true; alreadyApplied: boolean }
  | { ok: false; reason: string }
> {
  const { supabase, userId, brandId, sessionId, packSize, amountCents } = args
  // paid_concepts_total + brand_concept_pack_purchases aren't in the
  // generated DB types yet (pending migrations), so go through a loose
  // view for those operations.
  const db = supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: { user_id: string; paid_concepts_total: number | null } | null
            error: { message: string; code?: string } | null
          }>
        }
      }
      insert: (values: Record<string, unknown>) => {
        select: (cols: string) => {
          maybeSingle: () => Promise<{
            data: { id: string } | null
            error: { message: string; code?: string } | null
          }>
        }
      }
      update: (values: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>
      }
    }
  }

  // Ownership guard — the session metadata is user-scoped, but double-check.
  const { data: brand } = await db
    .from('brand_designs')
    .select('id, user_id, paid_concepts_total')
    .eq('id', brandId)
    .maybeSingle()
  if (!brand || brand.user_id !== userId) {
    return { ok: false, reason: 'Brand not found or not owned by user.' }
  }

  const { data: inserted, error: insErr } = await db
    .from('brand_concept_pack_purchases')
    .insert({
      brand_design_id: brandId,
      user_id: userId,
      stripe_session_id: sessionId,
      pack_size: packSize,
      amount_cents: amountCents,
    })
    .select('id')
    .maybeSingle()

  if (insErr) {
    // 23505 = unique_violation → the other path already applied this pack.
    if (insErr.code === '23505') return { ok: true, alreadyApplied: true }
    return { ok: false, reason: insErr.message }
  }
  if (!inserted) {
    // No row + no error shouldn't happen, but treat as already-applied.
    return { ok: true, alreadyApplied: true }
  }

  const newTotal = (brand.paid_concepts_total ?? 0) + packSize
  await db.from('brand_designs').update({ paid_concepts_total: newTotal }).eq('id', brandId)

  return { ok: true, alreadyApplied: false }
}

