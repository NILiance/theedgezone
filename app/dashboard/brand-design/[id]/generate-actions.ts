'use server'

import { revalidatePath } from 'next/cache'
import { generateConcepts } from '@/app/dashboard/brand-design/actions'

export type GenerateState = { ok?: boolean; error?: string }

/**
 * Wrapper around the throwing generateConcepts server action so the
 * client `useActionState` form can render inline errors instead of
 * surfacing a generic Next error boundary.
 */
export async function generateConceptsAction(
  _prev: GenerateState,
  form: FormData
): Promise<GenerateState> {
  try {
    await generateConcepts(form)
    const brandId = String(form.get('brand_id') ?? '')
    if (brandId) revalidatePath(`/dashboard/brand-design/${brandId}`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return { error: message }
  }
}
