'use client'

export type LogoStyle = 'transparent' | 'regular'

/** Transparent (background knocked out) vs regular (logo with its background). */
export function LogoStyleToggle({
  value,
  onChange,
  label = 'Logo',
}: {
  value: LogoStyle
  onChange: (v: LogoStyle) => void
  label?: string
}) {
  return (
    <div>
      <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-1 flex overflow-hidden rounded-md border border-border">
        {(['transparent', 'regular'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${
              value === v
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-panel'
            }`}
          >
            {v === 'transparent' ? 'Transparent' : 'Background'}
          </button>
        ))}
      </div>
    </div>
  )
}
