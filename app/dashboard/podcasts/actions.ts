'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { provisionPodcast } from '@/lib/provisioning'

export async function createPodcast(formData?: FormData) {
  const user = await requireUser()
  const supabase = await createClient()
  const fromProfile = formData ? formData.get('from_profile') !== 'no' : true
  const result = await provisionPodcast(supabase, user.id, undefined, { fromProfile })
  if (!result.entity_id) throw new Error('Failed to create podcast')
  redirect(`/dashboard/podcasts/${result.entity_id}`)
}
