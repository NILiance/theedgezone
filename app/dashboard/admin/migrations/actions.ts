'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

type RpcResult = Promise<{ error: { message: string } | null }>

/**
 * Reconciliation actions for the Migrations dashboard. Because migrations
 * are applied via the Supabase SQL editor (not the CLI), the admin may
 * need to manually flip a version's recorded status to match reality.
 */
export async function markMigrationApplied(
  version: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, error: 'Service role key missing.' }
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => RpcResult
  const { error } = await rpc('record_migration', { p_version: version })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/admin/migrations')
  return { ok: true }
}

export async function markMigrationPending(
  version: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) return { ok: false, error: 'Service role key missing.' }
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => RpcResult
  const { error } = await rpc('unrecord_migration', { p_version: version })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/admin/migrations')
  return { ok: true }
}
