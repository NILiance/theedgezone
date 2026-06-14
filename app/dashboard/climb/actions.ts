'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const toggleSchema = z.object({
  milestone_id: z.string().uuid(),
  completed: z.coerce.boolean(),
})

export async function toggleClimbMilestone(formData: FormData) {
  const user = await requireUser()
  const parsed = toggleSchema.safeParse({
    milestone_id: formData.get('milestone_id'),
    completed: formData.get('completed') === 'on' || formData.get('completed') === 'true',
  })
  if (!parsed.success) throw new Error('Invalid form')
  const supabase = await createClient()
  if (parsed.data.completed) {
    await supabase.from('user_climb_progress').upsert({
      user_id: user.id,
      milestone_id: parsed.data.milestone_id,
      completed_at: new Date().toISOString(),
    })
  } else {
    await supabase
      .from('user_climb_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('milestone_id', parsed.data.milestone_id)
  }
  revalidatePath('/dashboard/climb')
}
