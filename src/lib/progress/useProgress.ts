'use client'

import { useSyncExternalStore } from 'react'
import { readProgress, subscribeProgress } from './browser-store'
import { EMPTY_PROGRESS, isAnswered, type CheckId, type Progress } from './rules'

const serverProgress = (): Progress => EMPTY_PROGRESS

/**
 * The Learner's Progress in this browser, kept up to date as Checks are answered here or in
 * another tab. Pages are pre-built without any Progress, so the first render is always empty and
 * the real Progress arrives just after the page loads.
 */
export function useProgress(): Progress {
  return useSyncExternalStore(subscribeProgress, readProgress, serverProgress)
}

/** True once the Learner has answered this Check correctly. */
export function useCheckAnswered(id: CheckId): boolean {
  return isAnswered(useProgress(), id)
}
