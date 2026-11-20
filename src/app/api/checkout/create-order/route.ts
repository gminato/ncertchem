import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { fetchActiveSubscription } from '@/lib/account/subscriptions'
import { createRazorpayOrder } from '@/lib/payments/razorpay'

function readAccountName(metadata: unknown): string | null {
  if (typeof metadata !== 'object' || metadata === null) return null
  const record = metadata as Record<string, unknown>
  const text = (value: unknown) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : null
  return text(record.full_name) ?? text(record.name)
}

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Accounts are not configured yet.' }, { status: 503 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
          // Ignore cookie write failures if response headers cannot be mutated.
        }
      },
    },
  })

  const { data: authData, error: authError } = await supabase.auth.getUser()
  const account = authData?.user ?? null

  if (authError || !account) {
    return NextResponse.json(
      { error: 'Sign in with your Account before subscribing.' },
      { status: 401 }
    )
  }

  const activeSubscription = await fetchActiveSubscription(supabase, account.id)
  if (activeSubscription) {
    return NextResponse.json(
      { error: 'Your Account already has an active Subscription.' },
      { status: 409 }
    )
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 })
  }

  try {
    const order = await createRazorpayOrder({
      accountId: account.id,
      keyId,
      keySecret,
    })

    return NextResponse.json(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        accountEmail: account.email ?? null,
        accountName: readAccountName(account.user_metadata),
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Could not start checkout right now. Please try again.' },
      { status: 502 }
    )
  }
}
