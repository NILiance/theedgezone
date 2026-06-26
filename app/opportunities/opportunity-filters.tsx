'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { OFFERING_FILTERS } from '@/lib/opportunities'

export function OpportunityFilters({ q, category }: { q: string; category: string }) {
  const router = useRouter()
  const [search, setSearch] = useState(q)
  const [pending, start] = useTransition()

  const apply = (next: { q?: string; category?: string }) => {
    const params = new URLSearchParams()
    const newQ = next.q ?? search
    const newCat = next.category ?? category
    if (newQ.trim()) params.set('q', newQ.trim())
    if (newCat) params.set('category', newCat)
    start(() => router.push(`/opportunities${params.toString() ? `?${params}` : ''}`))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        apply({})
      }}
      className="mt-6 flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-border bg-panel/40 p-3"
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search keywords"
        className="min-w-[200px] flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
      />
      <select
        value={category}
        onChange={(e) => apply({ category: e.target.value })}
        className="h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
      >
        {OFFERING_FILTERS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
