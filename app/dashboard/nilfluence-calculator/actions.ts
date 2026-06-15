'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  computeNilfluence,
  computeBMS,
  type NilfluenceInput,
  type BrandMatchInput,
} from '@/lib/nilfluence'
import { env } from '@/lib/env'

export type CalcState = {
  ok?: boolean
  error?: string
  resultId?: string
  nilfluenceScore?: number
  bms?: number
  synced?: boolean
  syncError?: string
}

function num(form: FormData, key: string, fallback = 0): number {
  const raw = form.get(key)
  if (raw == null) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export async function runCalculator(_prev: CalcState, form: FormData): Promise<CalcState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const inputs: NilfluenceInput = {
    instagram: {
      followers: num(form, 'ig_followers'),
      likes_per_post: num(form, 'ig_likes'),
      comments_per_post: num(form, 'ig_comments'),
      shares_per_post: num(form, 'ig_shares'),
    },
    tiktok: {
      followers: num(form, 'tt_followers'),
      likes_per_post: num(form, 'tt_likes'),
      comments_per_post: num(form, 'tt_comments'),
      shares_per_post: num(form, 'tt_shares'),
    },
    twitter: {
      followers: num(form, 'tw_followers'),
      likes_per_post: num(form, 'tw_likes'),
      comments_per_post: num(form, 'tw_comments'),
      shares_per_post: num(form, 'tw_shares'),
    },
    youtube: {
      followers: num(form, 'yt_subscribers'),
      likes_per_post: num(form, 'yt_likes'),
      comments_per_post: num(form, 'yt_comments'),
      shares_per_post: num(form, 'yt_shares'),
    },
    athlete_popularity: num(form, 'athlete_popularity'),
    team_popularity: num(form, 'team_popularity'),
    market_size: num(form, 'market_size'),
    adjustment_factor: num(form, 'adjustment_factor'),
    profit_per_product: num(form, 'profit_per_product') || undefined,
    purchase_conversion_rate:
      num(form, 'purchase_conversion_rate') > 0
        ? num(form, 'purchase_conversion_rate') / 100
        : undefined,
  }

  const nilf = computeNilfluence(inputs)

  const bmsInput: BrandMatchInput = {
    i: num(form, 'bms_i'),
    d: num(form, 'bms_d'),
    o: num(form, 'bms_o'),
  }
  const bms = computeBMS(bmsInput)

  const result = { nilfluence: nilf, bms }

  // Persist the calculation. user_id may be null for anonymous runs.
  let resultId: string | undefined
  try {
    const service = createServiceClient() ?? supabase
    const { data: inserted } = await service
      .from('nilfluence_calculations')
      .insert({
        user_id: user?.id ?? null,
        inputs: { nilfluence: inputs, bms: bmsInput },
        result,
      })
      .select('id')
      .single()
    resultId = inserted?.id
  } catch {
    // Persistence failure shouldn't block the user from seeing the result.
  }

  const sendToNiliance = form.get('send_to_niliance') === 'on'
  let synced = false
  let syncError: string | undefined
  if (sendToNiliance) {
    const r = await pushToNiliance({
      user_id: user?.id ?? null,
      result_id: resultId ?? null,
      inputs: { nilfluence: inputs, bms: bmsInput },
      result,
    })
    if (r.ok) {
      synced = true
      if (resultId) {
        try {
          const service = createServiceClient() ?? supabase
          await service
            .from('nilfluence_calculations')
            .update({ niliance_synced_at: new Date().toISOString() })
            .eq('id', resultId)
        } catch {
          // best-effort
        }
      }
    } else {
      syncError = r.error
      if (resultId) {
        try {
          const service = createServiceClient() ?? supabase
          await service
            .from('nilfluence_calculations')
            .update({ niliance_error: syncError })
            .eq('id', resultId)
        } catch {
          // best-effort
        }
      }
    }
  }

  revalidatePath('/dashboard/nilfluence-calculator')
  return {
    ok: true,
    resultId,
    nilfluenceScore: nilf.nilfluence_score,
    bms: bms.bms_100,
    synced,
    syncError,
  }
}

async function pushToNiliance(payload: {
  user_id: string | null
  result_id: string | null
  inputs: unknown
  result: unknown
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = env.NILIANCE_BASE_URL
  if (!base) return { ok: false, error: 'NILIANCE_BASE_URL is not configured' }
  const apiKey = process.env.NILIANCE_API_KEY ?? ''
  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/integrations/nilfluence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `NILiance HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}
