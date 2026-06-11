/**
 * Sharetribe SDK wrappers for the NILiance bridge.
 *
 * Two clients:
 *   1. integrationSdk — Sharetribe Integration API. Server-only. Used for
 *      profile updates, queries, listings management. CANNOT create users.
 *   2. marketplaceSdk — Sharetribe Marketplace API with a trusted-client.
 *      Used to create users on Edge Zone signup with a random password +
 *      password-reset email. Requires a second Sharetribe application
 *      registered as a "trusted client" in the Marketplace API.
 *
 * Both clients return null when their credentials are not configured, so
 * the rest of the app degrades gracefully when NILiance is not wired up.
 *
 * Sharetribe SDKs are CommonJS — we cast to any to keep this layer thin.
 * Type the surface we use via NilianceClient below if you need more.
 */
import { env } from '@/lib/env'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySdk = any

let integrationModule: AnySdk | null = null
let marketplaceModule: AnySdk | null = null

async function getIntegrationModule(): Promise<AnySdk> {
  if (integrationModule) return integrationModule
  const mod = (await import('sharetribe-flex-integration-sdk')) as AnySdk
  integrationModule = mod.default ?? mod
  return integrationModule
}

async function getMarketplaceModule(): Promise<AnySdk> {
  if (marketplaceModule) return marketplaceModule
  const mod = (await import('sharetribe-flex-sdk')) as AnySdk
  marketplaceModule = mod.default ?? mod
  return marketplaceModule
}

export const integrationConfigured = Boolean(
  env.SHARETRIBE_CLIENT_ID && env.SHARETRIBE_CLIENT_SECRET
)
export const marketplaceConfigured = Boolean(
  env.SHARETRIBE_MP_CLIENT_ID && env.SHARETRIBE_MP_CLIENT_SECRET
)
export const sharetribeEnabled = integrationConfigured && marketplaceConfigured

/** Returns an Integration API client (server-only) or null if not configured. */
export async function getIntegrationSdk(): Promise<AnySdk | null> {
  if (!integrationConfigured) return null
  const sdk = await getIntegrationModule()
  return sdk.createInstance({
    clientId: env.SHARETRIBE_CLIENT_ID!,
    clientSecret: env.SHARETRIBE_CLIENT_SECRET!,
  })
}

/** Returns a Marketplace API client with trusted-user scope, or null. */
export async function getMarketplaceSdk(): Promise<AnySdk | null> {
  if (!marketplaceConfigured) return null
  const sdk = await getMarketplaceModule()
  return sdk.createInstance({
    clientId: env.SHARETRIBE_MP_CLIENT_ID!,
    clientSecret: env.SHARETRIBE_MP_CLIENT_SECRET!,
    tokenStore: sdk.tokenStore.memoryStore(),
    typeHandlers: [
      {
        type: sdk.types.UUID,
        customType: String,
        writer: (v: { uuid: string }) => v.uuid,
        reader: (v: string) => new sdk.types.UUID(v),
      },
    ],
  })
}
