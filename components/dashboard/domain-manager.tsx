import { getEntityDomain, readCustomDomainStatus } from '@/app/dashboard/custom-domain-actions'
import { DomainManagerClient } from './domain-manager-client'

/**
 * Drop-in custom-domain section for a tenant module (EPK, Podcast, Store, App).
 * Pass the module's target_type, the row id, its slug, and the free subdomain to
 * show. Loads the current mapping + verification status, then renders the
 * interactive client form.
 */
export async function DomainManager({
  targetType,
  entityId,
  slug,
  subdomain,
}: {
  targetType: string
  entityId: string
  slug: string
  subdomain: string
}) {
  const domain = await getEntityDomain(targetType, slug)
  const status = domain ? await readCustomDomainStatus(domain) : null
  return (
    <DomainManagerClient
      targetType={targetType}
      entityId={entityId}
      subdomain={subdomain}
      domain={domain}
      status={status}
    />
  )
}
