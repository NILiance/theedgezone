'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { saveCmsPage, deleteCmsPageFromEdit, type EditState } from './actions'

type Page = {
  id: string
  slug: string
  title: string
  status: string
  body_md: string
  seo_title: string | null
  seo_description: string | null
}

export function EditPageForm({ page }: { page: Page }) {
  const router = useRouter()
  const [state, action, pending] = useActionState<EditState, FormData>(saveCmsPage, {})
  const [delState, delAction, delPending] = useActionState<EditState, FormData>(deleteCmsPageFromEdit, {})

  if (delState.deleted) {
    router.push('/dashboard/admin/pages')
  }

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={page.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground">Title</span>
            <input
              name="title"
              defaultValue={page.title}
              required
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground">Status</span>
            <select
              name="status"
              defaultValue={page.status}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground">SEO title</span>
            <input
              name="seo_title"
              defaultValue={page.seo_title ?? ''}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs text-muted-foreground">SEO description</span>
            <input
              name="seo_description"
              defaultValue={page.seo_description ?? ''}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="block text-xs text-muted-foreground">Body (Markdown)</span>
          <textarea
            name="body_md"
            rows={20}
            defaultValue={page.body_md}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background p-2 font-mono text-sm"
          />
        </label>
        {state.error && (
          <p className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="rounded-[var(--radius-sm)] border border-success/40 bg-success/5 p-3 text-sm text-success">
            Page saved.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save page'}
          </button>
          {page.status === 'published' && (
            <a
              href={`/p/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-display rounded-[var(--radius-sm)] border border-border bg-panel/40 px-5 py-2 text-sm font-bold uppercase tracking-widest"
            >
              View live →
            </a>
          )}
        </div>
      </form>

      <form action={delAction} className="rounded-[var(--radius)] border border-destructive/30 bg-destructive/5 p-4">
        <input type="hidden" name="id" value={page.id} />
        <p className="text-eyebrow text-destructive">Danger zone</p>
        <p className="mt-1 text-xs text-muted-foreground">Deletes this page permanently.</p>
        <button
          type="submit"
          disabled={delPending}
          className="mt-3 text-display rounded-[var(--radius-sm)] border border-destructive bg-destructive/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-destructive disabled:opacity-50"
        >
          {delPending ? 'Deleting…' : 'Delete page'}
        </button>
        {delState.error && <p className="mt-2 text-xs text-destructive">{delState.error}</p>}
      </form>
    </div>
  )
}
