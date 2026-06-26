import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'My Assets' }

interface KitFile {
  name: string
  label?: string
  url?: string
}

export default async function MyAssetsPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: brands } = await supabase
    .from('brand_designs')
    .select('id, brand_name, final_logo_url, admin_final_logo_url, kit_files, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const withAssets = (brands ?? []).filter((b) => {
    const files = Array.isArray((b as { kit_files?: unknown }).kit_files)
      ? ((b as { kit_files: KitFile[] }).kit_files)
      : []
    return files.length > 0 || b.final_logo_url || (b as { admin_final_logo_url?: string }).admin_final_logo_url
  })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <p className="text-eyebrow mt-3 text-accent">My Assets</p>
        <h1 className="text-display mt-1 text-3xl font-black tracking-tight">
          Download your brand assets
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Everything we&apos;ve made for you — logos and brand kit files — always available to
          download, any time.
        </p>
      </div>

      {withAssets.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-8 text-center text-sm text-muted-foreground">
          No delivered assets yet.{' '}
          <Link href="/dashboard/brand-design" className="text-primary hover:underline">
            Start a brand design →
          </Link>
        </p>
      ) : (
        <div className="space-y-5">
          {withAssets.map((b) => {
            const logo =
              (b as { admin_final_logo_url?: string | null }).admin_final_logo_url ||
              b.final_logo_url ||
              null
            const files = (
              Array.isArray((b as { kit_files?: unknown }).kit_files)
                ? ((b as { kit_files: KitFile[] }).kit_files)
                : []
            ).filter((f) => f.url)
            return (
              <section
                key={b.id}
                className="rounded-[var(--radius)] border border-border bg-panel/40 p-5"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt=""
                        className="h-12 w-12 rounded-[var(--radius-sm)] border border-border bg-white object-contain p-1"
                      />
                    )}
                    <div>
                      <p className="text-display font-bold">{b.brand_name || 'Brand'}</p>
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        {b.status}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/brand-design/${b.id}`}
                    className="text-display rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-panel"
                  >
                    Open studio →
                  </Link>
                </div>

                {files.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Brand kit is still being assembled. Your logo is ready below.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {files.map((f, i) => (
                      <a
                        key={i}
                        href={f.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-panel-elevated/30 px-3 py-2 text-xs hover:border-primary/40"
                      >
                        <span className="truncate">{f.label || f.name}</span>
                        <span className="text-primary">↓</span>
                      </a>
                    ))}
                  </div>
                )}

                {logo && (
                  <a
                    href={logo}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-bold text-primary hover:underline"
                  >
                    ↓ Download final logo
                  </a>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
