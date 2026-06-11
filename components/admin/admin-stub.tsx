import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminStubProps {
  title: string
  description: string
  features?: string[]
  module?: string
}

/**
 * Placeholder for admin sub-tabs whose full module hasn't been built yet.
 * Shows what the tab will eventually contain so an admin sees the roadmap
 * instead of a blank page.
 */
export function AdminStub({ title, description, features, module }: AdminStubProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display text-2xl font-black tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
          <CardDescription>
            This admin sub-tab is wired into the URL structure but the underlying module is
            still being built out{module ? ` (see ${module}).` : '.'}
          </CardDescription>
        </CardHeader>
        {features && features.length > 0 && (
          <CardContent>
            <p className="text-eyebrow mb-3 text-muted-foreground">What it will include</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="shrink-0 text-primary">○</span>
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
