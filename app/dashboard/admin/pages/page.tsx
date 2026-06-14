import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { SERVICES } from '@/lib/services-data'
import { NewPageForm } from './new-page-form'

export const metadata = { title: 'Site Pages' }

export default async function PagesAdminPage() {
  await requireAdmin()
  const supabase = createServiceClient()
  if (!supabase) {
    return (
      <p className="rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-4 text-sm text-accent">
        Service role key missing.
      </p>
    )
  }
  const { data: cms } = await supabase
    .from('cms_pages')
    .select('id, slug, title, status, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-primary">Pages</p>
        <h2 className="text-display mt-1 text-2xl font-black tracking-tight">Site pages</h2>
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-eyebrow text-primary">CMS pages</p>
          <p className="text-xs text-muted-foreground">{(cms ?? []).length} pages</p>
        </div>
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Slug</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Updated</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(cms ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 text-display font-bold">{p.title}</td>
                  <td className="px-3 py-2 font-mono text-xs">/{p.slug}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        p.status === 'published'
                          ? 'bg-success/20 text-success'
                          : 'bg-panel-elevated text-muted-foreground'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <a
                      href={`/dashboard/admin/pages/${p.id}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Edit →
                    </a>
                  </td>
                </tr>
              ))}
              {(cms ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No CMS pages yet — create one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <NewPageForm />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-eyebrow text-primary">Service detail pages</p>
          <p className="text-xs text-muted-foreground">{SERVICES.length} services</p>
        </div>
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Service</th>
                <th className="px-3 py-2 text-left">Path</th>
                <th className="px-3 py-2 text-left">Audience</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2 text-display font-bold">{s.title}</td>
                  <td className="px-3 py-2 font-mono text-xs">/services/{s.id}</td>
                  <td className="px-3 py-2 text-xs uppercase tracking-widest">{s.audience.join(', ')}</td>
                  <td className="px-3 py-2 text-right">
                    <a
                      href={`/services/${s.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
