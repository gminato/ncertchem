import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  computeSubscriptionWindow,
  parseOrderPaidWebhook,
  parseRefundProcessedWebhook,
  verifyRazorpayWebhookSignature,
} from '@/lib/payments/razorpay'

function getWebhookEventName(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null
  const event = (payload as Record<string, unknown>).event
  return typeof event === 'string' && event.trim() !== '' ? event.trim() : null
}

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook verification is not configured yet.' },
      { status: 503 }
    )
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Malformed JSON body.' }, { status: 400 })
  }

  const eventName = getWebhookEventName(payload)

  if (eventName === 'refund.processed') {
    const parsedRefund = parseRefundProcessedWebhook(payload)
    if (!parsedRefund.handled) {
      return NextResponse.json(
        { received: true, ignored: true, reason: parsedRefund.reason },
        { status: 200 }
      )
    }

    const supabase = getServiceSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Subscription storage is not configured yet.' },
        { status: 503 }
      )
    }

    const { data: existing, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('razorpay_payment_id', parsedRefund.paymentId)
      .maybeSingle()

    if (lookupError) {
      return NextResponse.json(
        { error: 'Could not verify Subscription for refund.' },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          reason: 'No matching Subscription found for refunded payment.',
        },
        { status: 200 }
      )
    }

    if (existing.status === 'cancelled') {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', existing.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Could not cancel refunded Subscription.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ received: true, cancelled: true }, { status: 200 })
  }

  const parsed = parseOrderPaidWebhook(payload)
  if (!parsed.handled) {
    return NextResponse.json(
      { received: true, ignored: true, reason: parsed.reason },
      { status: 200 }
    )
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Subscription storage is not configured yet.' },
      { status: 503 }
    )
  }

  const { data: existing, error: lookupError } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('razorpay_order_id', parsed.orderId)
    .maybeSingle()

  if (lookupError) {
    return NextResponse.json({ error: 'Could not verify existing Subscription.' }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
  }

  const { starts_at, expires_at } = computeSubscriptionWindow()
  const { error: insertError } = await supabase.from('subscriptions').insert({
    account_id: parsed.accountId,
    starts_at,
    expires_at,
    status: 'active',
    razorpay_order_id: parsed.orderId,
    razorpay_payment_id: parsed.paymentId,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }
    return NextResponse.json({ error: 'Could not record Subscription.' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
