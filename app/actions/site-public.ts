'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Server actions invoked from the PUBLIC site (not the dashboard).
 * No auth required — RLS public-insert policies gate the writes.
 *
 * Each action returns a small status object instead of throwing so the
 * client form can render the right confirmation without a try/catch.
 */

interface ActionResult {
  ok: boolean
  message?: string
}

// ── Guestbook ──────────────────────────────────────────────────────────────

const guestbookSchema = z.object({
  site_id: z.string().uuid(),
  block_id: z.string().uuid().optional(),
  display_name: z.string().min(1).max(80),
  message: z.string().min(1).max(1000),
  moderation_required: z.coerce.boolean().default(false),
})

export async function signGuestbook(formData: FormData): Promise<ActionResult> {
  const parsed = guestbookSchema.safeParse({
    site_id: formData.get('site_id'),
    block_id: formData.get('block_id') || undefined,
    display_name: formData.get('display_name'),
    message: formData.get('message'),
    moderation_required:
      formData.get('moderation_required') === 'true' ||
      formData.get('moderation_required') === 'on',
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]!.message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('site_guestbook_entries').insert({
    site_id: parsed.data.site_id,
    block_id: parsed.data.block_id ?? null,
    display_name: parsed.data.display_name,
    message: parsed.data.message,
    approved: !parsed.data.moderation_required,
  })
  if (error) return { ok: false, message: error.message }

  // Revalidate the public site so the new entry shows immediately.
  const { data: site } = await supabase
    .from('sites')
    .select('slug')
    .eq('id', parsed.data.site_id)
    .single()
  if (site?.slug) revalidatePath(`/site/${site.slug}`)
  return {
    ok: true,
    message: parsed.data.moderation_required ? 'Submitted — awaiting approval.' : 'Signed.',
  }
}

// ── Poll vote ──────────────────────────────────────────────────────────────

const voteSchema = z.object({
  site_id: z.string().uuid(),
  block_id: z.string().uuid(),
  option_value: z.string().min(1).max(200),
  voter_token: z.string().min(8).max(80),
})

export async function voteOnPoll(formData: FormData): Promise<ActionResult> {
  const parsed = voteSchema.safeParse({
    site_id: formData.get('site_id'),
    block_id: formData.get('block_id'),
    option_value: formData.get('option_value'),
    voter_token: formData.get('voter_token'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { error } = await supabase.from('site_poll_votes').insert({
    site_id: parsed.data.site_id,
    block_id: parsed.data.block_id,
    option_value: parsed.data.option_value,
    voter_token: parsed.data.voter_token,
  })
  if (error) {
    // Unique-constraint violation = already voted from this browser
    if (error.message.toLowerCase().includes('duplicate')) {
      return { ok: false, message: 'You already voted from this browser.' }
    }
    return { ok: false, message: error.message }
  }
  return { ok: true, message: 'Thanks for voting.' }
}

// ── Email capture ─────────────────────────────────────────────────────────

const emailSchema = z.object({
  site_id: z.string().uuid(),
  email: z.string().email().max(160),
  source: z.string().max(120).optional(),
})

export async function captureEmail(formData: FormData): Promise<ActionResult> {
  const parsed = emailSchema.safeParse({
    site_id: formData.get('site_id'),
    email: formData.get('email'),
    source: formData.get('source') || undefined,
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  const supabase = await createClient()
  const { error } = await supabase.from('site_subscribers').insert({
    site_id: parsed.data.site_id,
    email: parsed.data.email,
    source: parsed.data.source ?? null,
  })
  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      return { ok: true, message: "You're already subscribed." }
    }
    return { ok: false, message: error.message }
  }
  return { ok: true, message: "You're in. Welcome aboard." }
}

// ── Contact form ──────────────────────────────────────────────────────────

const contactSchema = z.object({
  site_id: z.string().uuid(),
  block_id: z.string().uuid().optional(),
  page_id: z.string().uuid().optional(),
  payload: z.string(),
})

export async function submitContactForm(formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    site_id: formData.get('site_id'),
    block_id: formData.get('block_id') || undefined,
    page_id: formData.get('page_id') || undefined,
    payload: formData.get('payload'),
  })
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]!.message }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(parsed.data.payload)
  } catch {
    return { ok: false, message: 'Invalid form payload' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('site_submissions').insert({
    site_id: parsed.data.site_id,
    block_id: parsed.data.block_id ?? null,
    page_id: parsed.data.page_id ?? null,
    payload,
  })
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Thanks — message received.' }
}
