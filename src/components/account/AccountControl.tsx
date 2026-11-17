'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut, useAccount } from '@/lib/account/account'
import { SignInOptions } from './SignInOptions'
import { usePopover } from './usePopover'
import styles from './AccountControl.module.css'

/**
 * The Account control in the site header. Signed out, it is a "Sign in" button that opens a
 * panel with Google's button. Signed in, it shows the Learner's first name and opens a menu with
 * Account and Sign out. While the state loads it holds the button's space, so the header never
 * moves. When the site has no Accounts it renders nothing.
 */
export function AccountControl() {
  const account = useAccount()

  if (account.status === 'unavailable') return null
  if (account.status === 'loading') return <span className={styles.placeholder} aria-hidden="true" />
  if (account.status === 'signed-out') return <SignInControl />
  return <AccountMenu firstName={account.firstName ?? 'Account'} email={account.email} />
}

function SignInControl() {
  const { open, toggle, close, buttonRef, popoverRef, buttonProps, popoverId } = usePopover()

  return (
    <div className={styles.anchor}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        onClick={toggle}
        data-testid="sign-in-button"
        {...buttonProps}
      >
        Sign in
      </button>
      {open && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label="Sign in"
          className={styles.popover}
          data-testid="sign-in-panel"
        >
          <h2 className={styles.heading}>Sign in</h2>
          <SignInOptions />
        </div>
      )}
    </div>
  )
}

function AccountMenu({ firstName, email }: { firstName: string; email: string | null }) {
  const { open, toggle, close, buttonRef, popoverRef, buttonProps, popoverId } = usePopover()
  const [signingOut, setSigningOut] = useState(false)

  const onSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
      close()
    }
  }

  return (
    <div className={styles.anchor}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        onClick={toggle}
        aria-haspopup="menu"
        data-testid="account-button"
        {...buttonProps}
      >
        <span className={styles.name}>{firstName}</span>
        <svg className={styles.caret} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>
      {open && (
        <div
          ref={popoverRef}
          id={popoverId}
          className={`${styles.popover} ${styles.menu}`}
          data-testid="account-menu"
        >
          {email && <p className={styles.email}>{email}</p>}
          <div role="menu" aria-label="Account">
            <Link role="menuitem" href="/account" className={styles.item} onClick={() => close()}>
              Account
            </Link>
            <button
              role="menuitem"
              type="button"
              className={styles.item}
              onClick={onSignOut}
              disabled={signingOut}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
