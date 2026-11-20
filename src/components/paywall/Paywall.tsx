'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount, type AccountStatus } from '@/lib/account/account'
import { accountsConfigured } from '@/lib/account/client'
import { GoogleSignInButton } from '@/components/account/GoogleSignInButton'
import styles from './Paywall.module.css'

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
const ACTIVATION_POLL_DELAYS_MS = [1500, 3500, 6000, 10000]

interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayPaymentFailedResponse {
  error?: {
    description?: string
    reason?: string
  }
}

interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  prefill?: {
    name?: string
    email?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
  handler: (response: RazorpayPaymentSuccessResponse) => void
}

interface RazorpayInstance {
  open(): void
  on?(event: 'payment.failed', callback: (response: RazorpayPaymentFailedResponse) => void): void
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance
}

function getWindowRazorpay(): RazorpayConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay
}

interface CreateOrderResponse {
  key?: string
  keyId?: string
  key_id?: string
  orderId?: string
  order_id?: string
  id?: string
  amount?: number
  currency?: string
  error?: string
  message?: string
}

let razorpayLoading: Promise<RazorpayConstructor> | null = null

function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Checkout is only available in a browser.'))
  }
  const loaded = getWindowRazorpay()
  if (loaded) return Promise.resolve(loaded)
  if (razorpayLoading) return razorpayLoading

  razorpayLoading = new Promise<RazorpayConstructor>((resolve, reject) => {
    const ready = () => {
      const ctor = getWindowRazorpay()
      if (ctor) resolve(ctor)
      else reject(new Error('Razorpay Checkout did not load.'))
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_SRC}"]`
    )
    if (existing) {
      existing.addEventListener('load', ready, { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Could not load Razorpay Checkout.')),
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_SRC
    script.async = true
    script.onload = ready
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout.'))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    razorpayLoading = null
    throw error
  })

  return razorpayLoading
}

function readAccentColor(): string {
  if (typeof window === 'undefined') return '#2563EB'
  const token = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  return token || '#2563EB'
}

export interface PaywallProps {
  sectionTitle?: string
}

type CheckoutPhase = 'idle' | 'creating' | 'open' | 'activating' | 'awaiting-refresh' | 'error'

/**
 * Paywall rendered directly below the Hook on a Paid Section when the visitor does not have
 * an active Subscription. Signed-out visitors are prompted to sign in with Google; signed-in
 * Learners can open the Razorpay Checkout modal (supporting UPI QR, cards, and international
 * payments) to activate a 365-day fixed-term Subscription.
 */
export function Paywall({ sectionTitle }: PaywallProps) {
  const account = useAccount()
  const router = useRouter()
  const [phase, setPhase] = useState<CheckoutPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const prevStatusRef = useRef<AccountStatus>(account.status)
  const pollTimersRef = useRef<number[]>([])

  const clearPollTimers = () => {
    for (const timer of pollTimersRef.current) {
      window.clearTimeout(timer)
    }
    pollTimersRef.current = []
  }

  useEffect(() => {
    return () => {
      clearPollTimers()
    }
  }, [])

  // If a Learner signs in right from this Paywall, refresh the Server Component once so an
  // Account that already holds an active Subscription unlocks the Section immediately.
  useEffect(() => {
    const previous = prevStatusRef.current
    prevStatusRef.current = account.status
    if (previous === 'signed-out' && account.status === 'signed-in') {
      router.refresh()
    }
  }, [account.status, router])

  const startActivationRefresh = () => {
    clearPollTimers()
    setPhase('activating')
    setErrorMessage(null)
    router.refresh()

    ACTIVATION_POLL_DELAYS_MS.forEach((delay, index) => {
      const timer = window.setTimeout(() => {
        router.refresh()
        if (index === ACTIVATION_POLL_DELAYS_MS.length - 1) {
          setPhase('awaiting-refresh')
        }
      }, delay)
      pollTimersRef.current.push(timer)
    })
  }

  const handleCheckout = async () => {
    if (phase === 'creating' || phase === 'open' || phase === 'activating') return

    setPhase('creating')
    setErrorMessage(null)

    try {
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      let payload: CreateOrderResponse = {}
      try {
        payload = (await response.json()) as CreateOrderResponse
      } catch {
        payload = {}
      }

      if (!response.ok) {
        if (response.status === 503) {
          setErrorMessage(
            payload.error ??
              'Online checkout is not configured yet. Please check back soon or view the Subscription details on our Pricing page.'
          )
        } else if (response.status === 401) {
          setErrorMessage('Please sign in again to start your Subscription.')
        } else {
          setErrorMessage(
            payload.error ?? payload.message ?? 'Could not start checkout. Please try again.'
          )
        }
        setPhase('error')
        return
      }

      const key = payload.key ?? payload.keyId ?? payload.key_id
      const orderId = payload.order_id ?? payload.orderId ?? payload.id
      const amount = payload.amount
      const currency = payload.currency ?? 'INR'

      if (!key || !orderId || typeof amount !== 'number') {
        setErrorMessage('Checkout received an incomplete order response. Please try again.')
        setPhase('error')
        return
      }

      const Razorpay = await loadRazorpay()
      let handledPayment = false

      const checkout = new Razorpay({
        key,
        amount,
        currency,
        order_id: orderId,
        name: 'NCERTCHEM',
        description: '365-Day All-Access Subscription',
        prefill: {
          name: account.name ?? undefined,
          email: account.email ?? undefined,
        },
        theme: {
          color: readAccentColor(),
        },
        modal: {
          ondismiss: () => {
            if (!handledPayment) {
              setPhase('idle')
            }
          },
        },
        handler: (paymentResponse) => {
          handledPayment = true
          setPhase('activating')
          setErrorMessage(null)
          void (async () => {
            try {
              const verifyRes = await fetch('/api/checkout/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentResponse),
              })
              if (verifyRes.ok) {
                router.refresh()
                return
              }
            } catch {
              // Fall back to webhook activation polling below.
            }
            startActivationRefresh()
          })()
        },
      })

      if (typeof checkout.on === 'function') {
        checkout.on('payment.failed', (failure) => {
          setErrorMessage(
            failure.error?.description ?? 'Payment did not complete. No charge was finalised; please try again.'
          )
          setPhase('error')
        })
      }

      setPhase('open')
      checkout.open()
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Could not reach checkout right now. Please try again.'
      setErrorMessage(message)
      setPhase('error')
    }
  }

  const isSignedIn = account.status === 'signed-in'
  const canSignIn = accountsConfigured() && account.status !== 'unavailable'
  const isBusy = phase === 'creating' || phase === 'open' || phase === 'activating'

  return (
    <section
      className={styles.paywall}
      aria-labelledby="paywall-heading"
      data-testid="paywall"
    >
      <div className={styles.eyebrowRow}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Paid Section</span>
      </div>

      <h2 id="paywall-heading" className={styles.heading}>
        This is a Paid Section
      </h2>

      <p className={styles.lead}>
        {sectionTitle
          ? `Unlock the full Prose, Animations, Simulations, and Checks for “${sectionTitle}” and every other Paid Section across Class 11 and Class 12 with a 365-day Subscription.`
          : 'Unlock the full Prose, Animations, Simulations, and Checks for every Paid Section across Class 11 and Class 12 with a 365-day Subscription.'}
      </p>

      {isSignedIn ? (
        <>
          {account.email && (
            <p className={styles.accountLine}>
              Signed in as <span className={styles.accountEmail}>{account.email}</span>
            </p>
          )}

          <div className={styles.ctaRow}>
            <button
              type="button"
              className={styles.ctaButton}
              onClick={handleCheckout}
              disabled={isBusy}
              data-testid="paywall-subscribe-button"
            >
              {phase === 'creating'
                ? 'Preparing checkout…'
                : phase === 'open'
                  ? 'Checkout open…'
                  : phase === 'activating'
                    ? 'Activating Subscription…'
                    : 'Unlock All Sections for ₹999/year'}
            </button>
            <span className={styles.termNote}>
              365-day fixed-term Subscription · One-time payment, non-recurring
            </span>
          </div>

          {phase === 'activating' && (
            <p
              role="status"
              aria-live="polite"
              className={`${styles.statusMessage} ${styles.statusActivating}`}
            >
              Payment received. Activating your Subscription and unlocking this Section…
            </p>
          )}

          {phase === 'awaiting-refresh' && (
            <p
              role="status"
              aria-live="polite"
              className={`${styles.statusMessage} ${styles.statusActivating}`}
            >
              Payment confirmation is taking a moment to sync.
              <button
                type="button"
                className={styles.refreshButton}
                onClick={() => router.refresh()}
              >
                Refresh Section
              </button>
            </p>
          )}

          {phase === 'error' && errorMessage && (
            <p
              role="alert"
              className={`${styles.statusMessage} ${styles.statusError}`}
              data-testid="paywall-error"
            >
              {errorMessage}
            </p>
          )}

          <p className={styles.consentBox}>
            <strong>For Learners under 18:</strong> Please ask a parent or guardian to review our{' '}
            <Link href="/terms" className={styles.inlineLink}>
              Terms
            </Link>{' '}
            and complete payment—for example, by scanning the UPI QR code shown in checkout.
          </p>

          <div className={styles.links}>
            <Link href="/pricing" className={styles.link}>
              See what a Subscription includes
            </Link>
            <Link href="/terms" className={styles.link}>
              Terms
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className={styles.prompt}>Sign in with Google to subscribe</p>

          {canSignIn ? (
            <div className={styles.signInBox}>
              <GoogleSignInButton />
            </div>
          ) : (
            <p className={styles.unavailableNote}>
              Accounts are not configured in this environment, so sign-in and Subscriptions are
              currently unavailable here.
            </p>
          )}

          <div className={styles.links}>
            <Link href="/pricing" className={styles.link}>
              See what a Subscription includes
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
