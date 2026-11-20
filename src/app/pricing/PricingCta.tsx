'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/controls/Button'
import { GoogleSignInButton } from '@/components/account/GoogleSignInButton'
import { useAccount } from '@/lib/account/account'
import { getSupabase } from '@/lib/account/client'
import {
  fetchActiveSubscription,
  isSubscriptionActive,
  type SubscriptionRow,
} from '@/lib/account/subscriptions'
import { BRAND } from '@/lib/brand'
import styles from './pricing.module.css'

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

interface RazorpayPaymentResponse {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
  }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss?: () => void
  }
}

interface RazorpayInstance {
  open(): void
  on?: (event: string, callback: () => void) => void
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance

function getWindowRazorpay(): RazorpayConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay
}

interface CreateOrderPayload {
  orderId?: string
  order_id?: string
  id?: string
  keyId?: string
  key_id?: string
  key?: string
  amount?: number
  currency?: string
  error?: string
}

let razorpayLoading: Promise<RazorpayConstructor> | null = null

function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Checkout is only available in the browser.'))
  }
  const existing = getWindowRazorpay()
  if (existing) return Promise.resolve(existing)
  if (razorpayLoading) return razorpayLoading

  razorpayLoading = new Promise<RazorpayConstructor>((resolve, reject) => {
    const ready = () => {
      const ctor = getWindowRazorpay()
      if (ctor) resolve(ctor)
      else reject(new Error('Payment checkout could not load.'))
    }
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_SRC}"]`
    )
    if (existingScript) {
      existingScript.addEventListener('load', ready, { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Payment checkout could not load.')),
        { once: true }
      )
      return
    }
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_SRC
    script.async = true
    script.onload = ready
    script.onerror = () => reject(new Error('Payment checkout could not load.'))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    razorpayLoading = null
    throw error
  })

  return razorpayLoading
}

function formatExpiryDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function PricingCta() {
  const account = useAccount()
  const accountKey = account.status === 'signed-in' ? (account.email ?? 'signed-in') : null
  const [loaded, setLoaded] = useState<{ key: string | null; sub: SubscriptionRow | null }>({
    key: null,
    sub: null,
  })
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!accountKey) return

    let cancelled = false
    const client = getSupabase()
    const task = client ? fetchActiveSubscription(client) : Promise.resolve(null)

    task
      .then((row) => {
        if (cancelled) return
        setLoaded({ key: accountKey, sub: row && isSubscriptionActive(row) ? row : null })
      })
      .catch(() => {
        if (cancelled) return
        setLoaded({ key: accountKey, sub: null })
      })

    return () => {
      cancelled = true
    }
  }, [accountKey])

  const subState = accountKey !== null && loaded.key === accountKey ? 'ready' : 'loading'
  const activeSub = accountKey !== null && loaded.key === accountKey ? loaded.sub : null

  const pollForActivation = async () => {
    const client = getSupabase()
    if (!client) return
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      try {
        const sub = await fetchActiveSubscription(client)
        if (sub && isSubscriptionActive(sub)) {
          setLoaded({ key: accountKey, sub })
          setStatusMessage(null)
          setCheckoutBusy(false)
          return
        }
      } catch {
        // Keep polling quietly; webhook may still be processing.
      }
    }
    setStatusMessage(
      'Payment received. Your Subscription may take a moment to activate — refresh this page or check your Account page shortly.'
    )
    setCheckoutBusy(false)
  }

  const handleSubscribe = async () => {
    if (checkoutBusy) return
    setErrorMessage(null)
    setStatusMessage(null)
    setCheckoutBusy(true)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const client = getSupabase()
      if (client) {
        try {
          const { data } = await client.auth.getSession()
          const accessToken = data.session?.access_token
          if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`
          }
        } catch {
          // Proceed with cookie-based auth if session read fails.
        }
      }

      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
      })

      let payload: CreateOrderPayload | null = null
      try {
        payload = (await response.json()) as CreateOrderPayload
      } catch {
        payload = null
      }

      if (!response.ok) {
        if (response.status === 409 && client) {
          const sub = await fetchActiveSubscription(client).catch(() => null)
          if (sub && isSubscriptionActive(sub)) {
            setLoaded({ key: accountKey, sub })
            setCheckoutBusy(false)
            return
          }
        }
        if (response.status === 401) {
          setErrorMessage('Please sign in with Google again before starting checkout.')
        } else if (response.status === 404 || response.status === 503) {
          setErrorMessage(
            payload?.error ?? 'Online checkout is not configured on this site yet. Please check back soon.'
          )
        } else {
          setErrorMessage(
            payload?.error ?? 'Could not start checkout right now. Please try again in a moment.'
          )
        }
        setCheckoutBusy(false)
        return
      }

      const orderId = payload?.orderId ?? payload?.order_id ?? payload?.id
      const keyId = payload?.keyId ?? payload?.key_id ?? payload?.key
      const amount = payload?.amount ?? 99900
      const currency = payload?.currency ?? 'INR'

      if (!orderId || !keyId) {
        setErrorMessage('Checkout is not configured yet. Please check back soon.')
        setCheckoutBusy(false)
        return
      }

      const Razorpay = await loadRazorpay()
      const checkout = new Razorpay({
        key: keyId,
        amount,
        currency,
        name: BRAND,
        description: '365-Day All-Access Subscription',
        order_id: orderId,
        prefill: {
          name: account.name ?? undefined,
          email: account.email ?? undefined,
        },
        handler: (paymentResponse) => {
          setStatusMessage('Payment received. Verifying and activating your Subscription…')
          void (async () => {
            try {
              const verifyRes = await fetch('/api/checkout/verify', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentResponse),
              })
              if (verifyRes.ok) {
                const verified = (await verifyRes.json()) as {
                  subscription?: SubscriptionRow | null
                }
                if (verified.subscription && isSubscriptionActive(verified.subscription)) {
                  setLoaded({ key: accountKey, sub: verified.subscription })
                  setStatusMessage(null)
                  setCheckoutBusy(false)
                  return
                }
              }
            } catch {
              // Fall back to webhook activation polling below.
            }
            await pollForActivation()
          })()
        },
        modal: {
          ondismiss: () => {
            setCheckoutBusy(false)
          },
        },
      })

      checkout.on?.('payment.failed', () => {
        setErrorMessage('Payment did not complete. No Entitlement was changed — you can try again.')
        setCheckoutBusy(false)
      })

      checkout.open()
    } catch {
      setErrorMessage(
        'Could not open Razorpay checkout right now. Please check your connection and try again.'
      )
      setCheckoutBusy(false)
    }
  }

  if (account.status === 'loading') {
    return (
      <div className={styles.ctaSection} data-testid="pricing-cta">
        <p className={styles.ctaSubtext}>Checking your Account…</p>
      </div>
    )
  }

  if (account.status === 'unavailable') {
    return (
      <div className={styles.ctaSection} data-testid="pricing-cta">
        <p className={styles.ctaSubtext}>
          Accounts and Subscriptions are not set up on this build. Every Free Section remains open to explore.
        </p>
        <div className={styles.ctaActionRow}>
          <Link href="/#syllabus" className={styles.linkButton}>
            Explore the Syllabus Map
          </Link>
        </div>
      </div>
    )
  }

  if (account.status === 'signed-out') {
    return (
      <div className={styles.ctaSection} data-testid="pricing-cta">
        <p className={styles.ctaPrompt}>Sign in with Google to subscribe</p>
        <p className={styles.ctaSubtext}>
          Your 365-day Subscription and synced Progress stay tied to your Account across all your devices.
        </p>
        <GoogleSignInButton />
      </div>
    )
  }

  if (subState === 'loading') {
    return (
      <div className={styles.ctaSection} data-testid="pricing-cta">
        <p className={styles.ctaSubtext}>Checking your Subscription status…</p>
      </div>
    )
  }

  if (activeSub && isSubscriptionActive(activeSub)) {
    return (
      <div className={styles.ctaSection} data-testid="pricing-cta">
        <div className={styles.activeBox}>
          <p className={styles.activeTitle}>Active Subscription</p>
          <p className={styles.activeMeta}>
            Your 365-day All-Access Subscription is active through{' '}
            <strong>{formatExpiryDate(activeSub.expires_at)}</strong>. Every Paid Section across Class 11 and Class 12
            is open on your Account.
          </p>
          <div className={styles.ctaActionRow}>
            <Link href="/account" className={styles.linkButton}>
              View on your Account page
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.ctaSection} data-testid="pricing-cta">
      {statusMessage && (
        <p role="status" aria-live="polite" className={styles.statusNotice}>
          {statusMessage}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className={styles.errorNotice}>
          {errorMessage}
        </p>
      )}
      <div className={styles.ctaActionRow}>
        <Button variant="primary" onClick={handleSubscribe} disabled={checkoutBusy}>
          {checkoutBusy ? 'Opening checkout…' : 'Unlock All Sections for ₹999/year'}
        </Button>
      </div>
      <p className={styles.ctaSubtext}>
        One-time payment via Razorpay (UPI QR, debit/credit cards, and international cards). If you are under 18,
        please ask a parent or guardian to complete checkout.
      </p>
    </div>
  )
}
