'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  updateBranding,
  uploadFavicon,
  removeFavicon,
  type BrandingState,
  type FaviconState,
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
    favicon_url: string | null
  }
}

export function BrandingForm({ defaults }: BrandingFormProps) {
  return (
    <div className="space-y-6">
      <SettingsCard defaults={defaults} />
      <FaviconCard faviconUrl={defaults.favicon_url} />
    </div>
  )
}

function SettingsCard({ defaults }: BrandingFormProps) {
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

function FaviconCard({ faviconUrl }: { faviconUrl: string | null }) {
  const [state, formAction, pending] = useActionState<FaviconState, FormData>(
    uploadFavicon,
    undefined
  )
  const [removing, startRemove] = useTransition()
  const [removeState, setRemoveState] = useState<FaviconState>(undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Favicon</CardTitle>
        <CardDescription>
          The small icon shown in browser tabs and bookmarks. PNG, JPG, or SVG — raster images
          are auto-resized to 64×64.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-panel-elevated">
              {faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={faviconUrl} alt="Current favicon" className="h-10 w-10 object-contain" />
              ) : (
                <span className="text-2xl" aria-hidden>
                  🌐
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {faviconUrl ? 'Current favicon' : 'No favicon set'}
              </p>
              <p className="text-xs text-muted-foreground">
                {faviconUrl
                  ? 'Upload a new image to replace it.'
                  : 'Upload one to brand browser tabs.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon">Upload favicon</Label>
            <input
              id="favicon"
              name="favicon"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              required
              className="block w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-[var(--radius-sm)] file:border file:border-border file:bg-panel-elevated file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-foreground hover:file:bg-primary hover:file:text-primary-foreground"
            />
          </div>

          {state?.error && <Alert variant="destructive">{state.error}</Alert>}
          {state?.success && <Alert variant="success">{state.success}</Alert>}
          {removeState?.error && <Alert variant="destructive">{removeState.error}</Alert>}
          {removeState?.success && <Alert variant="success">{removeState.success}</Alert>}
        </CardContent>
        <CardFooter className="justify-between">
          {faviconUrl ? (
            <Button
              type="button"
              variant="ghost"
              disabled={removing}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() =>
                startRemove(async () => {
                  setRemoveState(await removeFavicon())
                })
              }
            >
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={pending}>
            {pending ? 'Uploading…' : 'Upload favicon'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
