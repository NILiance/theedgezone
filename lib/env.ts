import { z } from 'zod'

const envSchema = z.object({
  // Site
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Vercel Domains API
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  VERCEL_ACCESS_TOKEN: z.string().optional(),

  // Cron auth (Vercel-cron Bearer token)
  CRON_SECRET: z.string().optional(),

  // Integrations
  ANTHROPIC_API_KEY: z.string().optional(),
  IDEOGRAM_API_KEY: z.string().optional(),
  PHYLLO_CLIENT_ID: z.string().optional(),
  PHYLLO_CLIENT_SECRET: z.string().optional(),
  PHYLLO_ENVIRONMENT: z.enum(['sandbox', 'production', 'staging']).default('sandbox'),
  HEYGEN_API_KEY: z.string().optional(),
  VECTORIZER_AI_API_ID: z.string().optional(),
  VECTORIZER_AI_API_SECRET: z.string().optional(),
  GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GOOGLE_DRIVE_PARENT_FOLDER_ID: z.string().optional(),

  // Sharetribe — Integration API (queries + admin ops)
  SHARETRIBE_CLIENT_ID: z.string().optional(),
  SHARETRIBE_CLIENT_SECRET: z.string().optional(),
  // Sharetribe — Marketplace API (user create, with trusted: scope)
  SHARETRIBE_MP_CLIENT_ID: z.string().optional(),
  SHARETRIBE_MP_CLIENT_SECRET: z.string().optional(),
  // NILiance frontend URL (for redirect links from Edge Zone)
  NILIANCE_BASE_URL: z.string().url().optional(),

  // CRM
  CRM_API_URL: z.string().url().optional(),
  CRM_API_KEY: z.string().optional(),
})

const isServer = typeof window === 'undefined'

const rawEnv: Record<string, string | undefined> = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
}

if (isServer) {
  Object.assign(rawEnv, {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
    VERCEL_ACCESS_TOKEN: process.env.VERCEL_ACCESS_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    IDEOGRAM_API_KEY: process.env.IDEOGRAM_API_KEY,
    PHYLLO_CLIENT_ID: process.env.PHYLLO_CLIENT_ID,
    PHYLLO_CLIENT_SECRET: process.env.PHYLLO_CLIENT_SECRET,
    PHYLLO_ENVIRONMENT: process.env.PHYLLO_ENVIRONMENT,
    HEYGEN_API_KEY: process.env.HEYGEN_API_KEY,
    VECTORIZER_AI_API_ID: process.env.VECTORIZER_AI_API_ID,
    VECTORIZER_AI_API_SECRET: process.env.VECTORIZER_AI_API_SECRET,
    GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON,
    GOOGLE_DRIVE_PARENT_FOLDER_ID: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID,
    SHARETRIBE_CLIENT_ID: process.env.SHARETRIBE_CLIENT_ID,
    SHARETRIBE_CLIENT_SECRET: process.env.SHARETRIBE_CLIENT_SECRET,
    SHARETRIBE_MP_CLIENT_ID: process.env.SHARETRIBE_MP_CLIENT_ID,
    SHARETRIBE_MP_CLIENT_SECRET: process.env.SHARETRIBE_MP_CLIENT_SECRET,
    NILIANCE_BASE_URL: process.env.NILIANCE_BASE_URL,
    CRM_API_URL: process.env.CRM_API_URL,
    CRM_API_KEY: process.env.CRM_API_KEY,
  })
}

// Treat empty strings as unset — optional fields with default values from
// .env templates would otherwise fail .url() / .email() validation.
const cleanEnv = Object.fromEntries(
  Object.entries(rawEnv).filter(([, v]) => v !== undefined && v !== '')
)

const parsed = envSchema.safeParse(cleanEnv)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables — see logs above')
}

export const env = parsed.data
