import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getBrandDesignExtras } from '@/lib/service-pricing'

export const runtime = 'nodejs'

/**
 * Embedded Stripe checkout for the two brand-design extras:
 *   - `additional` — kicks off a new brand design beyond the talent's
 *     first, charging additional_brand_price_cents.
 *   - `revision` — orders a paid revision on an existing brand design,
 *     charging revision_price_cents (or $0 when the first-free toggle
 *     is on and the talent has none yet).
 *
 * Both flows tag the Stripe session metadata so the webhook can promote
 * the right entity (new brand_designs row OR new brand_design_revisions
 * row) on completion.
 */
export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  }

  let body: { kind?: 'additional' | 'revision'; brand_id?: string; notes?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (body.kind !== 'additional' && body.kind !== 'revision') {
    return NextResponse.json({ error: 'Unknown kind.' }, { status: 400 })
  }

  const supabase = await createClient()
  const extras = await getBrandDesignExtras()
  const origin = new URL(request.url).origin

  if (body.kind === 'additional') {
    const amount = extras.additional_brand_price_cents
    if (!amount || amount < 50) {
      return NextResponse.json(
        {
          error:
            'Additional brand price is not configured yet — admin needs to set it under Pricing.',
        },
        { status: 400 }
      )
    }
    try {
      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded_page',
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Additional brand design',
                description:
                  'A second/third logo concept set for the same talent. Full 10-concept Round 1, refinement rounds, and brand kit.',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        customer_email: user.email,
        allow_promotion_codes: true,
        return_url: `${origin}/dashboard/brand-design?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
          user_id: user.id,
          kind: 'bd_additional',
        },
      })
      return NextResponse.json({ client_secret: session.client_secret })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stripe error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // body.kind === 'revision'
  if (!body.brand_id) {
    return NextResponse.json({ error: 'Missing brand_id.' }, { status: 400 })
  }

  const { data: brand } = await supabase
    .from('brand_designs')
    .select('id, user_id, brand_name')
    .eq('id', body.brand_id)
    .maybeSingle()
  if (!brand || brand.user_id !== user.id) {
    return NextResponse.json({ error: 'Brand design not found.' }, { status: 404 })
  }

  // First-free logic — count existing revisions on this brand. If the
  // toggle is on and no revisions exist yet, skip Stripe entirely and
  // write the revision row directly.
  const { count: priorCount } = await supabase
    .from('brand_design_revisions')
    .select('id', { count: 'exact', head: true })
    .eq('brand_design_id', body.brand_id)

  if (extras.first_revision_free && (priorCount ?? 0) === 0) {
    const { error: insertErr } = await supabase.from('brand_design_revisions').insert({
      brand_design_id: body.brand_id,
      user_id: user.id,
      notes: body.notes ?? null,
      source: 'free',
      amount_cents: 0,
      status: 'pending',
    })
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }
    return NextResponse.json({ free: true })
  }

  const amount = extras.revision_price_cents
  if (!amount || amount < 50) {
    return NextResponse.json(
      {
        error:
          'Revision price is not configured yet — admin needs to set it under Pricing.',
      },
      { status: 400 }
    )
  }

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Brand design revision',
              description: `Revision request for "${brand.brand_name ?? 'your brand'}". Our designer will apply your notes and ship the revised concept within 48 hours.`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      allow_promotion_codes: true,
      return_url: `${origin}/dashboard/brand-design/${body.brand_id}?revision=success&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_id: user.id,
        kind: 'bd_revision',
        brand_id: body.brand_id,
        notes: (body.notes ?? '').slice(0, 400),
      },
    })
    return NextResponse.json({ client_secret: session.client_secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
