import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { getSupplier, syncSupplier } from '@/lib/suppliers'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Cron: fires nightly. Walks every enabled supplier and re-syncs catalog
 * via a default search query (supplier_code-specific or "shirt" fallback).
 *
 * NOTE: the Mock supplier has no real data; real suppliers should be
 * driven by the admin-configured queries. For v1 we just hit the
 * search() endpoint with no query so the implementations decide what to
 * return.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createServiceClient()
  if (!supabase) return NextResponse.json({ error: 'Service role missing' }, { status: 500 })

  const { data: rows } = await supabase
    .from('supplier_credentials')
    .select('supplier_code, enabled')
    .eq('enabled', true)

  const results: Array<{ code: string; ok: boolean; synced: number; error?: string }> = []
  for (const r of rows ?? []) {
    const s = await getSupplier(r.supplier_code)
    if (!s.ok) {
      results.push({ code: r.supplier_code, ok: false, synced: 0, error: s.error })
      continue
    }
    const sync = await syncSupplier(s.supplier)
    if (!sync.ok) {
      results.push({ code: r.supplier_code, ok: false, synced: 0, error: sync.error })
      continue
    }
    results.push({ code: r.supplier_code, ok: true, synced: sync.synced })
  }
  return NextResponse.json({ results })
}
