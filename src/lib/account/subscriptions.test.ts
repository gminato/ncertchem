import { afterAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  fetchActiveSubscription,
  fetchLatestSubscription,
  isSubscriptionActive,
  type SubscriptionRow,
} from './subscriptions'

const LOCAL_SUPABASE_URL = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321'
const LOCAL_SUPABASE_ANON_KEY =
  process.env.LOCAL_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const LOCAL_SUPABASE_SERVICE_ROLE_KEY =
  process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: LOCAL_SUPABASE_ANON_KEY },
    })
    return res.status === 200 || res.status === 401
  } catch {
    return false
  }
}

const supabaseReady = await isSupabaseAvailable()

const serviceClient = supabaseReady
  ? createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

const createdAccountIds = new Set<string>()

function makeSignedOutClient(): SupabaseClient {
  return createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

async function createSignedInAccount(tag: string): Promise<{
  accountId: string
  client: SupabaseClient
}> {
  if (!serviceClient) {
    throw new Error('Local Supabase service client is unavailable')
  }
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const email = `learner-sub-${tag}-${suffix}@ncertchem.test`
  const password = `P@ss-${suffix}!`

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: `Learner ${tag.toUpperCase()}` },
  })
  if (createError || !created.user) {
    throw new Error(`Failed to create Account (${tag}): ${createError?.message ?? 'no account returned'}`)
  }
  createdAccountIds.add(created.user.id)

  const client = makeSignedOutClient()
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) {
    throw new Error(`Failed to sign in Account (${tag}): ${signInError.message}`)
  }

  return { accountId: created.user.id, client }
}

function isoOffsetFrom(base: Date, daysOffset: number): string {
  return new Date(base.getTime() + daysOffset * 24 * 60 * 60 * 1000).toISOString()
}

describe('isSubscriptionActive', () => {
  const now = new Date('2026-11-20T12:00:00.000Z')

  it('returns true for an active Subscription whose expiry is in the future', () => {
    expect(
      isSubscriptionActive(
        { status: 'active', expires_at: '2027-05-20T12:00:00.000Z' },
        now
      )
    ).toBe(true)
  })

  it('returns false for an active Subscription whose expiry is in the past', () => {
    expect(
      isSubscriptionActive(
        { status: 'active', expires_at: '2026-11-19T12:00:00.000Z' },
        now
      )
    ).toBe(false)
  })

  it('returns false when expiry equals now exactly', () => {
    expect(
      isSubscriptionActive(
        { status: 'active', expires_at: now.toISOString() },
        now
      )
    ).toBe(false)
  })

  it('returns false for a cancelled Subscription even if expiry is in the future', () => {
    expect(
      isSubscriptionActive(
        { status: 'cancelled', expires_at: '2027-05-20T12:00:00.000Z' },
        now
      )
    ).toBe(false)
  })

  it('returns false for an expired-status Subscription even if expiry is in the future', () => {
    expect(
      isSubscriptionActive(
        { status: 'expired', expires_at: '2027-05-20T12:00:00.000Z' },
        now
      )
    ).toBe(false)
  })

  it('returns false for null, undefined, or an unparseable timestamp', () => {
    expect(isSubscriptionActive(null, now)).toBe(false)
    expect(isSubscriptionActive(undefined, now)).toBe(false)
    expect(isSubscriptionActive({ status: 'active', expires_at: 'not-a-date' }, now)).toBe(false)
  })
})

describe.runIf(supabaseReady)('public.subscriptions RLS and Entitlement queries', () => {
  afterAll(async () => {
    if (serviceClient) {
      for (const id of createdAccountIds) {
        try {
          await serviceClient.auth.admin.deleteUser(id)
        } catch {
          // ignore cleanup failures
        }
      }
      createdAccountIds.clear()
    }
  })

  it('allows service_role to insert and update Subscription rows and enforces expires_at > starts_at', async () => {
    const accountA = await createSignedInAccount('service')
    const now = new Date()
    const startsAt = isoOffsetFrom(now, -1)
    const expiresAt = isoOffsetFrom(now, 180)
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const { data: inserted, error: insertError } = await serviceClient!
      .from('subscriptions')
      .insert({
        account_id: accountA.accountId,
        starts_at: startsAt,
        expires_at: expiresAt,
        status: 'active',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
      })
      .select('*')
      .single()

    expect(insertError).toBeNull()
    expect(inserted).toMatchObject({
      account_id: accountA.accountId,
      status: 'active',
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
    })

    const updatedExpiry = isoOffsetFrom(now, 365)
    const { data: updated, error: updateError } = await serviceClient!
      .from('subscriptions')
      .update({ expires_at: updatedExpiry, status: 'cancelled' })
      .eq('id', (inserted as SubscriptionRow).id)
      .select('*')
      .single()

    expect(updateError).toBeNull()
    expect((updated as SubscriptionRow).status).toBe('cancelled')
    expect(Date.parse((updated as SubscriptionRow).expires_at)).toBe(Date.parse(updatedExpiry))

    // Constraint check: expires_at <= starts_at must fail
    const { error: badRangeError } = await serviceClient!.from('subscriptions').insert({
      account_id: accountA.accountId,
      starts_at: expiresAt,
      expires_at: startsAt,
      status: 'active',
    })
    expect(badRangeError).not.toBeNull()
  })

  it('lets Account A read its own Subscription while blocking Account B and anon', async () => {
    const [accountA, accountB] = await Promise.all([
      createSignedInAccount('owner-a'),
      createSignedInAccount('other-b'),
    ])
    const now = new Date()
    const orderId = `order_rls_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const paymentId = `pay_rls_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const { data: inserted, error: insertError } = await serviceClient!
      .from('subscriptions')
      .insert({
        account_id: accountA.accountId,
        starts_at: isoOffsetFrom(now, -2),
        expires_at: isoOffsetFrom(now, 90),
        status: 'active',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
      })
      .select('*')
      .single()

    expect(insertError).toBeNull()
    const rowId = (inserted as SubscriptionRow).id

    // Account A can SELECT its own row directly and via fetchActiveSubscription
    const { data: ownRows, error: ownError } = await accountA.client
      .from('subscriptions')
      .select('*')
    expect(ownError).toBeNull()
    expect(ownRows).toHaveLength(1)
    expect((ownRows![0] as SubscriptionRow).id).toBe(rowId)

    const activeForA = await fetchActiveSubscription(accountA.client)
    expect(activeForA).not.toBeNull()
    expect(activeForA!.id).toBe(rowId)
    expect(activeForA!.account_id).toBe(accountA.accountId)

    const activeForAFiltered = await fetchActiveSubscription(accountA.client, accountA.accountId)
    expect(activeForAFiltered?.id).toBe(rowId)

    // Account B cannot SELECT Account A's row
    const { data: bRows, error: bError } = await accountB.client
      .from('subscriptions')
      .select('*')
      .eq('account_id', accountA.accountId)
    expect(bError).toBeNull()
    expect(bRows).toEqual([])

    const activeForB = await fetchActiveSubscription(accountB.client, accountA.accountId)
    expect(activeForB).toBeNull()

    const latestForB = await fetchLatestSubscription(accountB.client, accountA.accountId)
    expect(latestForB).toBeNull()

    // anon client cannot SELECT any rows (revoked at table privilege level)
    const anonClient = makeSignedOutClient()
    const { data: anonRows, error: anonError } = await anonClient
      .from('subscriptions')
      .select('*')
    expect(anonError).not.toBeNull()
    expect(anonError?.code).toBe('42501')
    expect(anonRows).toBeNull()

    expect(await fetchActiveSubscription(anonClient)).toBeNull()
  })

  it('denies INSERT, UPDATE, and DELETE on public.subscriptions for authenticated Accounts', async () => {
    const accountA = await createSignedInAccount('readonly-a')
    const now = new Date()

    const { data: seeded, error: seedError } = await serviceClient!
      .from('subscriptions')
      .insert({
        account_id: accountA.accountId,
        starts_at: isoOffsetFrom(now, -1),
        expires_at: isoOffsetFrom(now, 30),
        status: 'active',
      })
      .select('*')
      .single()

    expect(seedError).toBeNull()
    const seededId = (seeded as SubscriptionRow).id

    // Authenticated INSERT must fail with permission denied
    const { error: insertError } = await accountA.client.from('subscriptions').insert({
      account_id: accountA.accountId,
      starts_at: isoOffsetFrom(now, 0),
      expires_at: isoOffsetFrom(now, 365),
      status: 'active',
    })
    expect(insertError).not.toBeNull()
    expect(insertError?.code).toBe('42501')

    // Authenticated UPDATE must fail with permission denied
    const { error: updateError } = await accountA.client
      .from('subscriptions')
      .update({ expires_at: isoOffsetFrom(now, 999) })
      .eq('id', seededId)
    expect(updateError).not.toBeNull()
    expect(updateError?.code).toBe('42501')

    // Authenticated DELETE must fail with permission denied
    const { error: deleteError } = await accountA.client
      .from('subscriptions')
      .delete()
      .eq('id', seededId)
    expect(deleteError).not.toBeNull()
    expect(deleteError?.code).toBe('42501')
  })

  it('returns null from fetchActiveSubscription for expired or cancelled Subscriptions and picks the newest active one when multiple exist', async () => {
    const accountA = await createSignedInAccount('multi-a')
    const now = new Date()

    // Seed an expired-by-time row and a cancelled future row
    const { error: seedInactiveError } = await serviceClient!.from('subscriptions').insert([
      {
        account_id: accountA.accountId,
        starts_at: isoOffsetFrom(now, -60),
        expires_at: isoOffsetFrom(now, -5),
        status: 'active',
      },
      {
        account_id: accountA.accountId,
        starts_at: isoOffsetFrom(now, -10),
        expires_at: isoOffsetFrom(now, 20),
        status: 'cancelled',
      },
      {
        account_id: accountA.accountId,
        starts_at: isoOffsetFrom(now, -90),
        expires_at: isoOffsetFrom(now, -30),
        status: 'expired',
      },
    ])
    expect(seedInactiveError).toBeNull()

    // None of the rows above are active right now
    expect(await fetchActiveSubscription(accountA.client, accountA.accountId, now)).toBeNull()

    // fetchLatestSubscription still surfaces the most recent validity row for the Account page
    const latestInactive = await fetchLatestSubscription(accountA.client, accountA.accountId)
    expect(latestInactive).not.toBeNull()
    expect(latestInactive!.status).toBe('cancelled')

    // Now seed two active future Subscriptions and confirm the one with furthest expires_at wins
    const shorterExpiry = isoOffsetFrom(now, 45)
    const longerExpiry = isoOffsetFrom(now, 180)

    const { data: activeRows, error: seedActiveError } = await serviceClient!
      .from('subscriptions')
      .insert([
        {
          account_id: accountA.accountId,
          starts_at: isoOffsetFrom(now, -1),
          expires_at: shorterExpiry,
          status: 'active',
        },
        {
          account_id: accountA.accountId,
          starts_at: isoOffsetFrom(now, 0),
          expires_at: longerExpiry,
          status: 'active',
        },
      ])
      .select('*')

    expect(seedActiveError).toBeNull()
    const newestRow = (activeRows as SubscriptionRow[]).find(
      (r) => Date.parse(r.expires_at) === Date.parse(longerExpiry)
    )
    expect(newestRow).toBeDefined()

    const active = await fetchActiveSubscription(accountA.client, accountA.accountId, now)
    expect(active).not.toBeNull()
    expect(active!.id).toBe(newestRow!.id)

    const latest = await fetchLatestSubscription(accountA.client, accountA.accountId)
    expect(latest).not.toBeNull()
    expect(latest!.id).toBe(newestRow!.id)
  })
})
