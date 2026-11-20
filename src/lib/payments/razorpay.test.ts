import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SUBSCRIPTION_AMOUNT_PAISE,
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_DAYS,
  SUBSCRIPTION_PRICE_INR,
  computeSubscriptionWindow,
  createRazorpayOrder,
  fetchRazorpayOrder,
  parseOrderPaidWebhook,
  parseRefundProcessedWebhook,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from './razorpay'

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  createServerClient: vi.fn(),
  createServiceClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: mocks.createServerClient,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createServiceClient,
}))

import { POST as createOrderPost } from '@/app/api/checkout/create-order/route'
import { POST as verifyCheckoutPost } from '@/app/api/checkout/verify/route'
import { POST as razorpayWebhookPost } from '@/app/api/webhooks/razorpay/route'

const VALID_ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440000'
const WEBHOOK_SECRET = 'whsec_test_secret_123456'

function signPayload(rawBody: string, secret: string = WEBHOOK_SECRET): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
}

function makeOrderPaidPayload(overrides?: {
  event?: string
  orderId?: string
  paymentId?: string | null
  accountId?: string | null
  amount?: number
  currency?: string
}) {
  const orderEntity: Record<string, unknown> = {
    id: overrides?.orderId ?? 'order_Q1234567890abc',
    amount: overrides?.amount ?? SUBSCRIPTION_AMOUNT_PAISE,
    currency: overrides?.currency ?? SUBSCRIPTION_CURRENCY,
    notes:
      overrides && 'accountId' in overrides
        ? overrides.accountId === null
          ? {}
          : { account_id: overrides.accountId }
        : { account_id: VALID_ACCOUNT_ID },
  }

  const paymentSection =
    overrides && 'paymentId' in overrides && overrides.paymentId === null
      ? undefined
      : {
          entity: {
            id: overrides?.paymentId ?? 'pay_Q9876543210xyz',
          },
        }

  return {
    entity: 'event',
    event: overrides?.event ?? 'order.paid',
    payload: {
      order: { entity: orderEntity },
      ...(paymentSection ? { payment: paymentSection } : {}),
    },
  }
}

function makeRefundProcessedPayload(overrides?: {
  event?: string
  refundId?: string | null
  paymentId?: string | null
  amount?: number
  paymentAmount?: number
  amountRefunded?: number
  refundStatus?: string
  status?: string
  currency?: string
  includePayment?: boolean
}) {
  const refundEntity: Record<string, unknown> = {
    ...(overrides?.refundId === null ? {} : { id: overrides?.refundId ?? 'rfnd_Q111222333444' }),
    ...(overrides?.paymentId === null
      ? {}
      : { payment_id: overrides?.paymentId ?? 'pay_Q9876543210xyz' }),
    amount: overrides?.amount ?? SUBSCRIPTION_AMOUNT_PAISE,
    currency: overrides?.currency ?? SUBSCRIPTION_CURRENCY,
    status: overrides?.status ?? 'processed',
  }

  const includePayment = overrides?.includePayment ?? true
  const paymentSection = includePayment
    ? {
        entity: {
          ...(overrides?.paymentId === null
            ? {}
            : { id: overrides?.paymentId ?? 'pay_Q9876543210xyz' }),
          amount: overrides?.paymentAmount ?? SUBSCRIPTION_AMOUNT_PAISE,
          amount_refunded:
            overrides?.amountRefunded ?? overrides?.amount ?? SUBSCRIPTION_AMOUNT_PAISE,
          refund_status: overrides?.refundStatus ?? 'full',
          currency: overrides?.currency ?? SUBSCRIPTION_CURRENCY,
        },
      }
    : undefined

  return {
    entity: 'event',
    event: overrides?.event ?? 'refund.processed',
    payload: {
      refund: { entity: refundEntity },
      ...(paymentSection ? { payment: paymentSection } : {}),
    },
  }
}

describe('Razorpay payment constants', () => {
  it('defines the annual INR 999 Subscription pricing and duration', () => {
    expect(SUBSCRIPTION_PRICE_INR).toBe(999)
    expect(SUBSCRIPTION_AMOUNT_PAISE).toBe(99900)
    expect(SUBSCRIPTION_CURRENCY).toBe('INR')
    expect(SUBSCRIPTION_DAYS).toBe(365)
  })
})

describe('verifyRazorpayWebhookSignature', () => {
  const body = JSON.stringify(makeOrderPaidPayload())

  it('returns true for a valid HMAC-SHA256 signature', () => {
    const sig = signPayload(body, WEBHOOK_SECRET)
    expect(verifyRazorpayWebhookSignature(body, sig, WEBHOOK_SECRET)).toBe(true)
  })

  it('returns false when the body is tampered with', () => {
    const sig = signPayload(body, WEBHOOK_SECRET)
    expect(verifyRazorpayWebhookSignature(`${body} `, sig, WEBHOOK_SECRET)).toBe(false)
  })

  it('returns false when verified with a different secret', () => {
    const sig = signPayload(body, WEBHOOK_SECRET)
    expect(verifyRazorpayWebhookSignature(body, sig, 'wrong_secret')).toBe(false)
  })

  it('returns false for null, empty, short, or malformed non-hex signatures without throwing', () => {
    expect(verifyRazorpayWebhookSignature(body, null, WEBHOOK_SECRET)).toBe(false)
    expect(verifyRazorpayWebhookSignature(body, '', WEBHOOK_SECRET)).toBe(false)
    expect(verifyRazorpayWebhookSignature(body, 'abc123', WEBHOOK_SECRET)).toBe(false)
    expect(verifyRazorpayWebhookSignature(body, 'z'.repeat(64), WEBHOOK_SECRET)).toBe(false)
    expect(verifyRazorpayWebhookSignature(body, signPayload(body), '')).toBe(false)
  })
})

describe('parseOrderPaidWebhook', () => {
  it('parses a valid order.paid webhook payload including payment id', () => {
    const result = parseOrderPaidWebhook(makeOrderPaidPayload())
    expect(result).toEqual({
      handled: true,
      orderId: 'order_Q1234567890abc',
      paymentId: 'pay_Q9876543210xyz',
      accountId: VALID_ACCOUNT_ID,
      amount: 99900,
      currency: 'INR',
    })
  })

  it('parses a valid order.paid webhook payload when payment entity is absent', () => {
    const result = parseOrderPaidWebhook(makeOrderPaidPayload({ paymentId: null }))
    expect(result).toEqual({
      handled: true,
      orderId: 'order_Q1234567890abc',
      paymentId: null,
      accountId: VALID_ACCOUNT_ID,
      amount: 99900,
      currency: 'INR',
    })
  })

  it('ignores non-order.paid events', () => {
    const result = parseOrderPaidWebhook(makeOrderPaidPayload({ event: 'payment.authorized' }))
    expect(result.handled).toBe(false)
    if (!result.handled) {
      expect(result.reason).toContain('payment.authorized')
    }
  })

  it('rejects wrong currency and insufficient amount', () => {
    const wrongCurrency = parseOrderPaidWebhook(makeOrderPaidPayload({ currency: 'USD' }))
    expect(wrongCurrency.handled).toBe(false)

    const underpaid = parseOrderPaidWebhook(
      makeOrderPaidPayload({ amount: SUBSCRIPTION_AMOUNT_PAISE - 1 })
    )
    expect(underpaid.handled).toBe(false)
  })

  it('rejects missing or invalid UUID account_id', () => {
    const missingAccount = parseOrderPaidWebhook(makeOrderPaidPayload({ accountId: null }))
    expect(missingAccount.handled).toBe(false)

    const invalidUuid = parseOrderPaidWebhook(makeOrderPaidPayload({ accountId: 'not-a-uuid' }))
    expect(invalidUuid.handled).toBe(false)
  })
})

describe('parseRefundProcessedWebhook', () => {
  it('parses a full refund.processed webhook payload', () => {
    const result = parseRefundProcessedWebhook(makeRefundProcessedPayload())
    expect(result).toEqual({
      handled: true,
      refundId: 'rfnd_Q111222333444',
      paymentId: 'pay_Q9876543210xyz',
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: 'INR',
    })
  })

  it('parses a full refund when payment entity is absent and refund amount covers the Subscription', () => {
    const result = parseRefundProcessedWebhook(
      makeRefundProcessedPayload({ includePayment: false })
    )
    expect(result).toEqual({
      handled: true,
      refundId: 'rfnd_Q111222333444',
      paymentId: 'pay_Q9876543210xyz',
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: 'INR',
    })
  })

  it('ignores partial refunds whether payment entity is present or absent', () => {
    const partialWithPayment = parseRefundProcessedWebhook(
      makeRefundProcessedPayload({
        amount: 50000,
        amountRefunded: 50000,
        refundStatus: 'partial',
      })
    )
    expect(partialWithPayment.handled).toBe(false)

    const partialWithoutPayment = parseRefundProcessedWebhook(
      makeRefundProcessedPayload({
        includePayment: false,
        amount: 50000,
      })
    )
    expect(partialWithoutPayment.handled).toBe(false)
  })

  it('ignores non-processed refund status, missing payment_id, and wrong currency', () => {
    expect(
      parseRefundProcessedWebhook(makeRefundProcessedPayload({ status: 'pending' })).handled
    ).toBe(false)
    expect(
      parseRefundProcessedWebhook(makeRefundProcessedPayload({ paymentId: null })).handled
    ).toBe(false)
    expect(
      parseRefundProcessedWebhook(makeRefundProcessedPayload({ currency: 'USD' })).handled
    ).toBe(false)
  })
})

describe('createRazorpayOrder', () => {
  it('sends Basic Auth, INR 99900 paise, account_id note, and receipt <= 40 chars', async () => {
    let capturedUrl = ''
    let capturedInit: RequestInit | undefined

    const fetchMock: typeof fetch = async (input, init) => {
      capturedUrl = String(input)
      capturedInit = init
      return new Response(
        JSON.stringify({
          id: 'order_Created123',
          amount: SUBSCRIPTION_AMOUNT_PAISE,
          currency: SUBSCRIPTION_CURRENCY,
          receipt: 'ncertchem_550e8400_1700000000000',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await createRazorpayOrder({
      accountId: VALID_ACCOUNT_ID,
      keyId: 'rzp_test_key123',
      keySecret: 'rzp_test_secret456',
      fetchImpl: fetchMock,
    })

    expect(capturedUrl).toBe('https://api.razorpay.com/v1/orders')
    expect(capturedInit?.method).toBe('POST')

    const headers = capturedInit?.headers as Record<string, string>
    const expectedAuth = `Basic ${Buffer.from('rzp_test_key123:rzp_test_secret456').toString('base64')}`
    expect(headers.Authorization).toBe(expectedAuth)
    expect(headers['Content-Type']).toBe('application/json')

    const sentBody = JSON.parse(String(capturedInit?.body)) as {
      amount: number
      currency: string
      receipt: string
      notes: { account_id: string }
    }
    expect(sentBody.amount).toBe(99900)
    expect(sentBody.currency).toBe('INR')
    expect(sentBody.notes).toEqual({ account_id: VALID_ACCOUNT_ID })
    expect(sentBody.receipt.startsWith('ncertchem_550e8400_')).toBe(true)
    expect(sentBody.receipt.length).toBeLessThanOrEqual(40)

    expect(result).toMatchObject({
      id: 'order_Created123',
      amount: 99900,
      currency: 'INR',
    })
  })

  it('throws a descriptive error on non-2xx Razorpay responses', async () => {
    const fetchMock: typeof fetch = async () =>
      new Response(
        JSON.stringify({ error: { description: 'Authentication failed' } }),
        { status: 401, statusText: 'Unauthorized' }
      )

    await expect(
      createRazorpayOrder({
        accountId: VALID_ACCOUNT_ID,
        keyId: 'rzp_test_bad',
        keySecret: 'bad_secret',
        fetchImpl: fetchMock,
      })
    ).rejects.toThrow(/HTTP 401.*Authentication failed/)
  })

  it('throws when the Razorpay order response is missing required fields', async () => {
    const fetchMock: typeof fetch = async () =>
      new Response(JSON.stringify({ id: 'order_OnlyId' }), { status: 200 })

    await expect(
      createRazorpayOrder({
        accountId: VALID_ACCOUNT_ID,
        keyId: 'rzp_test_key123',
        keySecret: 'rzp_test_secret456',
        fetchImpl: fetchMock,
      })
    ).rejects.toThrow(/missing required fields/)
  })
})

describe('computeSubscriptionWindow', () => {
  it('returns an exact 365-day ISO window from the given start date', () => {
    const start = new Date('2026-11-20T10:15:30.000Z')
    const window = computeSubscriptionWindow(start)

    expect(window.starts_at).toBe('2026-11-20T10:15:30.000Z')
    expect(window.expires_at).toBe('2027-11-20T10:15:30.000Z')
    expect(Date.parse(window.expires_at) - Date.parse(window.starts_at)).toBe(
      365 * 24 * 60 * 60 * 1000
    )
  })
})

describe('/api/webhooks/razorpay route handler', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-test',
    }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('rejects an invalid signature with 401', async () => {
    const body = JSON.stringify(makeOrderPaidPayload())
    const request = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': '0'.repeat(64),
      },
      body,
    })

    const response = await razorpayWebhookPost(request)
    expect(response.status).toBe(401)
    expect(mocks.createServiceClient).not.toHaveBeenCalled()
  })

  it('ignores unrelated Razorpay events with 200', async () => {
    const body = JSON.stringify(makeOrderPaidPayload({ event: 'payment.authorized' }))
    const request = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': signPayload(body),
      },
      body,
    })

    const response = await razorpayWebhookPost(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toMatchObject({ received: true, ignored: true })
    expect(mocks.createServiceClient).not.toHaveBeenCalled()
  })

  it('returns 503 when RAZORPAY_WEBHOOK_SECRET is missing', async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET
    const body = JSON.stringify(makeOrderPaidPayload())
    const request = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: { 'x-razorpay-signature': signPayload(body) },
      body,
    })

    const response = await razorpayWebhookPost(request)
    expect(response.status).toBe(503)
  })

  it('returns 400 for malformed JSON with a valid signature', async () => {
    const rawBody = '{malformed-json'
    const request = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: { 'x-razorpay-signature': signPayload(rawBody) },
      body: rawBody,
    })

    const response = await razorpayWebhookPost(request)
    expect(response.status).toBe(400)
  })

  it('inserts an active Subscription for a valid order.paid webhook and treats duplicates idempotently', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const maybeSingleMock = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: 'sub-existing', status: 'active' }, error: null })

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: maybeSingleMock,
          }),
        }),
        insert: insertMock,
      }),
    })

    const body = JSON.stringify(makeOrderPaidPayload())
    const makeRequest = () =>
      new Request('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-razorpay-signature': signPayload(body),
        },
        body,
      })

    const first = await razorpayWebhookPost(makeRequest())
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ received: true })
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        account_id: VALID_ACCOUNT_ID,
        status: 'active',
        razorpay_order_id: 'order_Q1234567890abc',
        razorpay_payment_id: 'pay_Q9876543210xyz',
      })
    )

    const duplicate = await razorpayWebhookPost(makeRequest())
    expect(duplicate.status).toBe(200)
    expect(await duplicate.json()).toEqual({ received: true, duplicate: true })
    expect(insertMock).toHaveBeenCalledTimes(1)
  })

  it('returns 200 duplicate when insert hits unique constraint violation 23505', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate' } })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: insertMock,
      }),
    })

    const body = JSON.stringify(makeOrderPaidPayload())
    const request = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': signPayload(body),
      },
      body,
    })

    const response = await razorpayWebhookPost(request)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true, duplicate: true })
  })

  it('cancels the matching Subscription on a full refund.processed webhook and handles duplicates idempotently', async () => {
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock })
    const selectEqMock = vi.fn().mockReturnValue({
      maybeSingle: vi
        .fn()
        .mockResolvedValueOnce({ data: { id: 'sub-to-cancel', status: 'active' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'sub-to-cancel', status: 'cancelled' }, error: null }),
    })

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: selectEqMock }),
        update: updateMock,
      }),
    })

    const body = JSON.stringify(makeRefundProcessedPayload())
    const makeRequest = () =>
      new Request('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-razorpay-signature': signPayload(body),
        },
        body,
      })

    const first = await razorpayWebhookPost(makeRequest())
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ received: true, cancelled: true })
    expect(selectEqMock).toHaveBeenCalledWith('razorpay_payment_id', 'pay_Q9876543210xyz')
    expect(updateMock).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(updateEqMock).toHaveBeenCalledWith('id', 'sub-to-cancel')

    const duplicate = await razorpayWebhookPost(makeRequest())
    expect(duplicate.status).toBe(200)
    expect(await duplicate.json()).toEqual({ received: true, duplicate: true })
    expect(updateMock).toHaveBeenCalledTimes(1)
  })

  it('ignores partial refund.processed webhooks without querying Supabase', async () => {
    const body = JSON.stringify(
      makeRefundProcessedPayload({
        amount: 50000,
        amountRefunded: 50000,
        refundStatus: 'partial',
      })
    )
    const request = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': signPayload(body),
      },
      body,
    })

    const response = await razorpayWebhookPost(request)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ received: true, ignored: true })
    expect(mocks.createServiceClient).not.toHaveBeenCalled()
  })

  it('returns 200 ignored when refund.processed has no matching Subscription row', async () => {
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    })

    const body = JSON.stringify(makeRefundProcessedPayload())
    const request = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': signPayload(body),
      },
      body,
    })

    const response = await razorpayWebhookPost(request)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ received: true, ignored: true })
  })

  it('returns 500 when cancelling a refunded Subscription fails in Supabase', async () => {
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: { id: 'sub-to-cancel', status: 'active' }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'db timeout' } }),
        }),
      }),
    })

    const body = JSON.stringify(makeRefundProcessedPayload())
    const request = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': signPayload(body),
      },
      body,
    })

    const response = await razorpayWebhookPost(request)
    expect(response.status).toBe(500)
  })
})

describe('/api/checkout/create-order route handler', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      RAZORPAY_KEY_ID: 'rzp_test_key123',
      RAZORPAY_KEY_SECRET: 'rzp_test_secret456',
    }
    mocks.cookies.mockResolvedValue({
      getAll: () => [],
      set: vi.fn(),
    })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.unstubAllGlobals()
  })

  function mockServerSupabase(options: {
    user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null
    activeSubscription?: { id: string; status: 'active'; expires_at: string } | null
  }) {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: options.activeSubscription ?? null,
      error: null,
    })
    const queryChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle,
    }

    mocks.createServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: options.user },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(queryChain),
    })
  }

  it('returns 401 when the Learner is not signed in', async () => {
    mockServerSupabase({ user: null })

    const response = await createOrderPost()
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      error: 'Sign in with your Account before subscribing.',
    })
  })

  it('returns 409 when the Account already has an active Subscription', async () => {
    mockServerSupabase({
      user: { id: VALID_ACCOUNT_ID, email: 'learner@ncertchem.test' },
      activeSubscription: {
        id: 'sub-active-1',
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    })

    const response = await createOrderPost()
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'Your Account already has an active Subscription.',
    })
  })

  it('returns 503 when Razorpay credentials are missing', async () => {
    delete process.env.RAZORPAY_KEY_ID
    delete process.env.RAZORPAY_KEY_SECRET
    mockServerSupabase({
      user: { id: VALID_ACCOUNT_ID, email: 'learner@ncertchem.test' },
      activeSubscription: null,
    })

    const response = await createOrderPost()
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'Payments are not configured yet.',
    })
  })

  it('returns 200 with order details when signed in and Razorpay is configured', async () => {
    mockServerSupabase({
      user: {
        id: VALID_ACCOUNT_ID,
        email: 'learner@ncertchem.test',
        user_metadata: { full_name: 'Aarav Sharma' },
      },
      activeSubscription: null,
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 'order_LiveTest001',
            amount: SUBSCRIPTION_AMOUNT_PAISE,
            currency: SUBSCRIPTION_CURRENCY,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    )

    const response = await createOrderPost()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      orderId: 'order_LiveTest001',
      amount: 99900,
      currency: 'INR',
      keyId: 'rzp_test_key123',
      accountEmail: 'learner@ncertchem.test',
      accountName: 'Aarav Sharma',
    })
  })
})

describe('verifyRazorpayPaymentSignature & fetchRazorpayOrder', () => {
  it('verifies valid payment signatures and rejects tampered ones', () => {
    const orderId = 'order_Verify001'
    const paymentId = 'pay_Verify001'
    const secret = 'rzp_test_secret_xyz'
    const sig = createHmac('sha256', secret).update(`${orderId}|${paymentId}`, 'utf8').digest('hex')

    expect(verifyRazorpayPaymentSignature(orderId, paymentId, sig, secret)).toBe(true)
    expect(verifyRazorpayPaymentSignature(orderId, 'pay_Tampered', sig, secret)).toBe(false)
    expect(verifyRazorpayPaymentSignature(orderId, paymentId, sig, 'wrong_secret')).toBe(false)
    expect(verifyRazorpayPaymentSignature(orderId, paymentId, null, secret)).toBe(false)
  })

  it('fetches and parses order details from Razorpay', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'order_Verify001',
          amount: 99900,
          amount_paid: 99900,
          currency: 'INR',
          status: 'paid',
          notes: { account_id: VALID_ACCOUNT_ID },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const order = await fetchRazorpayOrder({
      orderId: 'order_Verify001',
      keyId: 'rzp_test_key123',
      keySecret: 'rzp_test_secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(order).toEqual({
      id: 'order_Verify001',
      amount: 99900,
      amountPaid: 99900,
      currency: 'INR',
      status: 'paid',
      accountId: VALID_ACCOUNT_ID,
    })
  })
})

describe('/api/checkout/verify route handler', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_service_role_test'
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key123'
    process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_456'
    mocks.cookies.mockResolvedValue({ getAll: () => [], set: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key]
    }
    Object.assign(process.env, originalEnv)
  })

  it('returns 401 when unauthenticated', async () => {
    mocks.createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    })

    const res = await verifyCheckoutPost(
      new Request('http://localhost:3000/api/checkout/verify', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    )
    expect(res.status).toBe(401)
  })

  it('returns 400 for an invalid payment signature', async () => {
    mocks.createServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: VALID_ACCOUNT_ID } }, error: null }),
      },
    })

    const res = await verifyCheckoutPost(
      new Request('http://localhost:3000/api/checkout/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: '0'.repeat(64),
        }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('activates a 365-day Subscription when signature and Razorpay order match', async () => {
    const orderId = 'order_VerifyLive01'
    const paymentId = 'pay_VerifyLive01'
    const signature = createHmac('sha256', 'rzp_test_secret_456')
      .update(`${orderId}|${paymentId}`, 'utf8')
      .digest('hex')

    mocks.createServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: VALID_ACCOUNT_ID } }, error: null }),
      },
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: orderId,
            amount: 99900,
            amount_paid: 99900,
            currency: 'INR',
            status: 'paid',
            notes: { account_id: VALID_ACCOUNT_ID },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    )

    const insertedRow = {
      id: 'sub-new-1',
      account_id: VALID_ACCOUNT_ID,
      status: 'active',
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      starts_at: '2026-11-20T00:00:00.000Z',
      expires_at: '2027-11-20T00:00:00.000Z',
      created_at: '2026-11-20T00:00:00.000Z',
    }

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: insertedRow, error: null }),
          }),
        }),
      }),
    })

    const res = await verifyCheckoutPost(
      new Request('http://localhost:3000/api/checkout/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ verified: true, subscription: insertedRow })
  })
})
