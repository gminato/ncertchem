'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/controls/Button'
import { deleteAccount, resetProgress, signOut, useAccount } from '@/lib/account/account'
import { isDeleteConfirmed } from '@/lib/account/confirm'
import styles from '@/app/account/account.module.css'

const ERROR_MESSAGE = 'That did not work. Your Progress is unchanged. Try again.'

/**
 * The Account page client content: displays the Learner's Account details,
 * or guides a signed-out visitor.
 */
export function AccountPage() {
  const account = useAccount()
  const [signingOut, setSigningOut] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
