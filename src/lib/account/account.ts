'use client'

/**
 * The Learner's Account in this browser: whether they are signed in, and keeping their Progress
 * and their Account in step.
 *
 * - On sign-in, and on every page load while signed in, the browser's Progress and the
 *   Account's are combined (combining never removes anything), the browser keeps the result,
 *   and the Account is sent whatever it lacks.
 * - While signed in, each new answer and each opened Section is sent as it happens. If that
 *   fails (offline), the next page load sends it.
 * - On sign-out, the browser's Progress is cleared: it is safe in the Account, and the next
 *   person on this browser starts clean.
 */

import { useSyncExternalStore } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { accountsConfigured, getSupabase } from './client'
import { pendingRows, progressFromRows, type AnsweredRow, type LastOpenedRow, type PendingRows } from '../progress/account-rows'
import { answeredRow, isStorableSlug } from '../progress/account-rows'
import { clearProgress, onRecorded, readProgress, writeProgress } from '../progress/browser-store'
import { combine } from '../progress/rules'

export type AccountStatus = 'unavailable' | 'loading' | 'signed-out' | 'signed-in'

export interface AccountState {
  status: AccountStatus
  /** The Learner's first name, from Google. Null when signed out. */
  firstName: string | null
  /** The Learner's full name, from Google. */
  name: string | null
  email: string | null
}

const SIGNED_OUT: AccountState = { status: 'signed-out', firstName: null, name: null, email: null }
const LOADING: AccountState = { ...SIGNED_OUT, status: 'loading' }
const UNAVAILABLE: AccountState = { ...SIGNED_OUT, status: 'unavailable' }

let state: AccountState = LOADING
let userId: string | null = null
const listeners = new Set<() => void>()

function setState(next: AccountState): void {
  state = next
  for (const listener of listeners) listener()
}

function stateFromSession(session: Session): AccountState {
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>
  const text = (value: unknown) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null)
  const email = session.user.email ?? null
  const name = text(meta.full_name) ?? text(meta.name)
  const firstName = name?.split(/\s+/)[0] ?? email?.split('@')[0] ?? null
  return { status: 'signed-in', firstName, name, email }
}

// ── Keeping Progress and the Account in step ────────────────────────────────────────────────

let syncing: Promise<void> | null = null
let activeSend: Promise<boolean> | null = null

async function send(client: SupabaseClient, account: string, pending: PendingRows): Promise<boolean> {
  const task = (async () => {
    let ok = true
    for (let i = 0; i < pending.answered.length; i += 500) {
      const batch = pending.answered.slice(i, i + 500).map((row) => ({ ...row, account_id: account }))
      const { error } = await client
        .from('answered_checks')
        .upsert(batch, { onConflict: 'account_id,section_slug,check_number', ignoreDuplicates: true })
      if (error) ok = false
    }
    if (pending.lastOpened) {
      const { error } = await client
        .from('last_opened')
        .upsert({ ...pending.lastOpened, account_id: account }, { onConflict: 'account_id' })
      if (error) ok = false
    }
    return ok
  })()
  activeSend = task
  try {
    return await task
  } finally {
    if (activeSend === task) activeSend = null
  }
}

/** Combines the browser's Progress with the Account's, keeps the result here, and sends the Account what it lacks. */
function syncNow(client: SupabaseClient, account: string): Promise<void> {
  if (syncing) return syncing
  syncing = (async () => {
    const [answered, opened] = await Promise.all([
      client.from('answered_checks').select('section_slug, check_number, answered_at').limit(5000),
      client.from('last_opened').select('section_slug, opened_at').maybeSingle(),
    ])
    // If the Account cannot be read, the browser's copy stands, and the next page load tries again.
    if (answered.error || opened.error || userId !== account) return
    const fromAccount = progressFromRows(
      (answered.data ?? []) as AnsweredRow[],
      (opened.data ?? null) as LastOpenedRow | null
    )
    const combined = combine(readProgress(), fromAccount)
    writeProgress(combined)
    await send(client, account, pendingRows(fromAccount, combined))
  })()
    .catch(() => undefined)
    .finally(() => {
      syncing = null
    })
  return syncing
}

// ── Starting up ────────────────────────────────────────────────────────────────────────────

let started = false
let authSubscription: { unsubscribe: () => void } | null = null
let recordedUnsubscribe: (() => void) | null = null

/** Starts following the Learner's sign-in state. Safe to call more than once. */
export function startAccount(): void {
  if (started || typeof window === 'undefined') return
  started = true
  const client = getSupabase()
  if (!client) {
    setState(UNAVAILABLE)
    return
  }

  const { data } = client.auth.onAuthStateChange((event, session) => {
    // Supabase asks that no other Supabase call is awaited inside this callback, so the work
    // runs just after it.
    setTimeout(() => {
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const fresh = userId !== session.user.id
        userId = session.user.id
        setState(stateFromSession(session))
        if (fresh || event === 'SIGNED_IN') void syncNow(client, session.user.id)
      } else if (!session && (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT')) {
        userId = null
        setState(SIGNED_OUT)
      }
    }, 0)
  })
  authSubscription = data.subscription

  recordedUnsubscribe = onRecorded((recorded) => {
    const account = userId
    if (!account) return
    if (recorded.kind === 'answered') {
      const row = answeredRow(recorded.id, recorded.at)
      if (row) void send(client, account, { answered: [row], lastOpened: null })
    } else if (isStorableSlug(recorded.slug)) {
      const lastOpened = { section_slug: recorded.slug, opened_at: new Date(recorded.at).toISOString() }
      void send(client, account, { answered: [], lastOpened })
    }
  })
}

// ── Signing in and out ─────────────────────────────────────────────────────────────────────

/** Signs in with the ID token Google's button returned, and the raw nonce whose hash Google signed. */
export async function signInWithGoogle(idToken: string, nonce: string): Promise<{ ok: boolean }> {
  const client = getSupabase()
  if (!client) return { ok: false }
  const { error } = await client.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce })
  return { ok: !error }
}

/**
 * Signs out of this browser only. Anything not yet saved is sent first (for up to a few
 * seconds), then the browser's Progress is cleared.
 */
export async function signOut(): Promise<void> {
  const client = getSupabase()
  if (!client) return
  const account = userId
  if (account) {
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000))
    await Promise.race([syncNow(client, account), timeout])
  }
  await client.auth.signOut({ scope: 'local' })
  userId = null
  clearProgress()
  setState(SIGNED_OUT)
}

/**
 * Clears every answered Check and the last opened Section for the current Account,
 * in this browser and in Supabase.
 */
export async function resetProgress(): Promise<{ ok: boolean }> {
  const client = getSupabase()
  if (!client || !userId) return { ok: false }
  clearProgress()
  const [answered, opened] = await Promise.all([
    client.from('answered_checks').delete().neq('section_slug', ''),
    client.from('last_opened').delete().neq('section_slug', ''),
  ])
  if (answered.error || opened.error) return { ok: false }
  return { ok: true }
}

/**
 * Deletes the calling Account and all its Progress immediately and permanently.
 */
export async function deleteAccount(): Promise<{ ok: boolean }> {
  const client = getSupabase()
  if (!client || !userId) return { ok: false }
  const { error } = await client.rpc('delete_account')
  if (error) return { ok: false }
  clearProgress()
  await client.auth.signOut({ scope: 'local' })
  userId = null
  setState(SIGNED_OUT)
  return { ok: true }
}

// ── Reading the state in React ─────────────────────────────────────────────────────────────

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const serverState = (): AccountState => (accountsConfigured() ? LOADING : UNAVAILABLE)

/**
 * The Learner's Account state. Pages are pre-built, so the first render always says 'loading'
 * (or 'unavailable' when the site has no Accounts); the real state arrives just after.
 */
export function useAccount(): AccountState {
  return useSyncExternalStore(subscribe, () => state, serverState)
}

// ── Test helpers ───────────────────────────────────────────────────────────────────────────

/**
 * Test-only sign-in path using email and password against local Supabase.
 * In production/cloud, email auth is disabled in Supabase.
 */
export async function signInWithEmailForTesting(
  email: string,
  password: string,
  fullName?: string
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabase()
  if (!client) return { ok: false, error: 'No client' }
  let { error } = await client.auth.signInWithPassword({ email, password })
  if (error && (error.message.includes('Invalid login credentials') || error.message.includes('User not found'))) {
    const res = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, name: fullName } },
    })
    error = res.error
  }
  if (error) return { ok: false, error: error.message }
  await waitForSync()
  return { ok: true }
}

/** Waits for any in-flight sync or background send to complete. */
export async function waitForSync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  while (syncing || activeSend) {
    if (syncing) await syncing
    if (activeSend) await activeSend
  }
}

/** Resets all in-memory account tracking and listeners. Used between tests. */
export function resetAccountForTesting(): void {
  authSubscription?.unsubscribe()
  authSubscription = null
  recordedUnsubscribe?.()
  recordedUnsubscribe = null
  started = false
  userId = null
  state = LOADING
  syncing = null
  activeSend = null
}

/** Returns the current in-memory Account state synchronously, for testing. */
export function getAccountStateForTesting(): AccountState {
  return state
}
