import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The one Supabase client of the site, used in the browser only. It signs a Learner in to their
 * Account and saves their Progress. Using `@supabase/ssr`'s `createBrowserClient` stores the
 * Supabase Auth session in browser cookies so Next.js Server Components and API routes can verify
 * Entitlement on Paid Sections. The publishable key is safe in a browser: the database rules
 * (supabase/migrations) decide what it may do.
 *
 * It is null when the site was built without Supabase settings (for example in tests), and then
 * the site simply has no Accounts: Progress stays in the browser, as for a signed-out Learner.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

let client: SupabaseClient | null | undefined

export function accountsConfigured(): boolean {
  return Boolean(client || (URL && KEY))
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client
  if (typeof window === 'undefined' || !URL || !KEY) return null
  client = createBrowserClient(URL, KEY, {
    auth: {
      // A Learner stays signed in on this browser until they sign out.
      persistSession: true,
      autoRefreshToken: true,
      // Sign-in hands Supabase a Google ID token directly, so no session ever arrives in the URL.
      detectSessionInUrl: false,
    },
  })
  return client
}

/** Sets the Supabase client used by the account module, for testing. */
export function setSupabaseClientForTesting(testClient: SupabaseClient | null | undefined): void {
  client = testClient
}
