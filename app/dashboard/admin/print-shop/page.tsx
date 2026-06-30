import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { formatEasternDate } from '@/lib/format-date'
import {
  updatePrintOrderStatus,
  savePrintFulfillmentSettings,
  sendPrintOrderToFulfillment,
} from './actions'

export const metadata = { title: 'Print Orders' }

export default async function AdminPrintOrdersPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: orders } = await supabase
    .from('print_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  // Fulfillment config (singleton row).
  const { data: fsettings } = await supabase
    .from('print_fulfillment_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  const fs = (fsettings ?? {}) as {
    auto_send?: boolean
    email_enabled?: boolean
    webhook_enabled?: boolean
    partner_email?: string | null
    webhook_url?: string | null
    webhook_auth_header?: string | null
  }

  const userIds = Array.from(new Set((orders ?? []).map((o) => o.user_id)))
  const productIds = Array.from(new Set((orders ?? []).map((o) => o.product_id)))
  const { data: products } = productIds.length
    ? await supabase.from('print_products').select('id, name').in('id', productIds)
    : { data: [] as { id: string; name: string }[] }
  const productById = new Map((products ?? []).map((p) => [p.id, p]))
  const profilesById = new Map<string, { display_name: string | null; email: string | null }>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    for (const p of profiles ?? []) profilesById.set(p.id, { display_name: p.display_name, email: null })
    const { data: usersRes } = await supabase.auth.admin.listUsers({ perPage: 200 })
    for (const u of usersRes?.users ?? []) {
      const existing = profilesById.get(u.id) ?? { display_name: null, email: null }
      profilesById.set(u.id, { ...existing, email: u.email ?? null })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Print orders</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Fulfillment queue</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Mark orders as in production / shipped / delivered and attach tracking when available.
        </p>
      </div>

      {/* Fulfillment settings */}
      <details className="rounded-[var(--radius)] border border-primary/40 bg-panel/40 p-4">
        <summary className="text-display cursor-pointer text-sm font-bold text-primary">
          ⚙ Fulfillment settings — {fs.auto_send ? 'auto-send ON' : 'manual approval'} ·{' '}
          {[fs.email_enabled ?? true ? 'email' : null, fs.webhook_enabled ? 'webhook' : null]
            .filter(Boolean)
            .join(' + ') || 'no channel'}
        </summary>
        <form action={savePrintFulfillmentSettings} className="mt-4 space-y-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="auto_send"
              defaultChecked={Boolean(fs.auto_send)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="text-display font-bold">Auto-send on payment</span>
              <span className="block text-xs text-muted-foreground">
                On = dispatch the instant Stripe confirms payment. Off = paid orders wait in a
                &ldquo;Ready to send&rdquo; state below for you to review the proof + ship-to and
                send.
              </span>
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="email_enabled"
                  defaultChecked={fs.email_enabled ?? true}
                  className="h-4 w-4"
                />
                <span className="text-display font-bold">Email a print partner</span>
              </label>
              <label className="mt-2 block text-xs">
                <span className="text-muted-foreground">Partner email</span>
                <input
                  name="partner_email"
                  type="email"
                  defaultValue={fs.partner_email ?? ''}
                  placeholder="orders@yourdecorator.com"
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="webhook_enabled"
                  defaultChecked={Boolean(fs.webhook_enabled)}
                  className="h-4 w-4"
                />
                <span className="text-display font-bold">POST to a webhook / API</span>
              </label>
              <label className="mt-2 block text-xs">
                <span className="text-muted-foreground">Webhook URL</span>
                <input
                  name="webhook_url"
                  type="url"
                  defaultValue={fs.webhook_url ?? ''}
                  placeholder="https://…/print-intake"
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </label>
              <label className="mt-2 block text-xs">
                <span className="text-muted-foreground">Authorization header (optional)</span>
                <input
                  name="webhook_auth_header"
                  defaultValue={fs.webhook_auth_header ?? ''}
                  placeholder="Bearer …"
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Save settings
          </button>
        </form>
      </details>

      <div className="space-y-3">
        {(orders ?? []).map((o) => {
          const product = productById.get(o.product_id)
          const owner = profilesById.get(o.user_id)
          const tone =
            o.status === 'delivered' || o.status === 'shipped'
              ? 'bg-success/20 text-success'
              : o.status === 'cancelled'
              ? 'bg-destructive/20 text-destructive'
              : o.status === 'paid' || o.status === 'in_production'
              ? 'bg-accent/20 text-accent'
              : 'bg-panel-elevated text-muted-foreground'
          return (
            <details key={o.id} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
              <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer list-none">
                <div className="min-w-0 flex-1">
                  <p className="text-display font-bold">{product?.name ?? 'Print order'}</p>
                  <p className="text-xs text-muted-foreground">
                    {owner?.display_name ?? owner?.email ?? '—'} · Qty {o.quantity} · $
                    {(o.amount_cents / 100).toFixed(2)} ·{' '}
                    {formatEasternDate(o.created_at)}
                  </p>
                </div>
                <span
                  className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
                >
                  {o.status.replace('_', ' ')}
                </span>
              </summary>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-eyebrow text-muted-foreground">Ship to</p>
                  <p className="mt-1">
                    {o.ship_to_name}
                    <br />
                    {o.ship_to_street}
                    <br />
                    {o.ship_to_city}, {o.ship_to_state} {o.ship_to_postal}
                  </p>
                </div>
                {o.variant_label && (
                  <p>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      Variant:
                    </span>{' '}
                    {o.variant_label}
                  </p>
                )}
                {o.options && Object.keys(o.options).length > 0 && (
                  <p>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      Options:
                    </span>{' '}
                    {Object.entries(o.options as Record<string, string>)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </p>
                )}
                {Array.isArray(o.artwork_urls) && o.artwork_urls.length > 0 && (
                  <div>
                    <p className="text-eyebrow text-muted-foreground">Proof / artwork</p>
                    <div className="mt-1 flex flex-wrap gap-3">
                      {(o.artwork_urls as string[]).map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="group flex flex-col items-center gap-1"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Artwork ${i + 1}`}
                            className="h-28 w-28 rounded-[var(--radius-sm)] border border-border bg-panel-elevated object-contain group-hover:border-primary"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary group-hover:underline">
                            Download
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {o.notes && (
                  <div>
                    <p className="text-eyebrow text-muted-foreground">Notes</p>
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">{o.notes}</p>
                  </div>
                )}
                {/* Fulfillment handoff */}
                {(() => {
                  const fstatus =
                    (o as { fulfillment_status?: string }).fulfillment_status ?? 'pending'
                  const fchannel = (o as { fulfillment_channel?: string | null }).fulfillment_channel
                  const ferror = (o as { fulfillment_error?: string | null }).fulfillment_error
                  const fsent = (o as { fulfillment_sent_at?: string | null }).fulfillment_sent_at
                  const ftone =
                    fstatus === 'sent'
                      ? 'bg-success/20 text-success'
                      : fstatus === 'failed'
                      ? 'bg-destructive/20 text-destructive'
                      : fstatus === 'ready'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-panel-elevated text-muted-foreground'
                  const isPaid = o.status !== 'draft' && o.status !== 'cancelled'
                  return (
                    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-background/40 p-3">
                      <div className="min-w-0">
                        <p className="text-eyebrow text-muted-foreground">Fulfillment</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${ftone}`}
                          >
                            {fstatus}
                          </span>
                          {fchannel && <span className="text-muted-foreground">via {fchannel}</span>}
                          {fsent && (
                            <span className="text-muted-foreground">· {formatEasternDate(fsent)}</span>
                          )}
                        </p>
                        {ferror && <p className="mt-1 text-[11px] text-destructive">{ferror}</p>}
                      </div>
                      {isPaid && (
                        <form action={sendPrintOrderToFulfillment} className="ml-auto">
                          <input type="hidden" name="order_id" value={o.id} />
                          <button
                            type="submit"
                            className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
                          >
                            {fstatus === 'sent' ? 'Resend to fulfillment' : 'Send to fulfillment'}
                          </button>
                        </form>
                      )}
                    </div>
                  )
                })()}
                <form
                  action={updatePrintOrderStatus}
                  className="grid gap-3 rounded-[var(--radius-sm)] border border-border bg-background/40 p-3 sm:grid-cols-4"
                >
                  <input type="hidden" name="order_id" value={o.id} />
                  <select
                    name="status"
                    defaultValue={o.status}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="paid">Paid</option>
                    <option value="in_production">In production</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input
                    name="tracking_number"
                    placeholder="Tracking #"
                    defaultValue={o.tracking_number ?? ''}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <input
                    name="carrier"
                    placeholder="Carrier"
                    defaultValue={o.carrier ?? ''}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <button
                    type="submit"
                    className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
                  >
                    Update
                  </button>
                </form>
              </div>
            </details>
          )
        })}
        {(orders ?? []).length === 0 && (
          <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-6 text-center text-sm text-muted-foreground">
            No print orders yet.
          </p>
        )}
      </div>
    </div>
  )
}
