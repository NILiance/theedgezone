/**
 * Client-safe opportunity category constants. Kept in their own module (no
 * server imports) so client components can import them without pulling the
 * Sharetribe Node SDK into the browser bundle.
 */
export const OFFERING_LABELS: Record<string, string> = {
  campaign: 'Campaign',
  single_job: 'Single Job',
  bulk_job: 'Bulk Jobs',
  subscription_box: 'Subscription Box',
  perk: 'Perks',
  reward: 'Rewards & Coupons',
  other: 'Other',
}

export const OFFERING_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All categories' },
  { value: 'campaign', label: 'Campaigns' },
  { value: 'single_job', label: 'Single Jobs' },
  { value: 'bulk_job', label: 'Bulk Jobs' },
  { value: 'subscription_box', label: 'Subscription Boxes' },
  { value: 'perk', label: 'Perks' },
  { value: 'reward', label: 'Rewards & Coupons' },
]
