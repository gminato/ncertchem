import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SubscriptionRow } from './subscriptions'

const cookiesMock = vi.fn()
const createServerClientMock = vi.fn()
const createClientMock = vi.fn()

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}))

import {
  createServerSupabaseClient,
  createServiceRoleClient,
  getServerEntitlement,
} from './server'

function makeQueryMock(result: { data: SubscriptionRow | null; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  return chain
}

describe('server Supabase & Entitlement helpers', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    cookiesMock.mockResolvedValue({
      getAll: () => [{ name: 'sb-access-token', value: 'token' }],
      set: vi.fn(),
    })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('missing environment configuration', () => {
    it('returns null from createServerSupabaseClient and fails closed in getServerEntitlement when URL is unset', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'pub-key'

      expect(await createServerSupabaseClient()).toBeNull()
      expect(await getServerEntitlement()).toEqual({
        authenticated: false,
        entitled: false,
        accountId: null,
        subscription: null,
      })
      expect(cookiesMock).not.toHaveBeenCalled()
      expect(createServerClientMock).not.toHaveBeenCalled()
    })

    it('returns null from createServerSupabaseClient when publishable key is unset', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

      expect(await createServerSupabaseClient()).toBeNull()
      expect(await getServerEntitlement()).toEqual({
        authenticated: false,
        entitled: false,
        accountId: null,
        subscription: null,
      })
    })

    it('returns null from createServiceRoleClient when service role key is unset', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      expect(createServiceRoleClient()).toBeNull()
      expect(createClientMock).not.toHaveBeenCalled()
    })

    it('creates a non-persisting service role client when configured', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret'
      const fakeAdmin = { from: vi.fn() }
      createClientMock.mockReturnValue(fakeAdmin)

      const client = createServiceRoleClient()
      expect(client).toBe(fakeAdmin)
      expect(createClientMock).toHaveBeenCalledWith(
        'https://example.supabase.co',
        'service-role-secret',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )
    })
  })

  describe('cookie handling in Server Components', () => {
    it('swallows cookie write errors in setAll when called from a read-only Server Component', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'pub-key'

      const throwingSet = vi.fn(() => {
        throw new Error('Cookies can only be modified in a Server Action or Route Handler.')
      })
      cookiesMock.mockResolvedValue({
        getAll: () => [{ name: 'sb-token', value: 'abc' }],
        set: throwingSet,
      })

      createServerClientMock.mockImplementation((_url, _key, options) => {
        expect(options.cookies.getAll()).toEqual([{ name: 'sb-token', value: 'abc' }])
        expect(() =>
          options.cookies.setAll([{ name: 'sb-token', value: 'new', options: { path: '/' } }])
        ).not.toThrow()
        return { auth: { getUser: vi.fn() } }
      })

      const client = await createServerSupabaseClient()
      expect(client).not.toBeNull()
      expect(throwingSet).toHaveBeenCalledTimes(1)
    })
  })

  describe('getServerEntitlement', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'pub-key'
    })

    it('returns unauthenticated when signed out (auth.getUser returns null user)', async () => {
      const fromMock = vi.fn()
      createServerClientMock.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
        from: fromMock,
      })

      const result = await getServerEntitlement()
      expect(result).toEqual({
        authenticated: false,
        entitled: false,
        accountId: null,
        subscription: null,
      })
      expect(fromMock).not.toHaveBeenCalled()
    })

    it('returns authenticated but not entitled when signed in without an active Subscription', async () => {
      const query = makeQueryMock({ data: null, error: null })
      const fromMock = vi.fn().mockReturnValue(query)
      createServerClientMock.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'acct-free-1' } },
            error: null,
          }),
        },
        from: fromMock,
      })

      const result = await getServerEntitlement()
      expect(result).toEqual({
        authenticated: true,
        entitled: false,
        accountId: 'acct-free-1',
        subscription: null,
      })
      expect(fromMock).toHaveBeenCalledWith('subscriptions')
      expect(query.eq).toHaveBeenCalledWith('account_id', 'acct-free-1')
    })

    it('returns authenticated and entitled when signed in with an active Subscription', async () => {
      const activeSub: SubscriptionRow = {
        id: 'sub-123',
        account_id: 'acct-paid-1',
        starts_at: new Date(Date.now() - 86_400_000).toISOString(),
        expires_at: new Date(Date.now() + 300 * 86_400_000).toISOString(),
        status: 'active',
        razorpay_order_id: 'order_abc',
        razorpay_payment_id: 'pay_xyz',
        created_at: new Date(Date.now() - 86_400_000).toISOString(),
      }
      const query = makeQueryMock({ data: activeSub, error: null })
      createServerClientMock.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'acct-paid-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue(query),
      })

      const result = await getServerEntitlement()
      expect(result).toEqual({
        authenticated: true,
        entitled: true,
        accountId: 'acct-paid-1',
        subscription: activeSub,
      })
    })

    it('fails closed when auth.getUser returns an error', async () => {
      const fromMock = vi.fn()
      createServerClientMock.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid JWT' },
          }),
        },
        from: fromMock,
      })

      const result = await getServerEntitlement()
      expect(result).toEqual({
        authenticated: false,
        entitled: false,
        accountId: null,
        subscription: null,
      })
      expect(fromMock).not.toHaveBeenCalled()
    })

    it('fails closed when auth.getUser throws unexpectedly', async () => {
      createServerClientMock.mockReturnValue({
        auth: {
          getUser: vi.fn().mockRejectedValue(new Error('Network failure')),
        },
        from: vi.fn(),
      })

      const result = await getServerEntitlement()
      expect(result).toEqual({
        authenticated: false,
        entitled: false,
        accountId: null,
        subscription: null,
      })
    })

    it('fails closed on subscription query errors while preserving authenticated state', async () => {
      const query = makeQueryMock({ data: null, error: { message: 'Database unavailable' } })
      createServerClientMock.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'acct-err-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue(query),
      })

      const result = await getServerEntitlement()
      expect(result).toEqual({
        authenticated: true,
        entitled: false,
        accountId: 'acct-err-1',
        subscription: null,
      })
    })
  })
})
