import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { processOutbox } from '@/lib/sharetribe-sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Reconciliation job: drains the Sharetribe sync outbox, retrying failed/stale
 * events with backoff. Registered in vercel.json. Guarded by CRON_SECRET.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await processOutbox({ limit: 100 })
  return NextResponse.json({ ok: true, ...result })
}
