import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import {
  SUBSCRIPTION_AMOUNT_PAISE,
  SUBSCRIPTION_CURRENCY,
  computeSubscriptionWindow,
  fetchRazorpayOrder,
  verifyRazorpayPaymentSignature,
} from '@/lib/payments/razorpay'

/**
 * POST /api/checkout/verify
 *
 * Verifies a completed Razorpay Checkout payment immediately after the browser modal closes:
 * 1. Authenticates the Learner's Account from Supabase session cookies.
 * 2. Verifies the cryptographic `razorpay_signature` (`HMAC-SHA256(order_id|payment_id, key_secret)`).
 * 3. Confirms directly with Razorpay's Orders API that the order is paid, in INR, at least ₹999,
 *    and bound to the signed-in Account via `notes.account_id`.
 * 4. Idempotently records a 365-day `active` Subscription in `public.subscriptions` (sharing the
 *    unique `razorpay_order_id` constraint with `/api/webhooks/razorpay`).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabasePublishableKey || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Subscriptions are not configured on this server yet.' },
      { status: 503 }
    )
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
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
          // Ignore cookie writes when the runtime disallows mutating headers.
        }
      },
    },
  })

  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user ?? null
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Sign in with your Account before verifying payment.' },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
  }

  const record =
    typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  const orderId =
    record && typeof record.razorpay_order_id === 'string' ? record.razorpay_order_id.trim() : ''
  const paymentId =
    record && typeof record.razorpay_payment_id === 'string'
      ? record.razorpay_payment_id.trim()
      : ''
  const signature =
    record && typeof record.razorpay_signature === 'string' ? record.razorpay_signature.trim() : ''

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: 'Missing Razorpay payment confirmation fields.' },
      { status: 400 }
    )
  }

  if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature, keySecret)) {
    return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 })
  }

  let order
  try {
    order = await fetchRazorpayOrder({ orderId, keyId, keySecret })
  } catch {
    return NextResponse.json(
      { error: 'Could not verify the order with Razorpay right now.' },
      { status: 502 }
    )
  }

  if (order.accountId !== user.id) {
    return NextResponse.json(
      { error: 'This payment order does not belong to your Account.' },
      { status: 403 }
    )
  }

  if (order.currency !== SUBSCRIPTION_CURRENCY || order.amount < SUBSCRIPTION_AMOUNT_PAISE) {
    return NextResponse.json(
      { error: 'Payment order currency or amount does not match the Subscription.' },
      { status: 400 }
    )
  }

  if (order.status !== 'paid' && order.amountPaid < SUBSCRIPTION_AMOUNT_PAISE) {
    return NextResponse.json(
      { error: 'Payment is still processing. Your Subscription will activate automatically once settled.' },
      { status: 202 }
    )
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: existing, error: existingError } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json(
      { error: 'Could not read Subscription state. Please try again.' },
      { status: 500 }
    )
  }

  if (existing) {
    return NextResponse.json({ verified: true, duplicate: true, subscription: existing })
  }

  const { starts_at, expires_at } = computeSubscriptionWindow()
  const { data: inserted, error: insertError } = await adminClient
    .from('subscriptions')
    .insert({
      account_id: user.id,
      starts_at,
      expires_at,
      status: 'active',
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
    })
    .select('*')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: raced } = await adminClient
        .from('subscriptions')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .maybeSingle()
      return NextResponse.json({ verified: true, duplicate: true, subscription: raced ?? null })
    }
    return NextResponse.json(
      { error: 'Could not activate Subscription right now.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ verified: true, subscription: inserted })
}
