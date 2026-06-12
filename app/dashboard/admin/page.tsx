import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ADMIN_NAV } from '@/components/admin/admin-nav-config'

export const metadata = { title: 'Admin' }

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display text-2xl font-black tracking-tight">
          Welcome to admin
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage every dimension of the platform &mdash; settings, integrations, content,
          products, users, and engagement.
        </p>
      </div>

      <div className="grid gap-6">
        {ADMIN_NAV.map((group) => (
          <section key={group.title}>
            <p className="text-eyebrow mb-3 text-primary">{group.title}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="group">
                  <Card className="transition-colors group-hover:border-primary/40">
                    <CardHeader>
                      <CardTitle className="text-base group-hover:text-primary">
                        {item.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">{item.href.split('/').pop()}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
