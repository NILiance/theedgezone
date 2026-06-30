'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  addDomain,
  getDomain,
  getDomainConfig,
  verifyDomain,
  removeDomain,
  vercelConfigured,
} from '@/lib/vercel-domains'

/**
 * Generic custom-domain actions for every tenant module (EPK, Podcast, Store,
 * App). Sites have their own equivalents. Backed by public.custom_domains +
 * the Vercel Domains API; the edge middleware routes any verified custom domain
 * to /{target_type}/{slug} automatically.
 */

const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

// target_type → { entity table, dashboard path segment }. target_type must match
// the route segment the middleware rewrites to (/epk, /podcast, /store, /a).
const TARGET: Record<string, { table: string; dash: string }> = {
  epk: { table: 'epks', dash: 'epks' },
  podcast: { table: 'podcasts', dash: 'podcasts' },
  store: { table: 'stores', dash: 'stores' },
  a: { table: 'talent_apps', dash: 'apps' },
}

const DNS_INSTRUCTIONS = {
  apex: { record: 'A', value: '76.76.21.21' },
  subdomain: { record: 'CNAME', value: 'cname.vercel-dns.com' },
}

export interface DomainStatus {
  domain: string
  verified: boolean
  cert_status: string
  vercel: {
    configured: boolean
    misconfigured?: boolean
    verifying?: boolean
    verification?: Array<{ type: string; domain: string; value: string; reason: string }>
    error?: string
  }
  instructions: { apex: { record: string; value: string }; subdomain: { record: string; value: string } }
}

const connectSchema = z.object({
  target_type: z.string(),
  entity_id: z.string().uuid(),
  domain: z
    .string()
    .min(3)
    .max(253)
    .trim()
    .toLowerCase()
    .refine((d) => DOMAIN_RE.test(d), { message: 'That doesn’t look like a valid domain' }),
})

async function resolveEntity(targetType: string, entityId: string, userId: string) {
  const t = TARGET[targetType]
  if (!t) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from(t.table)
    .select('id, user_id, slug')
    .eq('id', entityId)
    .single()
  if (!data || (data as { user_id?: string }).user_id !== userId) return null
  return { slug: (data as { slug: string }).slug, dash: t.dash }
}

export async function connectCustomDomain(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = connectSchema.safeParse({
    target_type: formData.get('target_type'),
    entity_id: formData.get('entity_id'),
    domain: formData.get('domain'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const ent = await resolveEntity(parsed.data.target_type, parsed.data.entity_id, user.id)
  if (!ent) return { ok: false, message: 'Not found' }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('custom_domains')
    .select('domain, user_id')
    .eq('domain', parsed.data.domain)
    .maybeSingle()
  if (existing && existing.user_id !== user.id) {
    return { ok: false, message: 'Domain already claimed by another account' }
  }

  const { error: upsertErr } = await supabase.from('custom_domains').upsert(
    {
      domain: parsed.data.domain,
      target_type: parsed.data.target_type,
      target_slug: ent.slug,
      user_id: user.id,
      cert_status: 'pending',
      verified_at: null,
    },
    { onConflict: 'domain' }
  )
  if (upsertErr) return { ok: false, message: upsertErr.message }

  if (vercelConfigured()) {
    const res = await addDomain(parsed.data.domain)
    if (res.ok) {
      await supabase
        .from('custom_domains')
        .update({
          vercel_domain_id: res.data.name,
          cert_status: res.data.verified ? 'provisioning' : 'pending',
        })
        .eq('domain', parsed.data.domain)
    } else {
      return { ok: false, message: `Saved locally, but Vercel rejected the domain: ${res.error}` }
    }
  }

  revalidatePath(`/dashboard/${ent.dash}/${parsed.data.entity_id}`)
  return { ok: true, message: 'Domain saved. Update DNS, then click Refresh.' }
}

const opSchema = z.object({
  target_type: z.string(),
  entity_id: z.string().uuid(),
  domain: z.string().min(3).max(253),
})

export async function refreshCustomDomain(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = opSchema.safeParse({
    target_type: formData.get('target_type'),
    entity_id: formData.get('entity_id'),
    domain: formData.get('domain'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: row } = await supabase
    .from('custom_domains')
    .select('domain, user_id')
    .eq('domain', parsed.data.domain)
    .maybeSingle()
  if (!row || row.user_id !== user.id) return { ok: false, message: 'Not your domain' }
  if (!vercelConfigured()) {
    return { ok: false, message: 'VERCEL_ACCESS_TOKEN not configured on the server.' }
  }

  const lookup = await getDomain(parsed.data.domain)
  if (!lookup.ok) return { ok: false, message: lookup.error }

  let verifiedAt: string | null = null
  let certStatus = 'pending'
  if (!lookup.data.verified) {
    const verify = await verifyDomain(parsed.data.domain)
    if (verify.ok && verify.data.verified) {
      verifiedAt = new Date().toISOString()
      certStatus = 'provisioning'
    }
  } else {
    verifiedAt = new Date().toISOString()
    certStatus = 'provisioning'
  }

  const config = await getDomainConfig(parsed.data.domain)
  if (config.ok && !config.data.misconfigured) certStatus = 'ready'

  await supabase
    .from('custom_domains')
    .update({ cert_status: certStatus, verified_at: verifiedAt })
    .eq('domain', parsed.data.domain)

  const dash = TARGET[parsed.data.target_type]?.dash
  if (dash) revalidatePath(`/dashboard/${dash}/${parsed.data.entity_id}`)

  if (certStatus === 'ready') return { ok: true, message: 'Domain is live.' }
  if (certStatus === 'provisioning') {
    return { ok: true, message: 'Verified. SSL is provisioning — usually a few minutes.' }
  }
  return { ok: false, message: 'DNS not configured yet. Add the records below and try again.' }
}

export async function disconnectCustomDomain(
  formData: FormData
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = opSchema.safeParse({
    target_type: formData.get('target_type'),
    entity_id: formData.get('entity_id'),
    domain: formData.get('domain'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: row } = await supabase
    .from('custom_domains')
    .select('domain, user_id')
    .eq('domain', parsed.data.domain)
    .maybeSingle()
  if (!row || row.user_id !== user.id) return { ok: false, message: 'Not your domain' }

  await supabase.from('custom_domains').delete().eq('domain', parsed.data.domain)
  if (vercelConfigured()) await removeDomain(parsed.data.domain)

  const dash = TARGET[parsed.data.target_type]?.dash
  if (dash) revalidatePath(`/dashboard/${dash}/${parsed.data.entity_id}`)
  return { ok: true, message: 'Domain removed.' }
}

/** Current custom domain mapped to an entity (by target_type + slug), or null. */
export async function getEntityDomain(targetType: string, slug: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('custom_domains')
    .select('domain')
    .eq('target_type', targetType)
    .eq('target_slug', slug)
    .maybeSingle()
  return (data as { domain?: string } | null)?.domain ?? null
}

export async function readCustomDomainStatus(domain: string): Promise<DomainStatus | null> {
  if (!domain) return null
  const result: DomainStatus = {
    domain,
    verified: false,
    cert_status: 'pending',
    vercel: { configured: vercelConfigured() },
    instructions: DNS_INSTRUCTIONS,
  }
  const supabase = await createClient()
  const { data: row } = await supabase
    .from('custom_domains')
    .select('cert_status, verified_at')
    .eq('domain', domain)
    .maybeSingle()
  if (row) {
    result.verified = !!row.verified_at
    result.cert_status = row.cert_status
  }
  if (vercelConfigured()) {
    const [info, conf] = await Promise.all([getDomain(domain), getDomainConfig(domain)])
    if (info.ok) {
      result.verified = info.data.verified
      result.vercel.verifying = !info.data.verified
      result.vercel.verification = info.data.verification
    } else {
      result.vercel.error = info.error
    }
    if (conf.ok) result.vercel.misconfigured = conf.data.misconfigured
  }
  return result
}
