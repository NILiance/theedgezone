import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

/**
 * POST /api/phyllo/sync
 *
 * Pulls the talent's connected Phyllo accounts and caches per-platform
 * stats in phyllo_social_stats. Talent triggers this from the calculator
 * via a "Pull from socials" button.
 *
 * Maps:
 *   IG       → work_platform.name = 'Instagram'
 *   TikTok   → 'TikTok'
 *   Twitter  → 'Twitter' or 'X'
 *   YouTube  → 'YouTube'
 */
export async function POST() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('phyllo_user_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.phyllo_user_id) {
    return NextResponse.json({ error: 'Connect Phyllo first' }, { status: 400 })
  }
  if (!env.PHYLLO_CLIENT_ID || !env.PHYLLO_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Phyllo not configured' }, { status: 503 })
  }

  const base =
    env.PHYLLO_ENVIRONMENT === 'production'
      ? 'https://api.getphyllo.com'
      : env.PHYLLO_ENVIRONMENT === 'staging'
      ? 'https://api.staging.getphyllo.com'
      : 'https://api.sandbox.getphyllo.com'
  const auth =
    'Basic ' +
    Buffer.from(`${env.PHYLLO_CLIENT_ID}:${env.PHYLLO_CLIENT_SECRET}`).toString('base64')

  // Pull all connected accounts for this Phyllo user.
  const accountsRes = await fetch(
    `${base}/v1/accounts?user_id=${encodeURIComponent(profile.phyllo_user_id)}`,
    { headers: { Authorization: auth } }
  )
  if (!accountsRes.ok) {
    const text = await accountsRes.text()
    return NextResponse.json(
      { error: `Phyllo accounts HTTP ${accountsRes.status}: ${text.slice(0, 200)}` },
      { status: 502 }
    )
  }
  const { data: accounts } = (await accountsRes.json()) as {
    data: Array<{
      id: string
      username?: string
      platform_username?: string
      work_platform?: { name?: string }
    }>
  }

  const platformMap: Record<string, 'instagram' | 'tiktok' | 'twitter' | 'youtube'> = {
    Instagram: 'instagram',
    TikTok: 'tiktok',
    Twitter: 'twitter',
    X: 'twitter',
    YouTube: 'youtube',
  }

  let synced = 0
  for (const acct of accounts ?? []) {
    const platform = platformMap[acct.work_platform?.name ?? '']
    if (!platform) continue

    // Profile snapshot for this account.
    const profRes = await fetch(`${base}/v1/social/profiles/${encodeURIComponent(acct.id)}`, {
      headers: { Authorization: auth },
    })
    if (!profRes.ok) continue
    const profJson = (await profRes.json()) as {
      reputation?: { follower_count?: number; engagement_rate?: number }
      platform_username?: string
      username?: string
    }
    const followers = profJson.reputation?.follower_count ?? 0
    const er = profJson.reputation?.engagement_rate ?? 0
    const handle = profJson.platform_username ?? profJson.username ?? acct.username ?? null

    // Recent content for like/comment/share averages.
    const contentRes = await fetch(
      `${base}/v1/social/contents?account_id=${encodeURIComponent(acct.id)}&limit=20`,
      { headers: { Authorization: auth } }
    )
    let avgLikes = 0
    let avgComments = 0
    let avgShares = 0
    if (contentRes.ok) {
      const { data: items } = (await contentRes.json()) as {
        data: Array<{
          engagement?: {
            like_count?: number
            comment_count?: number
            share_count?: number
            retweet_count?: number
          }
        }>
      }
      const arr = items ?? []
      if (arr.length > 0) {
        avgLikes = Math.round(arr.reduce((s, x) => s + (x.engagement?.like_count ?? 0), 0) / arr.length)
        avgComments = Math.round(
          arr.reduce((s, x) => s + (x.engagement?.comment_count ?? 0), 0) / arr.length
        )
        avgShares = Math.round(
          arr.reduce(
            (s, x) =>
              s + (x.engagement?.share_count ?? x.engagement?.retweet_count ?? 0),
            0
          ) / arr.length
        )
      }
    }

    await supabase
      .from('phyllo_social_stats')
      .upsert(
        {
          user_id: user.id,
          platform,
          handle,
          followers,
          avg_likes: avgLikes,
          avg_comments: avgComments,
          avg_shares: avgShares,
          engagement_rate: er,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' }
      )
    synced += 1
  }

  return NextResponse.json({ synced })
}
