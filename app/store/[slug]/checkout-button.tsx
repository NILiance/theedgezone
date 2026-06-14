'use client'

import { useState, useTransition } from 'react'

interface Props {
  storeId: string
  productId: string
  buttonColor: string
  buttonText: string
}

export function StoreCheckoutButton({ storeId, productId, buttonColor, buttonText }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = () => {
    if (!email) {
      setError('Email required.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/store-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: storeId,
            product_id: productId,
            buyer_email: email,
            buyer_name: name || undefined,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Checkout failed')
          return
        }
        const data = await res.json()
        if (data.url) window.location.href = data.url
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed')
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md px-4 py-2 text-xs font-bold uppercase tracking-widest"
        style={{ background: buttonColor, color: buttonText }}
      >
        Buy now
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <input
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-neutral-300 p-2 text-xs"
      />
      <input
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-neutral-300 p-2 text-xs"
      />
      {error && <p className="text-[10px]" style={{ color: '#dc2626' }}>{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !email}
        className="w-full rounded-md px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-60"
        style={{ background: buttonColor, color: buttonText }}
      >
        {isPending ? 'Loading…' : 'Continue to checkout'}
      </button>
    </div>
  )
}
