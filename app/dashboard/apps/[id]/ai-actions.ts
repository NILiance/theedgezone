'use server'

import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

const MODEL = 'claude-sonnet-4-6'

// Field → generation instruction + token budget (legacy ez-app-mgr prompt set).
const FIELD_PROMPTS: Record<string, { instruction: string; maxTokens: number }> = {
  bio: { instruction: 'Write a compelling 2-3 sentence athlete bio, first person.', maxTokens: 400 },
  tagline: { instruction: 'Write one short, punchy tagline (max 60 characters).', maxTokens: 100 },
  about: {
    instruction:
      "Write a longer 'About Me' section, 3-4 short paragraphs, covering the athletic journey and what drives them. First person, conversational.",
    maxTokens: 1200,
  },
  achievements: {
    instruction: 'List 5 athletic achievements, one per line, plain text, no numbering or bullets.',
    maxTokens: 400,
  },
  announcement_title: {
    instruction: 'Write one short, attention-grabbing announcement title (max 60 chars). Just the title.',
    maxTokens: 80,
  },
  announcement: {
    instruction: 'Write a brief announcement post, 1-2 sentences. Just the text.',
    maxTokens: 300,
  },
  contact_intro: {
    instruction: 'Write a 1-2 sentence contact-section intro inviting collaborations and bookings. Professional.',
    maxTokens: 200,
  },
}

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  return res.content
    .filter((c): c is Anthropic.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^(here['’]s|sure[,!]?|okay[,!]?)\s+/i, '')
}

/** Generate copy for a single screen field, in the talent's voice. */
export async function generateAppContent(input: {
  appId: string
  field: string
  context?: string
}): Promise<{ ok: boolean; text?: string; error?: string }> {
  const user = await requireUser()
  if (!env.ANTHROPIC_API_KEY) return { ok: false, error: 'Generation is offline.' }
  const spec = FIELD_PROMPTS[input.field] ?? FIELD_PROMPTS.bio!
  const supabase = await createClient()
  const [{ data: app }, { data: profile }] = await Promise.all([
    supabase.from('talent_apps').select('name, tagline, user_id').eq('id', input.appId).maybeSingle(),
    supabase.from('profiles').select('display_name, sport, school').eq('id', user.id).maybeSingle(),
  ])
  if (!app || app.user_id !== user.id) return { ok: false, error: 'App not found.' }

  const who = [
    profile?.display_name,
    profile?.sport ? `${profile.sport} athlete` : null,
    profile?.school ? `at ${profile.school}` : null,
  ]
    .filter(Boolean)
    .join(', ')
  const prompt = `${spec.instruction}

Athlete: ${who || 'an athlete'}.${app.tagline ? ` Tagline: ${app.tagline}.` : ''}${input.context ? `\nContext: ${input.context}` : ''}

Return ONLY the requested text — no preamble, no quotes, no markdown.`

  try {
    return { ok: true, text: await callClaude(prompt, spec.maxTokens) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Generation failed.' }
  }
}

/** Generate a standard app privacy policy (HTML) from the app's details. */
export async function generateAppPrivacyPolicy(
  appId: string
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const user = await requireUser()
  if (!env.ANTHROPIC_API_KEY) return { ok: false, error: 'Generation is offline.' }
  const supabase = await createClient()
  const { data: app } = await supabase
    .from('talent_apps')
    .select('name, settings, store_listing, user_id')
    .eq('id', appId)
    .maybeSingle()
  if (!app || app.user_id !== user.id) return { ok: false, error: 'App not found.' }

  const settings = (app.settings ?? {}) as Record<string, unknown>
  const listing = (app.store_listing ?? {}) as Record<string, unknown>
  const email =
    (typeof settings.contact_email === 'string' && settings.contact_email) ||
    (typeof listing.support_email === 'string' && listing.support_email) ||
    'the app owner'

  const prompt = `Write a clean, standard mobile-app privacy policy as plain HTML (use <h2> and <p> and <ul> tags only) for an app called "${app.name}". Include these sections: Information We Collect, How We Use Your Information, Data Sharing, Third-Party Services, Data Security, Your Rights, Children's Privacy, Changes to This Policy, and Contact Us (email: ${email}). Keep it concise but complete and generic enough for an athlete's fan app. Return ONLY the HTML, no markdown code fences.`

  try {
    return { ok: true, text: await callClaude(prompt, 1600) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Generation failed.' }
  }
}
