'use client'

import { useActionState, useState } from 'react'
import {
  saveSupplierCredentials,
  testSupplierConnection,
  syncSupplierCatalog,
  clearSupplierCatalog,
  type SupplierActionState,
} from './actions'

type Supplier = {
  supplier_code: string
  display_name: string
  description: string | null
  credentials: Record<string, string>
  enabled: boolean
  last_tested_at: string | null
  last_test_status: string | null
  last_test_message: string | null
  product_count: number
}

const FIELDS: Record<string, { key: string; label: string; secret?: boolean }[]> = {
  ssactivewear: [
    { key: 'account_number', label: 'Account number' },
    { key: 'api_token', label: 'API token', secret: true },
  ],
  promostandards: [
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password', secret: true },
    { key: 'product_data_endpoint', label: 'Product Data WSDL URL' },
    { key: 'inventory_endpoint', label: 'Inventory WSDL URL' },
    { key: 'purchase_order_endpoint', label: 'PurchaseOrder (SendPO) WSDL URL' },
  ],
  sanmar: [
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password', secret: true },
    { key: 'customer_number', label: 'Customer number' },
  ],
  onesource: [
    { key: 'client_id', label: 'Client ID' },
    { key: 'client_secret', label: 'Client secret', secret: true },
  ],
  mock: [],
}

export function SupplierManager({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <div className="space-y-4">
      {suppliers.map((s) => (
        <SupplierCard key={s.supplier_code} supplier={s} />
      ))}
    </div>
  )
}

function SupplierCard({ supplier }: { supplier: Supplier }) {
  const [saveState, saveAction, savePending] = useActionState<SupplierActionState, FormData>(
    saveSupplierCredentials,
    {}
  )
  const [testState, testAction, testPending] = useActionState<SupplierActionState, FormData>(
    testSupplierConnection,
    {}
  )
  const [syncState, syncAction, syncPending] = useActionState<SupplierActionState, FormData>(
    syncSupplierCatalog,
    {}
  )
  const [clearState, clearAction, clearPending] = useActionState<SupplierActionState, FormData>(
    clearSupplierCatalog,
    {}
  )
  const [open, setOpen] = useState(supplier.enabled)
  const fields = FIELDS[supplier.supplier_code] ?? []
  const statusTone = supplier.enabled
    ? 'bg-success/20 text-success'
    : 'bg-panel-elevated text-muted-foreground'

  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-display text-lg font-black">{supplier.display_name}</p>
            <span
              className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusTone}`}
            >
              {supplier.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {supplier.description && (
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{supplier.description}</p>
          )}
          <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            {supplier.product_count} cached product{supplier.product_count === 1 ? '' : 's'}
            {supplier.last_tested_at && (
              <>
                {' '}
                · last tested {new Date(supplier.last_tested_at).toLocaleDateString()}
                {supplier.last_test_status && ` (${supplier.last_test_status})`}
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1 text-xs font-bold uppercase tracking-widest"
        >
          {open ? '−' : 'Edit'}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-4 border-t border-border pt-5">
          <form action={saveAction} className="space-y-3">
            <input type="hidden" name="supplier_code" value={supplier.supplier_code} />
            {fields.map((f) => (
              <label key={f.key} className="block text-sm">
                <span className="block text-xs text-muted-foreground">{f.label}</span>
                <input
                  name={f.key}
                  type={f.secret ? 'password' : 'text'}
                  defaultValue={supplier.credentials?.[f.key] ?? ''}
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={supplier.enabled}
                className="h-4 w-4"
              />
              Enabled
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={savePending}
                className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              >
                {savePending ? 'Saving…' : 'Save'}
              </button>
              {saveState.error && <p className="text-xs text-destructive">{saveState.error}</p>}
              {saveState.ok && <p className="text-xs text-success">{saveState.message}</p>}
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <form action={testAction}>
              <input type="hidden" name="supplier_code" value={supplier.supplier_code} />
              <button
                type="submit"
                disabled={testPending}
                className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {testPending ? 'Testing…' : 'Test connection'}
              </button>
            </form>
            {testState.error && <p className="text-xs text-destructive">{testState.error}</p>}
            {testState.ok && <p className="text-xs text-success">{testState.message}</p>}
            {supplier.last_test_message && !testState.ok && !testState.error && (
              <p className="text-xs text-muted-foreground">{supplier.last_test_message}</p>
            )}
          </div>

          <form action={syncAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="supplier_code" value={supplier.supplier_code} />
            <input
              name="query"
              placeholder="Style number(s) e.g. 5000, 18500 — blank = popular blanks"
              className="flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-xs"
            />
            <button
              type="submit"
              disabled={syncPending}
              className="text-display rounded-[var(--radius-sm)] border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary disabled:opacity-50"
            >
              {syncPending ? 'Syncing…' : 'Sync catalog'}
            </button>
            {supplier.supplier_code === 'ssactivewear' && (
              <p className="w-full text-[10px] text-muted-foreground">
                S&amp;S syncs by style number — enter one or more (e.g.{' '}
                <code className="font-mono">5000, 18500</code>, comma/space separated). Leave blank
                to seed a set of popular blank styles.
              </p>
            )}
            {syncState.error && <p className="text-xs text-destructive">{syncState.error}</p>}
            {syncState.ok && <p className="text-xs text-success">{syncState.message}</p>}
          </form>

          <form action={clearAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="supplier_code" value={supplier.supplier_code} />
            <button
              type="submit"
              disabled={clearPending}
              className="text-display rounded-[var(--radius-sm)] border border-destructive/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {clearPending ? 'Clearing…' : 'Clear cached catalog'}
            </button>
            <span className="text-[10px] text-muted-foreground">
              Removes this supplier&rsquo;s {supplier.product_count} cached product
              {supplier.product_count === 1 ? '' : 's'} (not your imported Print Shop items). Re-sync
              after to rebuild clean.
            </span>
            {clearState.error && <p className="text-xs text-destructive">{clearState.error}</p>}
            {clearState.ok && <p className="text-xs text-success">{clearState.message}</p>}
          </form>
        </div>
      )}
    </div>
  )
}
