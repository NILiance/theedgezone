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
 * Custom-domain server actions. Backed by:
 * - public.custom_domains (storage of the mapping + verification state)
 * - Vercel Domains API (provisioning + DNS verification)
 * The edge middleware already routes any non-primary host through a
 * custom_domains lookup, so once a row is verified the host serves the
 * user's site automatically.
 */

const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

const connectSchema = z.object({
  site_id: z.string().uuid(),
  domain: z
    .string()
    .min(3)
    .max(253)
    .trim()
    .toLowerCase()
    .refine((d) => DOMAIN_RE.test(d), { message: 'That doesn’t look like a valid domain' }),
})

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
  instructions: {
    apex: { record: string; value: string }
    subdomain: { record: string; value: string }
  }
}

const DNS_INSTRUCTIONS = {
  apex: { record: 'A', value: '76.76.21.21' },
  subdomain: { record: 'CNAME', value: 'cname.vercel-dns.com' },
}

export async function connectDomain(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = connectSchema.safeParse({
    site_id: formData.get('site_id'),
    domain: formData.get('domain'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { data: site } = await supabase
    .from('sites')
    .select('id, user_id, slug')
    .eq('id', parsed.data.site_id)
    .single()
  if (!site || site.user_id !== user.id) return { ok: false, message: 'Site not found' }

  // Make sure another site isn't already using this domain.
  const { data: existing } = await supabase
    .from('custom_domains')
    .select('domain, user_id')
    .eq('domain', parsed.data.domain)
    .maybeSingle()
  if (existing && existing.user_id !== user.id) {
    return { ok: false, message: 'Domain already claimed by another account' }
  }

  // Insert (or update) the mapping. Verification flips on later via refresh.
  const { error: upsertErr } = await supabase.from('custom_domains').upsert(
    {
      domain: parsed.data.domain,
      target_type: 'site',
      target_slug: site.slug,
      user_id: user.id,
      cert_status: 'pending',
      verified_at: null,
    },
    { onConflict: 'domain' }
  )
  if (upsertErr) return { ok: false, message: upsertErr.message }

  // Mirror onto sites.custom_domain so the editor UI shows it.
  await supabase
    .from('sites')
    .update({ custom_domain: parsed.data.domain })
    .eq('id', site.id)

  // Ask Vercel to attach it.
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
      return {
        ok: false,
        message: `Saved locally, but Vercel rejected the domain: ${res.error}`,
      }
    }
  }

  revalidatePath(`/dashboard/sites/${site.id}`)
  return { ok: true, message: 'Domain saved. Update DNS, then click Refresh.' }
}

const refreshSchema = z.object({
  site_id: z.string().uuid(),
  domain: z.string().min(3).max(253),
})

export async function refreshDomain(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = refreshSchema.safeParse({
    site_id: formData.get('site_id'),
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

  // Pull domain + config from Vercel; trigger verification if not verified.
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
  if (config.ok && !config.data.misconfigured) {
    certStatus = 'ready'
  }

  await supabase
    .from('custom_domains')
    .update({
      cert_status: certStatus,
      verified_at: verifiedAt,
    })
    .eq('domain', parsed.data.domain)

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)

  if (certStatus === 'ready') return { ok: true, message: 'Domain is live.' }
  if (certStatus === 'provisioning') {
    return {
      ok: true,
      message: 'Verified. SSL is provisioning — usually a few minutes. Refresh again shortly.',
    }
  }
  return {
    ok: false,
    message: 'DNS not configured yet. Add the records below and try again.',
  }
}

const disconnectSchema = z.object({
  site_id: z.string().uuid(),
  domain: z.string().min(3).max(253),
})

export async function disconnectDomain(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser()
  const parsed = disconnectSchema.safeParse({
    site_id: formData.get('site_id'),
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
  await supabase
    .from('sites')
    .update({ custom_domain: null })
    .eq('id', parsed.data.site_id)

  if (vercelConfigured()) {
    await removeDomain(parsed.data.domain)
  }

  revalidatePath(`/dashboard/sites/${parsed.data.site_id}`)
  return { ok: true, message: 'Domain removed.' }
}

/** Server-side reader used by DomainTab to render its status panel. */
export async function readDomainStatus(domain: string): Promise<DomainStatus | null> {
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
    .select('cert_status, verified_at, vercel_domain_id')
    .eq('domain', domain)
    .maybeSingle()
  if (row) {
    result.verified = !!row.verified_at
    result.cert_status = row.cert_status
  }

  if (vercelConfigured()) {
    const [info, conf] = await Promise.all([
      getDomain(domain),
      getDomainConfig(domain),
    ])
    if (info.ok) {
      result.verified = info.data.verified
      result.vercel.verifying = !info.data.verified
      result.vercel.verification = info.data.verification
    } else {
      result.vercel.error = info.error
    }
    if (conf.ok) {
      result.vercel.misconfigured = conf.data.misconfigured
    }
  }

  return result
}
