import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Subscriptions and Entitlement helpers.
 *
 * A Subscription grants a signed-in Account its Entitlement to Paid Sections until `expires_at`.
 * All reads fail closed: if a query returns an error or no active row, the Account has no
 * Entitlement.
 */

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'

export interface SubscriptionRow {
  id: string
  account_id: string
  starts_at: string
  expires_at: string
  status: SubscriptionStatus
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  created_at: string
}

const SUBSCRIPTION_COLUMNS =
  'id, account_id, starts_at, expires_at, status, razorpay_order_id, razorpay_payment_id, created_at'

/**
 * Returns true when a Subscription row currently grants Entitlement (`status === 'active'` and
 * `expires_at` is strictly in the future relative to `now`).
 */
export function isSubscriptionActive(
  row: Pick<SubscriptionRow, 'status' | 'expires_at'> | null | undefined,
  now: Date = new Date()
): boolean {
  if (!row || row.status !== 'active') return false
  const expiresAtMs = Date.parse(row.expires_at)
  if (Number.isNaN(expiresAtMs)) return false
  return expiresAtMs > now.getTime()
}

/**
 * Fetches the active Subscription with the furthest expiry for an Account (or for the signed-in
 * Account when `accountId` is omitted and RLS scopes the query).
 */
export async function fetchActiveSubscription(
  client: SupabaseClient,
  accountId?: string,
  now: Date = new Date()
): Promise<SubscriptionRow | null> {
  let query = client
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS)
    .eq('status', 'active')
    .gt('expires_at', now.toISOString())

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  const row = data as SubscriptionRow
  return isSubscriptionActive(row, now) ? row : null
}

/**
 * Fetches the Subscription with the latest expiry (active, expired, or cancelled) for display on
 * the Account page.
 */
export async function fetchLatestSubscription(
  client: SupabaseClient,
  accountId?: string
): Promise<SubscriptionRow | null> {
  let query = client.from('subscriptions').select(SUBSCRIPTION_COLUMNS)

  if (accountId) {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query
    .order('expires_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as SubscriptionRow
}
