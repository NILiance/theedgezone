'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { sharetribeEnabled } from '@/lib/sharetribe'
import { pullProfileFromNiliance } from '@/lib/niliance'

/**
 * Admin "Sync from NILiance" for a specific talent — pulls their NILiance
 * profile (incl. niliance_listing_id/slug) into Edge Zone. Same inbound pull
 * the talent can run on their own profile, but admin-triggerable per user.
 */
export async function adminSyncNiliance(
  userId: string
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin()
  if (!userId) return { ok: false, message: 'Missing user id.' }
  if (!sharetribeEnabled) {
    return { ok: false, message: 'NILiance isn’t connected on this site yet.' }
  }
  const res = await pullProfileFromNiliance({ userId })
  revalidatePath('/dashboard/admin/niliance')
  if (!res.ok) return { ok: false, message: res.error ?? 'Sync failed.' }
  return {
    ok: true,
    message: res.fields
      ? `Pulled ${res.fields} field${res.fields === 1 ? '' : 's'} from NILiance.`
      : 'Connected, but no data was found to pull in.',
  }
}
