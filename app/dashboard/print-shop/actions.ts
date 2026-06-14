'use server'

import Stripe from 'stripe'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export type PrintOrderState = { ok?: boolean; error?: string; checkoutUrl?: string }

export async function createPrintOrder(
  _prev: PrintOrderState,
  form: FormData
): Promise<PrintOrderState> {
  const user = await requireUser()
  const supabase = await createClient()
  const productId = String(form.get('product_id') ?? '')
  const variantLabel = String(form.get('variant_label') ?? '').trim() || null
  const quantity = Math.max(1, Math.min(50, Number(form.get('quantity') ?? 1)))
  const notes = String(form.get('notes') ?? '').trim() || null
  const artworkUrlsRaw = String(form.get('artwork_urls') ?? '')
  const artworkUrls = artworkUrlsRaw
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (!productId) return { error: 'Missing product id' }

  const { data: product } = await supabase
    .from('print_products')
    .select('id, name, base_price_cents, variants, options, slug, lead_time_days')
    .eq('id', productId)
    .eq('active', true)
    .maybeSingle()
  if (!product) return { error: 'Product not found' }

  const variants = (product.variants as Array<{ label: string; price_cents: number }>) ?? []
  const unitPrice = variantLabel
    ? variants.find((v) => v.label === variantLabel)?.price_cents ?? product.base_price_cents
    : product.base_price_cents
  const total = unitPrice * quantity

  const options: Record<string, string> = {}
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string') continue
    if (key.startsWith('opt_')) options[key.slice(4)] = value
  }

  const shipName = String(form.get('ship_to_name') ?? '').trim()
  const shipPhone = String(form.get('ship_to_phone') ?? '').trim() || null
  const shipStreet = String(form.get('ship_to_street') ?? '').trim()
  const shipCity = String(form.get('ship_to_city') ?? '').trim()
  const shipState = String(form.get('ship_to_state') ?? '').trim().toUpperCase()
  const shipPostal = String(form.get('ship_to_postal') ?? '').trim()
  if (!shipName || !shipStreet || !shipCity || !shipState || !shipPostal) {
    return { error: 'Complete shipping address is required' }
  }

  const { data: order, error: insertError } = await supabase
    .from('print_orders')
    .insert({
      user_id: user.id,
      product_id: productId,
      variant_label: variantLabel,
      options,
      quantity,
      amount_cents: total,
      artwork_urls: artworkUrls,
      ship_to_name: shipName,
      ship_to_phone: shipPhone,
      ship_to_street: shipStreet,
      ship_to_city: shipCity,
      ship_to_state: shipState,
      ship_to_postal: shipPostal,
      notes,
      status: 'draft',
    })
    .select('id')
    .single()
  if (insertError) return { error: insertError.message }

  if (!env.STRIPE_SECRET_KEY) {
    return { error: 'Stripe is not configured on this deployment' }
  }
  const stripe = new Stripe(env.STRIPE_SECRET_KEY)
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: total,
          product_data: {
            name: `${product.name}${variantLabel ? ` — ${variantLabel}` : ''}`,
            description: `Qty ${quantity}${
              Object.keys(options).length > 0
                ? ` · ${Object.entries(options)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')}`
                : ''
            }`,
          },
        },
      },
    ],
    customer_email: user.email ?? undefined,
    success_url: `${siteUrl}/dashboard/print-shop/${product.slug}/success?order=${order.id}`,
    cancel_url: `${siteUrl}/dashboard/print-shop/${product.slug}`,
    metadata: {
      print_order_id: order.id,
      user_id: user.id,
    },
  })

  await supabase
    .from('print_orders')
    .update({ stripe_session_id: session.id })
    .eq('id', order.id)

  revalidatePath('/dashboard/print-shop')
  return { ok: true, checkoutUrl: session.url ?? '' }
}
