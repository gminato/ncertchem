'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { GoogleSignInButton } from './GoogleSignInButton'
import styles from './SignInOptions.module.css'

/** User agents of apps that open pages in their own browser, where Google sign-in is blocked. */
const IN_APP_BROWSER = /Instagram|FBAN|FBAV|Line\/|Snapchat|; wv\)/

// The user agent never changes while the page is open, so there is nothing to subscribe to.
const noSubscription = () => () => {}

/**
 * The body of every sign-in offer: the header panel and the nudge on a Section page. The first
 * render never depends on the user agent (pages are pre-built), so the in-app notice appears
 * after hydration.
 */
export interface SignInOptionsProps {
  /** Shows the opening line. The nudge says the same in its own words, so it leaves it out. */
  showLead?: boolean
}

export function SignInOptions({ showLead = true }: SignInOptionsProps) {
  const inAppBrowser = useSyncExternalStore(
    noSubscription,
    () => IN_APP_BROWSER.test(navigator.userAgent),
    () => false
  )

  return (
    <div className={styles.options} data-testid="sign-in-options">
      {showLead && <p className={styles.lead}>Sign in to keep your Progress on every device.</p>}
      {inAppBrowser && (
        <p className={styles.notice} role="note">
          Google sign-in does not work inside this app. Open this page in Chrome to sign in.
        </p>
      )}
      <GoogleSignInButton />
      <p className={styles.minor}>Under 18? Ask a parent or guardian first.</p>
      <p className={styles.links}>
        <Link href="/privacy" prefetch={false}>Privacy</Link>
        {' · '}
        <Link href="/terms" prefetch={false}>Terms</Link>
      </p>
    </div>
  )
}
