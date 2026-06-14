'use server'

import { redirect } from 'next/navigation'
import { clearBrandClientSession } from '@/lib/brand-client-auth'

export async function brandClientLogout() {
  await clearBrandClientSession()
  redirect('/brand-portal')
}
