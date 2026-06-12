'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import {
  upsertProduct,
  deleteProduct,
  upsertTier,
  deleteTier,
  upsertReward,
  deleteReward,
} from '@/app/dashboard/sites/actions'

export interface Product {
  id: string
  name: string
  description: string | null
  price_cents: number
  currency: string
  image_url: string | null
  active: boolean
}

export interface Tier {
  id: string
  name: string
  description: string | null
  price_cents: number
  billing_interval: string
  perks: string[]
  active: boolean
}

export interface Reward {
  id: string
  name: string
  description: string | null
  reward_type: string
  file_url: string | null
  image_url: string | null
  unlock_amount_cents: number
  required_tier_id: string | null
  active: boolean
}

interface Props {
  siteId: string
  products: Product[]
  tiers: Tier[]
  rewards: Reward[]
}

export function RevenueTab({ siteId, products, tiers, rewards }: Props) {
  const [section, setSection] = useState<'products' | 'tiers' | 'rewards'>('products')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['products', `Products (${products.length})`],
            ['tiers', `Membership tiers (${tiers.length})`],
            ['rewards', `Rewards (${rewards.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              section === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'products' && <ProductsList siteId={siteId} items={products} />}
      {section === 'tiers' && <TiersList siteId={siteId} items={tiers} />}
      {section === 'rewards' && <RewardsList siteId={siteId} items={rewards} tiers={tiers} />}
    </div>
  )
}

function ProductsList({ siteId, items }: { siteId: string; items: Product[] }) {
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [isPending, startTransition] = useTransition()

  if (editing) {
    return (
      <ProductEditor
        siteId={siteId}
        product={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    )
  }

  const handleDelete = (productId: string) => {
    if (!confirm('Delete this product?')) return
    const fd = new FormData()
    fd.set('product_id', productId)
    startTransition(async () => {
      try {
        await deleteProduct(fd)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Each product appears in the public Merch block. Stripe wiring lands next phase.
        </p>
        <Button size="sm" onClick={() => setEditing('new')}>
          + Add product
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No products yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40"
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-panel-elevated/40 text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <div className="p-3">
                <p className="text-display font-bold">{p.name}</p>
                <p className="text-sm text-primary">${(p.price_cents / 100).toFixed(2)}</p>
                {!p.active && (
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    Inactive
                  </p>
                )}
                <div className="mt-3 flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(p.id)}
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductEditor({
  siteId,
  product,
  onClose,
}: {
  siteId: string
  product: Product | null
  onClose: () => void
}) {
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (fd: FormData) => {
    fd.set('image_url', imageUrl)
    setError(null)
    startTransition(async () => {
      try {
        await upsertProduct(fd)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="site_id" value={siteId} />
      {product?.id && <input type="hidden" name="product_id" value={product.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="product_name">Name</Label>
          <Input id="product_name" name="name" defaultValue={product?.name} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="product_description">Description</Label>
          <textarea
            id="product_description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ''}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="product_price">Price (cents)</Label>
          <Input
            id="product_price"
            name="price_cents"
            type="number"
            min={0}
            defaultValue={product?.price_cents ?? 2500}
            required
          />
        </div>
        <div>
          <Label htmlFor="product_currency">Currency</Label>
          <Input id="product_currency" name="currency" defaultValue={product?.currency ?? 'usd'} />
        </div>
        <div className="sm:col-span-2">
          <Label>Image</Label>
          <AssetPicker value={imageUrl} onChange={setImageUrl} siteId={siteId} accept="image/*" />
        </div>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Active (visible on the public site)</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : product ? 'Save product' : 'Add product'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function TiersList({ siteId, items }: { siteId: string; items: Tier[] }) {
  const [editing, setEditing] = useState<Tier | 'new' | null>(null)
  const [isPending, startTransition] = useTransition()

  if (editing) {
    return (
      <TierEditor
        siteId={siteId}
        tier={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    )
  }

  const handleDelete = (tierId: string) => {
    if (!confirm('Delete this tier?')) return
    const fd = new FormData()
    fd.set('tier_id', tierId)
    startTransition(async () => {
      try {
        await deleteTier(fd)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Recurring memberships shown by the Membership Tiers block.
        </p>
        <Button size="sm" onClick={() => setEditing('new')}>
          + Add tier
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No tiers yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <div key={t.id} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
              <p className="text-display text-sm font-bold uppercase tracking-widest text-primary">
                {t.name}
              </p>
              <p className="mt-1 text-3xl font-black">
                ${(t.price_cents / 100).toFixed(2)}
                <span className="ml-1 text-sm text-muted-foreground">/{t.billing_interval}</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {t.perks.map((p, i) => (
                  <li key={i}>✓ {p}</li>
                ))}
              </ul>
              {!t.active && (
                <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Inactive
                </p>
              )}
              <div className="mt-3 flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(t)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(t.id)}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TierEditor({
  siteId,
  tier,
  onClose,
}: {
  siteId: string
  tier: Tier | null
  onClose: () => void
}) {
  const [perks, setPerks] = useState<string[]>(tier?.perks ?? ['Behind-the-scenes posts'])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (fd: FormData) => {
    fd.set('perks', JSON.stringify(perks.filter((p) => p.trim().length > 0)))
    setError(null)
    startTransition(async () => {
      try {
        await upsertTier(fd)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="site_id" value={siteId} />
      {tier?.id && <input type="hidden" name="tier_id" value={tier.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="tier_name">Tier name</Label>
          <Input id="tier_name" name="name" defaultValue={tier?.name ?? ''} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="tier_description">Description</Label>
          <textarea
            id="tier_description"
            name="description"
            rows={2}
            defaultValue={tier?.description ?? ''}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="tier_price">Price (cents)</Label>
          <Input
            id="tier_price"
            name="price_cents"
            type="number"
            min={0}
            defaultValue={tier?.price_cents ?? 1000}
            required
          />
        </div>
        <div>
          <Label htmlFor="tier_interval">Billing</Label>
          <select
            id="tier_interval"
            name="billing_interval"
            defaultValue={tier?.billing_interval ?? 'month'}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label>Perks</Label>
          <div className="space-y-2">
            {perks.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  defaultValue={p}
                  onChange={(e) =>
                    setPerks(perks.map((it, idx) => (idx === i ? e.target.value : it)))
                  }
                  placeholder="What's included"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setPerks(perks.filter((_, idx) => idx !== i))}
                  className="text-destructive"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setPerks([...perks, ''])}>
              + Add perk
            </Button>
          </div>
        </div>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={tier?.active ?? true}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Active</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : tier ? 'Save tier' : 'Add tier'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function RewardsList({
  siteId,
  items,
  tiers,
}: {
  siteId: string
  items: Reward[]
  tiers: Tier[]
}) {
  const [editing, setEditing] = useState<Reward | 'new' | null>(null)
  const [isPending, startTransition] = useTransition()

  if (editing) {
    return (
      <RewardEditor
        siteId={siteId}
        reward={editing === 'new' ? null : editing}
        tiers={tiers}
        onClose={() => setEditing(null)}
      />
    )
  }

  const handleDelete = (rewardId: string) => {
    if (!confirm('Delete this reward?')) return
    const fd = new FormData()
    fd.set('reward_id', rewardId)
    startTransition(async () => {
      try {
        await deleteReward(fd)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Supporter rewards shown by the Rewards Showcase block + milestone unlocks.
        </p>
        <Button size="sm" onClick={() => setEditing('new')}>
          + Add reward
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No rewards yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <div
              key={r.id}
              className="overflow-hidden rounded-[var(--radius)] border border-border bg-panel/40"
            >
              {r.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image_url} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-panel-elevated/40 text-xs text-muted-foreground">
                  {r.reward_type}
                </div>
              )}
              <div className="p-3">
                <p className="text-display font-bold">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  Unlocks at ${(r.unlock_amount_cents / 100).toFixed(2)}
                </p>
                <div className="mt-3 flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(r.id)}
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RewardEditor({
  siteId,
  reward,
  tiers,
  onClose,
}: {
  siteId: string
  reward: Reward | null
  tiers: Tier[]
  onClose: () => void
}) {
  const [imageUrl, setImageUrl] = useState(reward?.image_url ?? '')
  const [fileUrl, setFileUrl] = useState(reward?.file_url ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (fd: FormData) => {
    fd.set('image_url', imageUrl)
    fd.set('file_url', fileUrl)
    setError(null)
    startTransition(async () => {
      try {
        await upsertReward(fd)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  const REWARD_TYPES = [
    'digital',
    'physical',
    'experience',
    'shoutout',
    'wallpaper',
    'trading_card',
    'sticker',
  ]

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="site_id" value={siteId} />
      {reward?.id && <input type="hidden" name="reward_id" value={reward.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="reward_name">Name</Label>
          <Input id="reward_name" name="name" defaultValue={reward?.name} required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="reward_description">Description</Label>
          <textarea
            id="reward_description"
            name="description"
            rows={2}
            defaultValue={reward?.description ?? ''}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="reward_type">Type</Label>
          <select
            id="reward_type"
            name="reward_type"
            defaultValue={reward?.reward_type ?? 'digital'}
            className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
          >
            {REWARD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="unlock_amount">Unlock at (cents)</Label>
          <Input
            id="unlock_amount"
            name="unlock_amount_cents"
            type="number"
            min={0}
            defaultValue={reward?.unlock_amount_cents ?? 500}
          />
        </div>
        {tiers.length > 0 && (
          <div className="sm:col-span-2">
            <Label htmlFor="required_tier_id">Or require tier (optional)</Label>
            <select
              id="required_tier_id"
              name="required_tier_id"
              defaultValue={reward?.required_tier_id ?? ''}
              className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              <option value="">None (use unlock amount)</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <Label>Preview image</Label>
          <AssetPicker value={imageUrl} onChange={setImageUrl} siteId={siteId} accept="image/*" />
        </div>
        <div className="sm:col-span-2">
          <Label>Delivery file (for digital rewards)</Label>
          <AssetPicker value={fileUrl} onChange={setFileUrl} siteId={siteId} />
        </div>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={reward?.active ?? true}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Active</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : reward ? 'Save reward' : 'Add reward'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
