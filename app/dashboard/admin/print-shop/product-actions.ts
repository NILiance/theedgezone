'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/provisioning'

const CATEGORIES = [
  'banner',
  'business_card',
  'flyer',
  'poster',
  'sticker',
  'apparel',
  'signage',
  'other',
]

/**
 * Revalidate every surface a product (and its logo placement) appears on — the
 * admin manager, the talent catalog + item pages, and the brand-design Print
 * Shop tab — so a saved placement/price shows up everywhere, not just in admin.
 */
function revalidatePrintShop() {
  revalidatePath('/dashboard/admin/print-shop/products')
  revalidatePath('/dashboard/print-shop')
  revalidatePath('/dashboard/print-shop/[slug]', 'page')
  revalidatePath('/dashboard/brand-design/[id]', 'page')
}

/**
 * Create or update a Print Shop product (admin only). Handles an optional cover
 * image upload. Pricing is entered in dollars and stored as cents.
 */
export async function upsertPrintProduct(form: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')

  const id = String(form.get('id') ?? '').trim()
  const name = String(form.get('name') ?? '').trim()
  if (!name) throw new Error('Product name is required')
  const slug = String(form.get('slug') ?? '').trim() || slugify(name)
  const description = String(form.get('description') ?? '').trim() || null
  const categoryRaw = String(form.get('category') ?? 'other')
  const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : 'other'
  const basePriceCents = Math.max(1, Math.round(Number(form.get('base_price') ?? 0) * 100))
  const leadTimeDays = Math.max(0, Math.round(Number(form.get('lead_time_days') ?? 7) || 7))
  const active = form.get('active') === 'on' || form.get('active') === '1'
  const position = Math.round(Number(form.get('position') ?? 0)) || 0

  // Optional cover image — upload to storage, else keep the existing URL.
  let coverUrl = String(form.get('cover_image_url') ?? '').trim() || null
  const file = form.get('cover_image')
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) throw new Error('Image too large — max 10MB.')
    const buf = Buffer.from(await file.arrayBuffer())
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `print-products/${slug}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('brand-assets')
      .upload(path, new Uint8Array(buf), { contentType: file.type || 'image/png', upsert: true })
    if (upErr) throw new Error(`Cover upload failed: ${upErr.message}`)
    coverUrl = supabase.storage.from('brand-assets').getPublicUrl(path).data.publicUrl
  }

  const row: Record<string, unknown> = {
    name,
    slug,
    description,
    category,
    base_price_cents: basePriceCents,
    lead_time_days: leadTimeDays,
    active,
    position,
    updated_at: new Date().toISOString(),
  }
  if (coverUrl) row.cover_image_url = coverUrl

  // Cost breakdown — our blank cost + decoration; base_price_cents is retail.
  row.cost_cents = Math.max(0, Math.round(Number(form.get('cost') ?? 0) * 100))
  row.print_cost_cents = Math.max(0, Math.round(Number(form.get('print_cost') ?? 0) * 100))

  // Per-product logo placement (catalog overlay).
  const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5)
  row.logo_x = clamp01(Number(form.get('logo_x') ?? 0.5))
  row.logo_y = clamp01(Number(form.get('logo_y') ?? 0.5))
  row.logo_scale = Math.max(0.05, Math.min(0.95, Number(form.get('logo_scale') ?? 0.3) || 0.3))

  const write = (r: Record<string, unknown>) =>
    id
      ? supabase.from('print_products').update(r).eq('id', id)
      : supabase.from('print_products').insert(r)

  let res = await write(row)
  if (res.error && /logo_(x|y|scale)|cost_cents|print_cost_cents|column/i.test(res.error.message)) {
    // Placement / cost migration not applied yet — save the rest.
    const { logo_x, logo_y, logo_scale, cost_cents, print_cost_cents, ...rest } = row
    void logo_x
    void logo_y
    void logo_scale
    void cost_cents
    void print_cost_cents
    res = await write(rest)
  }
  if (res.error) throw new Error(res.error.message)
  revalidatePrintShop()
}

/** Normalize a supplier color/size option list (strings or objects) into a
 *  deduped string[] for the Print Shop order-form dropdowns. */
function optionValues(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of raw) {
    let s = ''
    if (typeof v === 'string') s = v
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      s = String(
        o.name ?? o.label ?? o.value ?? o.color ?? o.colorName ?? o.size ?? o.sizeName ?? ''
      )
    }
    s = s.trim()
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase())
      out.push(s)
    }
    if (out.length >= 40) break
  }
  return out
}

/**
 * Import a synced supplier-catalog product (e.g. an S&S Activewear apparel
 * blank) into the Print Shop as a print_product — copying its name, image,
 * price, description and color/size options. Admin only. Requires the supplier
 * to be connected + synced under /dashboard/admin/suppliers.
 */
export async function importSupplierToPrintShop(form: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const spId = String(form.get('supplier_product_id') ?? '').trim()
  if (!spId) throw new Error('Missing supplier product id')

  const { data: sp } = await supabase
    .from('supplier_products')
    .select(
      'name, description, supplier_sku, suggested_msrp_cents, base_price_cents, wholesale_price_cents, primary_image_url, color_options, size_options, attributes'
    )
    .eq('id', spId)
    .single()
  if (!sp) throw new Error('Supplier product not found')

  let slug = slugify(String(sp.name))
  const { data: clash } = await supabase
    .from('print_products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (clash) {
    const suffix = String(sp.supplier_sku ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 6)
    slug = `${slug}-${suffix || Math.floor(Math.random() * 9000 + 1000)}`
  }

  // Our cost = supplier wholesale (fall back to their base). Retail seeds from
  // MSRP; the admin sets print cost + final retail afterward.
  const cost = Number(sp.wholesale_price_cents) || Number(sp.base_price_cents) || 0
  const price =
    Number(sp.suggested_msrp_cents) || Number(sp.base_price_cents) || Number(sp.wholesale_price_cents) || 1999

  // Carry the supplier's colour + size options into the order-form dropdowns.
  const colors = optionValues((sp as Record<string, unknown>).color_options)
  const sizes = optionValues((sp as Record<string, unknown>).size_options)
  // Per-color product photos (captured at sync) → live color preview on the product page.
  const colorImages =
    ((sp as Record<string, unknown>).attributes as { colorImages?: Record<string, string> } | null)
      ?.colorImages ?? {}
  const options: Array<{
    key: string
    label: string
    values: string[]
    images?: Record<string, string>
  }> = []
  if (colors.length)
    options.push({ key: 'color', label: 'Color', values: colors, images: colorImages })
  if (sizes.length) options.push({ key: 'size', label: 'Size', values: sizes })

  const insertRow: Record<string, unknown> = {
    name: String(sp.name),
    slug,
    description: (sp.description as string | null) ?? null,
    category: 'apparel',
    base_price_cents: Math.max(1, Math.round(price)),
    cost_cents: Math.max(0, Math.round(cost)),
    print_cost_cents: 0,
    cover_image_url: (sp.primary_image_url as string | null) ?? null,
    options,
    active: true,
    position: 0,
    updated_at: new Date().toISOString(),
  }
  let { error } = await supabase.from('print_products').insert(insertRow)
  if (error && /cost_cents|print_cost_cents|column/i.test(error.message)) {
    // Cost migration not applied yet — import without the cost fields.
    const { cost_cents, print_cost_cents, ...rest } = insertRow
    void cost_cents
    void print_cost_cents
    ;({ error } = await supabase.from('print_products').insert(rest))
  }
  if (error) throw new Error(error.message)
  revalidatePrintShop()
}

/** Delete a product (admin only). */
export async function deletePrintProduct(form: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const id = String(form.get('id') ?? '').trim()
  if (id) {
    const { error } = await supabase.from('print_products').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
  revalidatePrintShop()
}
