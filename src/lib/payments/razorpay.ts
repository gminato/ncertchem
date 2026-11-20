import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Razorpay payment and webhook helpers for Annual Subscriptions.
 */

export const SUBSCRIPTION_PRICE_INR = 999
export const SUBSCRIPTION_AMOUNT_PAISE = 99900
export const SUBSCRIPTION_CURRENCY = 'INR'
export const SUBSCRIPTION_DAYS = 365

const RAZORPAY_ORDERS_ENDPOINT = 'https://api.razorpay.com/v1/orders'
const MS_PER_DAY = 24 * 60 * 60 * 1000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/i

export interface CreateRazorpayOrderParams {
  accountId: string
  keyId: string
  keySecret: string
  fetchImpl?: typeof fetch
}

export interface RazorpayOrderResult {
  id: string
  amount: number
  currency: string
  receipt: string
}

export interface FetchRazorpayOrderParams {
  orderId: string
  keyId: string
  keySecret: string
  fetchImpl?: typeof fetch
}

export interface RazorpayOrderDetails {
  id: string
  amount: number
  amountPaid: number
  currency: string
  status: string
  accountId: string | null
}

export type ParsedOrderPaidWebhook =
  | {
      handled: true
      orderId: string
      paymentId: string | null
      accountId: string
      amount: number
      currency: string
    }
  | {
      handled: false
      reason: string
    }

export type ParsedRefundProcessedWebhook =
  | {
      handled: true
      refundId: string | null
      paymentId: string
      amount: number
      currency: string
    }
  | {
      handled: false
      reason: string
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Creates a Razorpay order for a 1-year Subscription (INR 999 / 99900 paise) bound to an Account
 * via `notes.account_id`.
 */
export async function createRazorpayOrder({
  accountId,
  keyId,
  keySecret,
  fetchImpl = fetch,
}: CreateRazorpayOrderParams): Promise<RazorpayOrderResult> {
  const receipt = `ncertchem_${accountId.slice(0, 8)}_${Date.now()}`
  const authToken = Buffer.from(`${keyId}:${keySecret}`, 'utf8').toString('base64')

  const response = await fetchImpl(RAZORPAY_ORDERS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: SUBSCRIPTION_CURRENCY,
      receipt,
      notes: {
        account_id: accountId,
      },
    }),
  })

  if (!response.ok) {
    let detail = response.statusText || 'Unknown error'
    try {
      const errorText = await response.text()
      if (errorText) {
        try {
          const parsedError: unknown = JSON.parse(errorText)
          if (
            isRecord(parsedError) &&
            isRecord(parsedError.error) &&
            typeof parsedError.error.description === 'string' &&
            parsedError.error.description.trim() !== ''
          ) {
            detail = parsedError.error.description.trim()
          } else {
            detail = errorText.slice(0, 200)
          }
        } catch {
          detail = errorText.slice(0, 200)
        }
      }
    } catch {
      // Ignore secondary body-read errors; status code is preserved in the thrown message.
    }
    throw new Error(`Razorpay order creation failed (HTTP ${response.status}): ${detail}`)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error('Razorpay order response could not be parsed as JSON.')
  }

  if (
    !isRecord(data) ||
    typeof data.id !== 'string' ||
    data.id.trim() === '' ||
    typeof data.amount !== 'number' ||
    !Number.isFinite(data.amount) ||
    typeof data.currency !== 'string' ||
    data.currency.trim() === ''
  ) {
    throw new Error('Razorpay order response is missing required fields (id, amount, currency).')
  }

  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: typeof data.receipt === 'string' && data.receipt.trim() !== '' ? data.receipt : receipt,
  }
}

/**
 * Verifies a Razorpay Checkout payment signature (`HMAC-SHA256(orderId + "|" + paymentId, keySecret)`)
 * using constant-time comparison.
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string | null,
  keySecret: string
): boolean {
  if (!orderId || !paymentId || !signature || !keySecret) return false
  if (!SHA256_HEX_PATTERN.test(signature)) return false

  const expectedHex = createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`, 'utf8')
    .digest('hex')
  const expectedBuf = Buffer.from(expectedHex, 'hex')
  const actualBuf = Buffer.from(signature, 'hex')

  if (expectedBuf.length !== actualBuf.length) return false
  return timingSafeEqual(expectedBuf, actualBuf)
}

/**
 * Fetches an existing Razorpay order by id so the server can confirm its status, currency, amount,
 * and bound `notes.account_id` directly with Razorpay.
 */
export async function fetchRazorpayOrder({
  orderId,
  keyId,
  keySecret,
  fetchImpl = fetch,
}: FetchRazorpayOrderParams): Promise<RazorpayOrderDetails> {
  const authToken = Buffer.from(`${keyId}:${keySecret}`, 'utf8').toString('base64')
  const response = await fetchImpl(`${RAZORPAY_ORDERS_ENDPOINT}/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Razorpay order lookup failed (HTTP ${response.status}).`)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error('Razorpay order lookup response could not be parsed as JSON.')
  }

  if (
    !isRecord(data) ||
    typeof data.id !== 'string' ||
    typeof data.amount !== 'number' ||
    typeof data.currency !== 'string' ||
    typeof data.status !== 'string'
  ) {
    throw new Error('Razorpay order lookup response is missing required fields.')
  }

  const notes = isRecord(data.notes) ? data.notes : null
  const rawAccountId = notes && typeof notes.account_id === 'string' ? notes.account_id.trim() : ''

  return {
    id: data.id,
    amount: data.amount,
    amountPaid: typeof data.amount_paid === 'number' ? data.amount_paid : 0,
    currency: data.currency,
    status: data.status,
    accountId: rawAccountId && UUID_PATTERN.test(rawAccountId) ? rawAccountId : null,
  }
}

/**
 * Verifies a Razorpay webhook `x-razorpay-signature` HMAC-SHA256 hex digest against the raw request
 * body using constant-time comparison.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null,
  webhookSecret: string
): boolean {
  if (!signature || !webhookSecret) return false
  if (!SHA256_HEX_PATTERN.test(signature)) return false

  const expectedHex = createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest('hex')
  const expectedBuf = Buffer.from(expectedHex, 'hex')
  const actualBuf = Buffer.from(signature, 'hex')

  if (expectedBuf.length !== actualBuf.length) return false
  return timingSafeEqual(expectedBuf, actualBuf)
}

/**
 * Parses and validates a Razorpay `order.paid` webhook payload.
 * Returns `{ handled: false, reason }` for unrelated events or invalid order fields.
 */
export function parseOrderPaidWebhook(payload: unknown): ParsedOrderPaidWebhook {
  if (!isRecord(payload)) {
    return { handled: false, reason: 'Webhook payload is not a JSON object.' }
  }

  const event = payload.event
  if (typeof event !== 'string' || event.trim() === '') {
    return { handled: false, reason: 'Webhook payload is missing an event name.' }
  }

  if (event !== 'order.paid') {
    return { handled: false, reason: `Ignoring Razorpay event "${event}".` }
  }

  const eventPayload = isRecord(payload.payload) ? payload.payload : null
  const orderContainer = eventPayload && isRecord(eventPayload.order) ? eventPayload.order : null
  const orderEntity =
    orderContainer && isRecord(orderContainer.entity) ? orderContainer.entity : null

  if (!orderEntity) {
    return { handled: false, reason: 'Missing order entity in order.paid payload.' }
  }

  const orderId = typeof orderEntity.id === 'string' ? orderEntity.id.trim() : ''
  if (!orderId) {
    return { handled: false, reason: 'Missing order id in order.paid payload.' }
  }

  const notes = isRecord(orderEntity.notes) ? orderEntity.notes : null
  const rawAccountId = notes && typeof notes.account_id === 'string' ? notes.account_id.trim() : ''
  if (!rawAccountId || !UUID_PATTERN.test(rawAccountId)) {
    return { handled: false, reason: 'Missing or invalid Account id in order notes.' }
  }

  const currency = typeof orderEntity.currency === 'string' ? orderEntity.currency.trim() : ''
  if (currency !== SUBSCRIPTION_CURRENCY) {
    return {
      handled: false,
      reason: `Unexpected currency "${currency || 'missing'}"; expected ${SUBSCRIPTION_CURRENCY}.`,
    }
  }

  const amount = orderEntity.amount
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < SUBSCRIPTION_AMOUNT_PAISE) {
    return {
      handled: false,
      reason: `Insufficient order amount; expected at least ${SUBSCRIPTION_AMOUNT_PAISE} paise.`,
    }
  }

  const paymentContainer =
    eventPayload && isRecord(eventPayload.payment) ? eventPayload.payment : null
  const paymentEntity =
    paymentContainer && isRecord(paymentContainer.entity) ? paymentContainer.entity : null
  const paymentId =
    paymentEntity && typeof paymentEntity.id === 'string' && paymentEntity.id.trim() !== ''
      ? paymentEntity.id.trim()
      : null

  return {
    handled: true,
    orderId,
    paymentId,
    accountId: rawAccountId,
    amount,
    currency,
  }
}

/**
 * Parses and validates a Razorpay `refund.processed` webhook payload for a full refund.
 * Returns `{ handled: false, reason }` for unrelated events, partial refunds, or missing fields.
 */
export function parseRefundProcessedWebhook(payload: unknown): ParsedRefundProcessedWebhook {
  if (!isRecord(payload)) {
    return { handled: false, reason: 'Webhook payload is not a JSON object.' }
  }

  const event = payload.event
  if (typeof event !== 'string' || event.trim() === '') {
    return { handled: false, reason: 'Webhook payload is missing an event name.' }
  }

  if (event !== 'refund.processed') {
    return { handled: false, reason: `Ignoring Razorpay event "${event}".` }
  }

  const eventPayload = isRecord(payload.payload) ? payload.payload : null
  const refundContainer =
    eventPayload && isRecord(eventPayload.refund) ? eventPayload.refund : null
  const refundEntity =
    refundContainer && isRecord(refundContainer.entity) ? refundContainer.entity : null

  if (!refundEntity) {
    return { handled: false, reason: 'Missing refund entity in refund.processed payload.' }
  }

  const refundStatus =
    typeof refundEntity.status === 'string' ? refundEntity.status.trim().toLowerCase() : ''
  if (refundStatus && refundStatus !== 'processed') {
    return {
      handled: false,
      reason: `Ignoring refund with status "${refundStatus}"; expected "processed".`,
    }
  }

  const paymentContainer =
    eventPayload && isRecord(eventPayload.payment) ? eventPayload.payment : null
  const paymentEntity =
    paymentContainer && isRecord(paymentContainer.entity) ? paymentContainer.entity : null

  const paymentIdFromRefund =
    typeof refundEntity.payment_id === 'string' ? refundEntity.payment_id.trim() : ''
  const paymentIdFromPayment =
    paymentEntity && typeof paymentEntity.id === 'string' ? paymentEntity.id.trim() : ''
  const paymentId = paymentIdFromRefund || paymentIdFromPayment

  if (!paymentId) {
    return { handled: false, reason: 'Missing payment_id in refund.processed payload.' }
  }

  const refundId =
    typeof refundEntity.id === 'string' && refundEntity.id.trim() !== ''
      ? refundEntity.id.trim()
      : null

  const currency =
    typeof refundEntity.currency === 'string' && refundEntity.currency.trim() !== ''
      ? refundEntity.currency.trim()
      : paymentEntity && typeof paymentEntity.currency === 'string'
        ? paymentEntity.currency.trim()
        : ''

  if (currency !== SUBSCRIPTION_CURRENCY) {
    return {
      handled: false,
      reason: `Unexpected refund currency "${currency || 'missing'}"; expected ${SUBSCRIPTION_CURRENCY}.`,
    }
  }

  const refundAmount = refundEntity.amount
  if (typeof refundAmount !== 'number' || !Number.isFinite(refundAmount) || refundAmount <= 0) {
    return { handled: false, reason: 'Missing or invalid refund amount in refund.processed payload.' }
  }

  // Only revoke Entitlement on a full refund.
  if (paymentEntity) {
    const paymentRefundStatus =
      typeof paymentEntity.refund_status === 'string'
        ? paymentEntity.refund_status.trim().toLowerCase()
        : ''
    const paymentAmount =
      typeof paymentEntity.amount === 'number' && Number.isFinite(paymentEntity.amount)
        ? paymentEntity.amount
        : null
    const paymentAmountRefunded =
      typeof paymentEntity.amount_refunded === 'number' &&
      Number.isFinite(paymentEntity.amount_refunded)
        ? paymentEntity.amount_refunded
        : null

    const isFullByStatus = paymentRefundStatus === 'full'
    const isFullByAmount =
      paymentAmount !== null &&
      paymentAmount > 0 &&
      (paymentAmountRefunded !== null
        ? paymentAmountRefunded >= paymentAmount
        : refundAmount >= paymentAmount)

    if (!isFullByStatus && !isFullByAmount) {
      return {
        handled: false,
        reason: 'Ignoring partial refund; Subscription is only cancelled on a full refund.',
      }
    }
  } else if (refundAmount < SUBSCRIPTION_AMOUNT_PAISE) {
    return {
      handled: false,
      reason: `Ignoring partial refund (${refundAmount} paise < ${SUBSCRIPTION_AMOUNT_PAISE} paise).`,
    }
  }

  return {
    handled: true,
    refundId,
    paymentId,
    amount: refundAmount,
    currency,
  }
}

/**
 * Computes the ISO-8601 `starts_at` and `expires_at` timestamps for a new Subscription lasting
 * exactly `SUBSCRIPTION_DAYS` (365 days).
 */
export function computeSubscriptionWindow(start: Date = new Date()): {
  starts_at: string
  expires_at: string
} {
  const startsAtMs = start.getTime()
  const expiresAtMs = startsAtMs + SUBSCRIPTION_DAYS * MS_PER_DAY
  return {
    starts_at: new Date(startsAtMs).toISOString(),
    expires_at: new Date(expiresAtMs).toISOString(),
  }
}
