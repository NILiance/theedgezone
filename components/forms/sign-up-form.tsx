'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp, type AuthState } from '@/app/(auth)/actions'
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

export function SignUpForm({ signupRef }: { signupRef?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, undefined)

  if (state?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>{state.success}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/sign-in" className="text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start building on Edge Zone.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        {signupRef && <input type="hidden" name="signup_ref" value={signupRef} />}
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>I&rsquo;m signing up as</Label>
            <div className="grid grid-cols-2 gap-2">
              <label className="relative flex cursor-pointer flex-col rounded-[var(--radius-sm)] border border-border bg-background p-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <input
                  type="radio"
                  name="user_type"
                  value="talent"
                  defaultChecked
                  className="absolute right-2 top-2 accent-primary"
                />
                <span className="text-display font-bold">Talent</span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  Athlete, creator, or performer
                </span>
              </label>
              <label className="relative flex cursor-pointer flex-col rounded-[var(--radius-sm)] border border-border bg-background p-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <input
                  type="radio"
                  name="user_type"
                  value="brand"
                  className="absolute right-2 top-2 accent-primary"
                />
                <span className="text-display font-bold">Brand</span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  Business or sponsor
                </span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              required
              autoComplete="name"
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          {state?.error && <Alert variant="destructive">{state.error}</Alert>}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Creating account...' : 'Create account'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
