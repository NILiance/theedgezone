import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('phyllo_social_stats')
    .select('platform, followers, avg_likes, avg_comments, avg_shares, engagement_rate, fetched_at, handle')
    .eq('user_id', user.id)

  const platforms: Record<string, unknown> = {}
  for (const row of data ?? []) platforms[row.platform] = row
  return NextResponse.json({ platforms })
}
