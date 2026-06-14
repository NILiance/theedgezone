'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  status?: string
  plan?: string
  q?: string
}

const STATUSES = ['paid', 'ready', 'provisioning', 'cancelled', 'refunded', 'pending']
const PLANS = ['onetime', 'monthly', 'annual']

export function OrdersFilters({ status, plan, q }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [search, setSearch] = useState(q ?? '')
  const [, startTransition] = useTransition()

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.push(`/dashboard/admin/orders?${next.toString()}`))
  }

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setParam('q', search.trim())
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status ?? ''}
        onChange={(e) => setParam('status', e.target.value)}
        className="flex h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={plan ?? ''}
        onChange={(e) => setParam('plan', e.target.value)}
        className="flex h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
      >
        <option value="">All plans</option>
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <form onSubmit={onSearch} className="flex items-center gap-1">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product title"
          className="h-10 min-w-[200px]"
        />
        <Button size="sm" type="submit" variant="outline">
          Search
        </Button>
      </form>
      {(status || plan || q) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setSearch('')
            startTransition(() => router.push('/dashboard/admin/orders'))
          }}
        >
          Clear
        </Button>
      )}
    </div>
  )
}
