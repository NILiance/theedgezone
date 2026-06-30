'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { sendEmail } from '@/lib/resend'
import { welcomeEmail } from '@/lib/emails/welcome'
import { createNilianceUser } from '@/lib/niliance'

export type AuthState = { error?: string; success?: string } | undefined

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password too short'),
})

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

const signUpSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(1, 'Display name required').max(80),
  user_type: z.enum(['talent', 'brand']).default('talent'),
  signup_ref: z.string().max(40).optional(),
})

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    display_name: formData.get('display_name'),
    user_type: formData.get('user_type') ?? 'talent',
    signup_ref: formData.get('signup_ref') ?? undefined,
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  // Which product domain / landing drove this signup (the ?ref= CTA).
  const ref = parsed.data.signup_ref?.replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || null

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.display_name,
        user_type: parsed.data.user_type,
        ...(ref ? { signup_ref: ref } : {}),
      },
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (error) return { error: error.message }

  // Fire welcome email + NILiance create (best-effort, non-blocking).
  if (data.user) {
    // Stamp the role type on the profile. The handle_new_user trigger creates
    // the row synchronously, so a service-role update lands it immediately
    // (the auth client has no session yet under email-confirmation).
    const svc = createServiceClient()
    if (svc) {
      void svc
        .from('profiles')
        .update({ user_type: parsed.data.user_type })
        .eq('id', data.user.id)
      if (ref) {
        // Best-effort — column added by 20260629170000_profiles_signup_ref.
        void svc.from('profiles').update({ signup_ref: ref }).eq('id', data.user.id)
      }
    }

    const { subject, html } = welcomeEmail({ display_name: parsed.data.display_name })
    void sendEmail({
      to: parsed.data.email,
      subject,
      html,
      templateKey: 'welcome',
      metadata: { user_id: data.user.id },
    })

    void createNilianceUser({
      userId: data.user.id,
      email: parsed.data.email,
      displayName: parsed.data.display_name,
      userType: parsed.data.user_type,
    })
  }

  // Supabase has email confirmation on by default — session is null until confirmed.
  if (data.user && !data.session) {
    return { success: 'Check your email to confirm your account, then sign in.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/sign-in')
}

const resetSchema = z.object({ email: z.string().email('Enter a valid email') })

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = resetSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  })
  if (error) return { error: error.message }

  return { success: 'If an account exists for that email, a reset link has been sent.' }
}

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function updatePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
