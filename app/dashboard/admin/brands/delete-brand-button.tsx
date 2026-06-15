'use client'

import { adminDeleteBrand } from './[id]/actions'

export function DeleteBrandButton({
  brandId,
  brandLabel,
}: {
  brandId: string
  brandLabel: string
}) {
  return (
    <form
      action={adminDeleteBrand}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete brand design "${brandLabel}" and every concept? This cannot be undone.`
          )
        ) {
          e.preventDefault()
        }
      }}
      className="inline"
    >
      <input type="hidden" name="brand_id" value={brandId} />
      <button
        type="submit"
        className="text-display rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/20"
      >
        Delete
      </button>
    </form>
  )
}
