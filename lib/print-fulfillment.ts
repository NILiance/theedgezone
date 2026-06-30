/**
 * Print Shop — fulfillment dispatch.
 *
 * Called after a print order is paid (auto, from the Stripe webhook) or when an
 * admin clicks "Send to fulfillment". Reads print_fulfillment_settings and hands
 * the order off over the enabled channels:
 *   - email   → a print partner / decorator inbox (order details + ship-to +
 *               artwork download links)
 *   - webhook → POST the order as JSON to an endpoint you control
 * The order's fulfillment_status is updated to sent / failed accordingly.
 */
import type { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>

export interface PrintFulfillmentSettings {
  auto_send: boolean
  email_enabled: boolean
  webhook_enabled: boolean
  partner_email: string | null
  webhook_url: string | null
  webhook_auth_header: string | null
}

export interface DispatchPrintResult {
  ok: boolean
  channels: string[]
  error?: string
}

export async function getPrintFulfillmentSettings(
  supabase: ServiceClient
): Promise<PrintFulfillmentSettings> {
  const { data } = await supabase
    .from('print_fulfillment_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  const s = (data ?? {}) as Partial<PrintFulfillmentSettings>
  return {
    auto_send: Boolean(s.auto_send),
    email_enabled: s.email_enabled ?? true,
    webhook_enabled: Boolean(s.webhook_enabled),
    partner_email: s.partner_email ?? null,
    webhook_url: s.webhook_url ?? null,
    webhook_auth_header: s.webhook_auth_header ?? null,
  }
}

interface OrderRow {
  id: string
  user_id: string
  product_id: string
  variant_label: string | null
  options: Record<string, string> | null
  quantity: number
  amount_cents: number
  artwork_urls: string[] | null
  ship_to_name: string | null
  ship_to_phone: string | null
  ship_to_street: string | null
  ship_to_city: string | null
  ship_to_state: string | null
  ship_to_postal: string | null
  ship_to_country: string | null
  notes: string | null
  status: string
  fulfillment_status: string | null
  created_at: string
}

/**
 * Hand a paid order off to fulfillment. `force` re-sends even if already sent
 * (admin "Resend"). Returns which channels succeeded.
 */
export async function dispatchPrintOrder(
  supabase: ServiceClient,
  orderId: string,
  opts: { force?: boolean } = {}
): Promise<DispatchPrintResult> {
  const { data: orderData } = await supabase
    .from('print_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()
  const order = orderData as OrderRow | null
  if (!order) return { ok: false, channels: [], error: 'Order not found' }
  if (order.fulfillment_status === 'sent' && !opts.force) {
    return { ok: true, channels: [] } // already handed off
  }

  const settings = await getPrintFulfillmentSettings(supabase)

  const { data: product } = await supabase
    .from('print_products')
    .select('name, slug')
    .eq('id', order.product_id)
    .maybeSingle()

  let talentEmail: string | null = null
  try {
    const { data } = await supabase.auth.admin.getUserById(order.user_id)
    talentEmail = data.user?.email ?? null
  } catch {
    /* no email */
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', order.user_id)
    .maybeSingle()

  const payload = {
    order_id: order.id,
    product: {
      name: (product as { name?: string } | null)?.name ?? 'Print product',
      slug: (product as { slug?: string } | null)?.slug ?? null,
    },
    quantity: order.quantity,
    variant_label: order.variant_label,
    options: order.options ?? {},
    amount_cents: order.amount_cents,
    artwork_urls: Array.isArray(order.artwork_urls) ? order.artwork_urls : [],
    ship_to: {
      name: order.ship_to_name,
      phone: order.ship_to_phone,
      street: order.ship_to_street,
      city: order.ship_to_city,
      state: order.ship_to_state,
      postal: order.ship_to_postal,
      country: order.ship_to_country ?? 'US',
    },
    talent: {
      name: (profile as { display_name?: string } | null)?.display_name ?? null,
      email: talentEmail,
    },
    notes: order.notes,
    created_at: order.created_at,
  }

  const channels: string[] = []
  const errors: string[] = []

  // ── Email channel ──────────────────────────────────────────────────────
  if (settings.email_enabled && settings.partner_email) {
    const res = await sendEmail({
      to: settings.partner_email,
      subject: `New print order — ${payload.product.name} ×${payload.quantity}`,
      templateKey: 'print_fulfillment',
      html: fulfillmentEmailHtml(payload),
      metadata: { order_id: order.id },
    })
    if (res.success) channels.push('email')
    else errors.push(`email: ${res.error ?? 'failed'}`)
  } else if (settings.email_enabled && !settings.partner_email) {
    errors.push('email: no partner address set')
  }

  // ── Webhook channel ────────────────────────────────────────────────────
  if (settings.webhook_enabled && settings.webhook_url) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (settings.webhook_auth_header) headers['Authorization'] = settings.webhook_auth_header
      const res = await fetch(settings.webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ event: 'print_order.paid', data: payload }),
      })
      if (res.ok) channels.push('webhook')
      else errors.push(`webhook: HTTP ${res.status}`)
    } catch (err) {
      errors.push(`webhook: ${err instanceof Error ? err.message : 'request failed'}`)
    }
  } else if (settings.webhook_enabled && !settings.webhook_url) {
    errors.push('webhook: no URL set')
  }

  const ok = channels.length > 0
  await supabase
    .from('print_orders')
    .update({
      fulfillment_status: ok ? 'sent' : 'failed',
      fulfillment_channel: channels.join('+') || null,
      fulfillment_sent_at: ok ? new Date().toISOString() : null,
      fulfillment_error: ok ? null : errors.join('; ') || 'No fulfillment channel configured',
      // Move the order forward once it's handed off.
      status: ok && order.status === 'paid' ? 'in_production' : order.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  return {
    ok,
    channels,
    error: ok ? undefined : errors.join('; ') || 'No fulfillment channel configured',
  }
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'
  )
}

function fulfillmentEmailHtml(p: {
  order_id: string
  product: { name: string; slug: string | null }
  quantity: number
  variant_label: string | null
  options: Record<string, string>
  amount_cents: number
  artwork_urls: string[]
  ship_to: {
    name: string | null
    phone: string | null
    street: string | null
    city: string | null
    state: string | null
    postal: string | null
    country: string
  }
  talent: { name: string | null; email: string | null }
  notes: string | null
}): string {
  const opts = Object.entries(p.options ?? {})
    .map(([k, v]) => `${esc(k)}: ${esc(v)}`)
    .join(' · ')
  const ship = [
    p.ship_to.name,
    p.ship_to.street,
    [p.ship_to.city, p.ship_to.state, p.ship_to.postal].filter(Boolean).join(', '),
    p.ship_to.country,
    p.ship_to.phone ? `☎ ${p.ship_to.phone}` : null,
  ]
    .filter(Boolean)
    .map((l) => esc(l))
    .join('<br>')
  const art = p.artwork_urls.length
    ? p.artwork_urls
        .map(
          (u, i) =>
            `<p><a href="${esc(u)}" style="color:#C8A84E;">Download proof / artwork ${i + 1}</a></p>` +
            `<img src="${esc(u)}" alt="Proof ${i + 1}" style="max-width:320px;border:1px solid #ddd;border-radius:6px;" />`
        )
        .join('')
    : '<p style="color:#b00;">⚠ No artwork attached to this order.</p>'

  return `<h2 style="color:#C8A84E;">New print order to fulfill</h2>
<p><strong>${esc(p.product.name)}</strong>${p.variant_label ? ` — ${esc(p.variant_label)}` : ''} ×${p.quantity}</p>
${opts ? `<p><strong>Options:</strong> ${opts}</p>` : ''}
<p><strong>Order:</strong> ${esc(p.order_id)}<br>
<strong>Total paid:</strong> $${((p.amount_cents ?? 0) / 100).toFixed(2)}</p>
<h3 style="margin-bottom:4px;">Ship to</h3>
<p>${ship || '(no address)'}</p>
<h3 style="margin-bottom:4px;">Artwork</h3>
${art}
${p.notes ? `<h3 style="margin-bottom:4px;">Notes</h3><p>${esc(p.notes)}</p>` : ''}
<p style="color:#888;font-size:12px;">Customer: ${esc(p.talent.name ?? 'talent')}${p.talent.email ? ` (${esc(p.talent.email)})` : ''}</p>`
}
