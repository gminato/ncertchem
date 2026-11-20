'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/controls/Button'
import { deleteAccount, resetProgress, signOut, useAccount } from '@/lib/account/account'
import { getSupabase } from '@/lib/account/client'
import { isDeleteConfirmed } from '@/lib/account/confirm'
import {
  fetchLatestSubscription,
  isSubscriptionActive,
  type SubscriptionRow,
} from '@/lib/account/subscriptions'
import styles from '@/app/account/account.module.css'

const ERROR_MESSAGE = 'That did not work. Your Progress is unchanged. Try again.'

function formatSubscriptionDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

type SubscriptionView =
  | { status: 'loading' }
  | { status: 'ready'; subscription: SubscriptionRow | null }

/**
 * The Account page client content: displays the Learner's Account details,
 * or guides a signed-out visitor.
 */
export function AccountPage() {
  const account = useAccount()
  const accountKey = account.status === 'signed-in' ? (account.email ?? 'signed-in') : null
  const [signingOut, setSigningOut] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loadedSubscription, setLoadedSubscription] = useState<{
    key: string | null
    subscription: SubscriptionRow | null
  }>({ key: null, subscription: null })

  useEffect(() => {
    if (!accountKey) return

    let cancelled = false
    const client = getSupabase()
    const task = client ? fetchLatestSubscription(client) : Promise.resolve(null)

    task
      .then((subscription) => {
        if (cancelled) return
        setLoadedSubscription({ key: accountKey, subscription })
      })
      .catch(() => {
        if (cancelled) return
        setLoadedSubscription({ key: accountKey, subscription: null })
      })

    return () => {
      cancelled = true
    }
  }, [accountKey])

  const subscriptionView: SubscriptionView =
    accountKey !== null && loadedSubscription.key === accountKey
      ? { status: 'ready', subscription: loadedSubscription.subscription }
      : { status: 'loading' }

  const isBusy = signingOut || resetting || deleting

  if (account.status === 'loading') {
    return (
      <div className={styles.column}>
        <div className={styles.placeholder} aria-hidden="true" />
      </div>
    )
  }

  if (account.status === 'unavailable') {
    return (
      <div className={styles.column}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Account</p>
          <h1 className={styles.title}>Account</h1>
          <p className={styles.lede}>Accounts are not set up on this site.</p>
        </header>
        <div className={styles.ctaRow}>
          <Link href="/" className={`${styles.cta} ${styles.ctaPrimary}`}>
            Go to home
          </Link>
        </div>
      </div>
    )
  }

  if (account.status === 'signed-out') {
    return (
      <div className={styles.column}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Account</p>
          <h1 className={styles.title}>Your Account</h1>
          <p className={styles.lede}>
            Sign in to see your Account here. Your Progress stays in this browser until you do.
          </p>
        </header>
        <div className={styles.ctaRow}>
          <Link href="/#syllabus" className={`${styles.cta} ${styles.ctaSecondary}`}>
            Back to the Syllabus Map
          </Link>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    if (isBusy) return
    setErrorMessage(null)
    setSigningOut(true)
    try {
      await signOut()
    } catch {
      setErrorMessage(ERROR_MESSAGE)
    } finally {
      setSigningOut(false)
    }
  }

  const handleResetProgress = async () => {
    if (isBusy) return
    setErrorMessage(null)
    setResetting(true)
    try {
      const res = await resetProgress()
      if (!res.ok) {
        setErrorMessage(ERROR_MESSAGE)
      } else {
        setShowResetConfirm(false)
      }
    } catch {
      setErrorMessage(ERROR_MESSAGE)
    } finally {
      setResetting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (isBusy || !isDeleteConfirmed(deleteInput)) return
    setErrorMessage(null)
    setDeleting(true)
    try {
      const res = await deleteAccount()
      if (!res.ok) {
        setErrorMessage(ERROR_MESSAGE)
      }
    } catch {
      setErrorMessage(ERROR_MESSAGE)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={styles.column}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Account</p>
        <h1 className={styles.title}>Your Account</h1>
      </header>

      {errorMessage && (
        <p role="alert" className={styles.alert}>
          {errorMessage}
        </p>
      )}

      <section className={styles.card} aria-labelledby="account-details-heading">
        <h2 id="account-details-heading" className={styles.sectionHeading}>
          Details
        </h2>
        <dl className={styles.metaList}>
          <div className={styles.metaRow}>
            <dt className={styles.metaLabel}>Name</dt>
            <dd className={styles.metaValue}>{account.name ?? account.firstName ?? 'Learner'}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt className={styles.metaLabel}>Email</dt>
            <dd className={styles.metaValue}>{account.email ?? '—'}</dd>
          </div>
        </dl>
        <p className={styles.subtext}>The name comes from Google and cannot be edited.</p>
        <div className={styles.actionRow}>
          <Button variant="secondary" onClick={handleSignOut} disabled={isBusy}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </section>

      <section
        className={styles.card}
        aria-labelledby="subscription-heading"
        data-testid="subscription-card"
      >
        {subscriptionView.status === 'loading' ? (
          <>
            <h2 id="subscription-heading" className={styles.sectionHeading}>
              Subscription
            </h2>
            <p className={styles.bodyText}>Checking your Subscription status…</p>
          </>
        ) : subscriptionView.subscription && isSubscriptionActive(subscriptionView.subscription) ? (
          <>
            <div className={styles.subscriptionHeader}>
              <h2 id="subscription-heading" className={styles.sectionHeading}>
                Subscription
              </h2>
              <span className={`${styles.badge} ${styles.badgeActive}`}>Active Subscription</span>
            </div>
            <p className={styles.subscriptionStatus}>
              Valid until {formatSubscriptionDate(subscriptionView.subscription.expires_at)}
            </p>
            <p className={styles.bodyText}>365-day All-Access Pass (non-recurring)</p>
            <div className={styles.actionRow}>
              <Link href="/pricing" className={`${styles.cardCta} ${styles.cardCtaSecondary}`}>
                View Subscription details
              </Link>
            </div>
          </>
        ) : subscriptionView.subscription ? (
          <>
            <div className={styles.subscriptionHeader}>
              <h2 id="subscription-heading" className={styles.sectionHeading}>
                Subscription
              </h2>
              <span className={`${styles.badge} ${styles.badgeExpired}`}>Expired</span>
            </div>
            <p className={styles.subscriptionStatus}>
              Subscription expired on {formatSubscriptionDate(subscriptionView.subscription.expires_at)}
            </p>
            <p className={styles.bodyText}>
              Your Progress is preserved, and all Free Sections remain open. Renew whenever you are ready to unlock
              Paid Sections again.
            </p>
            <div className={styles.actionRow}>
              <Link href="/pricing" className={`${styles.cardCta} ${styles.cardCtaPrimary}`}>
                Renew Subscription
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className={styles.subscriptionHeader}>
              <h2 id="subscription-heading" className={styles.sectionHeading}>
                Subscription
              </h2>
              <span className={`${styles.badge} ${styles.badgeFree}`}>Free access</span>
            </div>
            <p className={styles.bodyText}>
              All Free Sections remain open without payment. Subscribe for 365 days of access to every Paid Section
              across Class 11 and Class 12.
            </p>
            <div className={styles.actionRow}>
              <Link href="/pricing" className={`${styles.cardCta} ${styles.cardCtaPrimary}`}>
                Unlock all Sections
              </Link>
            </div>
          </>
        )}
      </section>

      <section className={styles.card} aria-labelledby="reset-progress-heading">
        <h2 id="reset-progress-heading" className={styles.sectionHeading}>
          Reset Progress
        </h2>
        <p className={styles.bodyText}>
          This clears every answered Check and your last Section, here and in your Account. It cannot be undone.
        </p>
        {!showResetConfirm ? (
          <div className={styles.actionRow}>
            <Button
              variant="secondary"
              onClick={() => {
                setErrorMessage(null)
                setShowResetConfirm(true)
              }}
              disabled={isBusy}
            >
              Reset Progress
            </Button>
          </div>
        ) : (
          <div className={styles.confirmPanel} role="region" aria-label="Confirm Reset Progress">
            <p className={styles.confirmText}>Reset every answered Check and your last Section?</p>
            <div className={styles.buttonRow}>
              <Button
                variant="secondary"
                onClick={() => setShowResetConfirm(false)}
                disabled={isBusy}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleResetProgress}
                disabled={isBusy}
              >
                {resetting ? 'Resetting…' : 'Reset my Progress'}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.card} aria-labelledby="delete-account-heading">
        <h2 id="delete-account-heading" className={styles.sectionHeading}>
          Delete Account
        </h2>
        <p className={styles.bodyText}>
          This deletes your Account and all its Progress, immediately and permanently. Type DELETE to confirm.
        </p>
        <div className={styles.deleteForm}>
          <input
            type="text"
            className={styles.input}
            aria-label="Type DELETE to confirm"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            disabled={isBusy}
            autoComplete="off"
            spellCheck="false"
          />
          <div className={styles.actionRow}>
            <Button
              variant="primary"
              onClick={handleDeleteAccount}
              disabled={!isDeleteConfirmed(deleteInput) || isBusy}
            >
              {deleting ? 'Deleting…' : 'Delete my Account'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
