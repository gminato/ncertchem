'use client'

import { useSyncExternalStore } from 'react'
import { useAccount } from '@/lib/account/account'
import { sectionProgress } from '@/lib/progress/rules'
import { useProgress } from '@/lib/progress/useProgress'
import { SignInOptions } from './SignInOptions'
import styles from './SignInNudge.module.css'

const DISMISSED_KEY = 'nudge:sign-in:dismissed'
const CHANGE_EVENT = 'sign-in-nudge-change'

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

function dismiss(): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // Storage is blocked: the nudge hides for now and may return on another visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export interface SignInNudgeProps {
  slug: string
  checkNumbers: readonly string[]
}

/**
 * Offered once, at the end of a Section, to a signed-out Learner who has just completed it.
 * Dismissed, it never returns in this browser. Like all Progress, it renders nothing until the
 * page has loaded, so the first render is empty and the pager below does not move on load.
 */
export function SignInNudge({ slug, checkNumbers }: SignInNudgeProps) {
  const account = useAccount()
  const progress = useProgress()
  // On the server, and during hydration, the nudge counts as dismissed, so nothing renders.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true)
  const { complete } = sectionProgress(progress, { slug, checkNumbers })

  if (account.status !== 'signed-out' || !complete || dismissed) return null

  return (
    <aside className={styles.nudge} aria-labelledby="sign-in-nudge-title" data-testid="sign-in-nudge">
      <h2 id="sign-in-nudge-title" className={styles.title}>
        Keep this Progress
      </h2>
      <p className={styles.text}>
        You completed this Section. Sign in to keep your Progress if you change devices or clear this
        browser.
      </p>
      <SignInOptions showLead={false} />
      <button type="button" className={styles.dismiss} onClick={dismiss}>
        Not now
      </button>
    </aside>
  )
}
