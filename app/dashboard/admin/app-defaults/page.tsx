import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { AppDefaultsForm } from './form'

export const metadata = { title: 'App Defaults' }

export default async function AppDefaultsPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data } = await supabase.from('app_defaults').select('*').eq('id', 'default').maybeSingle()
  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">App Builder</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">App Defaults</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Defaults applied to every generated talent app. Talents can override these per-app.
        </p>
      </div>
      <AppDefaultsForm initial={data} />
    </div>
  )
}
