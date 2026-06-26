import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { SetupManager, type SetupTask } from './manager'

export const metadata = { title: 'Setup checklist' }

export default async function SetupPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing — that&apos;s the first hole to close. Set SUPABASE_SERVICE_ROLE_KEY,
        then this checklist loads.
      </p>
    )
  }

  const { data } = await supabase
    .from('setup_tasks')
    .select('id, title, detail, category, status, env_var, link, sort_order')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const tasks: SetupTask[] = (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    detail: t.detail ?? null,
    category: t.category ?? 'general',
    status: t.status ?? 'todo',
    env_var: t.env_var ?? null,
    link: t.link ?? null,
  }))

  // Server-side env detection — presence ONLY, values are never sent to the client.
  const envPresence: Record<string, boolean> = {}
  for (const t of tasks) {
    if (t.env_var && !(t.env_var in envPresence)) {
      envPresence[t.env_var] = Boolean(process.env[t.env_var])
    }
  }

  return <SetupManager tasks={tasks} envPresence={envPresence} />
}
