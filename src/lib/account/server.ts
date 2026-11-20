import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fetchActiveSubscription, type SubscriptionRow } from './subscriptions'

export interface ServerEntitlement {
  authenticated: boolean
  entitled: boolean
  accountId: string | null
  subscription: SubscriptionRow | null
}

const UNAUTHENTICATED_ENTITLEMENT: ServerEntitlement = {
  authenticated: false,
  entitled: false,
  accountId: null,
  subscription: null,
}

/**
 * Creates a request-scoped Supabase client for Next.js Server Components and Route Handlers.
 * Reads the Account session from incoming HTTP cookies and returns `null` when Supabase
 * environment variables are not configured.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null

  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components cannot write response cookies; ignore safely.
        }
      },
    },
  })
}

/**
 * Creates a server-only Supabase client with the service role key for privileged operations
 * (such as recording verified Subscription payments from webhooks). Never import this in
 * client bundles. Returns `null` when required environment variables are unset.
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Verifies the incoming request's Account session against Supabase Auth (`auth.getUser()`)
 * and checks whether that Account currently holds an active, unexpired Subscription.
 * Always fails closed on missing configuration, invalid tokens, or query errors.
 */
export async function getServerEntitlement(): Promise<ServerEntitlement> {
  const client = await createServerSupabaseClient()
  if (!client) return UNAUTHENTICATED_ENTITLEMENT

  try {
    const { data, error } = await client.auth.getUser()
    if (error || !data?.user) {
      return UNAUTHENTICATED_ENTITLEMENT
    }

    const accountId = data.user.id
    const subscription = await fetchActiveSubscription(client, accountId)

    return {
      authenticated: true,
      entitled: Boolean(subscription),
      accountId,
      subscription,
    }
  } catch {
    return UNAUTHENTICATED_ENTITLEMENT
  }
}
