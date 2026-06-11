import { requireUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await requireUser()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          {user.email} — the new Edge Zone platform is taking shape.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s live</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Authentication</li>
              <li>✓ User profiles</li>
              <li>✓ Subdomain routing</li>
              <li>✓ Custom domain table</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming next</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>○ Marketplace + Stripe (Phase 1)</li>
              <li>○ Brand Design (Phase 2)</li>
              <li>○ EPK (Phase 2)</li>
              <li>○ Talent Site Builder (Phase 3)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
