/**
 * Completion for a Check is kept in the Learner's own browser only. Every
 * access is wrapped in try/catch, because storage can be blocked or full, and
 * the Check must still work without it.
 */

const DONE_VALUE = 'done'
const CHANGE_EVENT = 'check-storage-change'

/** The localStorage key for one Check: `check:<section-slug>:<n>`. */
export function checkStorageKey(sectionSlug: string, n: number | string): string {
  return `check:${sectionSlug}:${n}`
}

/** True when the Learner has answered this Check correctly in this browser. */
export function readCheckDone(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === DONE_VALUE
  } catch {
    return false
  }
}

/** Records a correct answer. Silently does nothing when storage is unavailable. */
export function writeCheckDone(key: string): void {
  try {
    window.localStorage.setItem(key, DONE_VALUE)
  } catch {
    return
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Subscribes to completion changes, from this tab or from other tabs. */
export function subscribeCheckDone(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

/** A small, stable hash, used to name a Check that has no explicit `n`. */
export function hashText(text: string): string {
  let hash = 5381
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36)
}
