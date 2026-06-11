'use client'

import { useActionState, useState } from 'react'
import {
  updateBranding,
  type BrandingState,
} from '@/app/dashboard/admin/branding/actions'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BrandingFormProps {
  defaults: {
    logo_height_nav: number
    logo_height_footer: number
    tagline: string
  }
}

export function BrandingForm({ defaults }: BrandingFormProps) {
  const [state, formAction, pending] = useActionState<BrandingState, FormData>(
    updateBranding,
    undefined
  )
  const [nav, setNav] = useState(defaults.logo_height_nav)
  const [footer, setFooter] = useState(defaults.logo_height_footer)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>
          Control the size of the Edge Zone logo across the site. Changes apply everywhere
          immediately after saving.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="logo_height_nav">Logo height &mdash; nav</Label>
              <span className="text-display text-sm font-bold text-primary">{nav}px</span>
            </div>
            <input
              id="logo_height_nav"
              name="logo_height_nav"
              type="range"
              min={16}
              max={200}
              step={2}
              value={nav}
              onChange={(e) => setNav(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">
              Default: 52. Used in the top navigation bar on every public page.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="logo_height_footer">Logo height &mdash; footer</Label>
              <span className="text-display text-sm font-bold text-primary">{footer}px</span>
            </div>
            <input
              id="logo_height_footer"
              name="logo_height_footer"
              type="range"
              min={16}
              max={200}
              step={2}
              value={footer}
              onChange={(e) => setFooter(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">
              Default: 36. Used in the footer wordmark.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              defaultValue={defaults.tagline}
              maxLength={120}
              required
            />
            <p className="text-xs text-muted-foreground">
              Shown under the wordmark when the text-only fallback is rendered.
            </p>
          </div>

          {state?.error && <Alert variant="destructive">{state.error}</Alert>}
          {state?.success && <Alert variant="success">{state.success}</Alert>}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
