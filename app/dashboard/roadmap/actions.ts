'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const toggleSchema = z.object({
  item_id: z.string().uuid(),
  completed: z.coerce.boolean(),
})

export async function toggleRoadmapItem(formData: FormData) {
  const user = await requireUser()
  const parsed = toggleSchema.safeParse({
    item_id: formData.get('item_id'),
    completed: formData.get('completed') === 'on' || formData.get('completed') === 'true',
  })
  if (!parsed.success) throw new Error('Invalid form')

  const supabase = await createClient()
  if (parsed.data.completed) {
    await supabase
      .from('user_roadmap_progress')
      .upsert({ user_id: user.id, item_id: parsed.data.item_id, completed_at: new Date().toISOString() })
  } else {
    await supabase
      .from('user_roadmap_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', parsed.data.item_id)
  }
  revalidatePath('/dashboard/roadmap')
}
