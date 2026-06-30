'use server'

import Stripe from 'stripe'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { composeMockup } from '@/lib/store-mockup'

export type PrintOrderState = { ok?: boolean; error?: string; checkoutUrl?: string }

/**
 * Composite the talent's logo onto a product image and upload the PNG proof to
 * storage. Shared by the live "Generate proof" action and the order flow (so the
 * exact proof is attached to the order without the talent juggling URLs).
 */
async function renderProof(opts: {
  userId: string
  blankUrl: string
  logoUrl: string
  placement: string
  sizePct: number
  knockoutWhite: boolean
  logoX?: number
  logoY?: number
}): Promise<{ ok: boolean; url?: string; message?: string }> {
  if (!opts.blankUrl) return { ok: false, message: 'This product has no image to print on.' }
  if (!opts.logoUrl) return { ok: false, message: 'Add a logo to place.' }

  const fetchImage = async (url: string): Promise<Buffer | null> => {
    if (!/^https?:\/\//i.test(url)) return null
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer())
    } catch {
      return null
    }
  }
  const [blankBuffer, logoBuffer] = await Promise.all([
    fetchImage(opts.blankUrl),
    fetchImage(opts.logoUrl),
  ])
  if (!blankBuffer) return { ok: false, message: 'Could not load the product image.' }
  if (!logoBuffer) return { ok: false, message: 'Could not load the logo image.' }

  const placement = (['front_center', 'center', 'front_chest'].includes(opts.placement)
    ? opts.placement
    : 'center') as 'front_center' | 'center' | 'front_chest'

  const hasAdminPlacement =
    typeof opts.logoX === 'number' &&
    typeof opts.logoY === 'number' &&
    Number.isFinite(opts.logoX) &&
    Number.isFinite(opts.logoY)

  let png: Buffer
  try {
    png = await composeMockup({
      blankBuffer,
      logoBuffer,
      placement,
      sizePct: Math.max(5, Math.min(90, Math.round(opts.sizePct) || 40)),
      knockoutWhite: opts.knockoutWhite,
      x: hasAdminPlacement ? opts.logoX : undefined,
      y: hasAdminPlacement ? opts.logoY : undefined,
    })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Proof render failed' }
  }

  const supabase = await createClient()
  const path = `${opts.userId}/print-proofs/${Date.now()}.png`
  const { error: upErr } = await supabase.storage
    .from('site-assets')
    .upload(path, png, { contentType: 'image/png', upsert: true })
  if (upErr) return { ok: false, message: upErr.message }
  const { data: pub } = supabase.storage.from('site-assets').getPublicUrl(path)
  return { ok: true, url: pub.publicUrl }
}

/**
 * Print proof: composite the talent's logo onto a product image to preview the
 * print before ordering. The same proof is what gets attached to the order.
 */
export async function generatePrintProof(input: {
  blank_url: string
  logo_url: string
  placement: string
  size_pct: number
  knockout_white: boolean
  /** Admin per-product placement — logo CENTRE as 0–1 fractions. Wins over `placement`. */
  logo_x?: number
  logo_y?: number
}): Promise<{ ok: boolean; url?: string; message?: string }> {
  const user = await requireUser()
  return renderProof({
    userId: user.id,
    blankUrl: input.blank_url,
    logoUrl: input.logo_url,
    placement: input.placement,
    sizePct: input.size_pct,
    knockoutWhite: input.knockout_white,
    logoX: input.logo_x,
    logoY: input.logo_y,
  })
}

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
  // Artwork = the generated proof. Prefer the one the talent already rendered in
  // the live preview; otherwise we render it below from the product placement.
  const proofUrl = String(form.get('proof_url') ?? '').trim()
  const logoUrl = String(form.get('logo_url') ?? '').trim()
  const blankUrl = String(form.get('blank_url') ?? '').trim()
  const knockoutWhite = String(form.get('knockout_white') ?? '1') !== '0'

  if (!productId) return { error: 'Missing product id' }

  const { data: product } = await supabase
    .from('print_products')
    .select('*')
    .eq('id', productId)
    .eq('active', true)
    .maybeSingle()
  if (!product) return { error: 'Product not found' }

  // Resolve the proof to attach to the order. If the talent didn't click
  // "Generate proof", render it now from the admin's per-product placement so
  // fulfillment always receives a print-ready proof.
  let artworkUrls: string[] = []
  if (proofUrl) {
    artworkUrls = [proofUrl]
  } else if (logoUrl) {
    const blank = blankUrl || (product.cover_image_url as string | null) || ''
    if (blank) {
      const gen = await renderProof({
        userId: user.id,
        blankUrl: blank,
        logoUrl,
        placement: 'center',
        sizePct: Math.round(
          Number((product as { logo_scale?: number | null }).logo_scale ?? 0.3) * 100
        ),
        knockoutWhite,
        logoX: Number((product as { logo_x?: number | null }).logo_x ?? 0.5),
        logoY: Number((product as { logo_y?: number | null }).logo_y ?? 0.5),
      })
      if (gen.ok && gen.url) artworkUrls = [gen.url]
    }
  }

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
      kind: 'print_order',
      order_id: order.id,
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
