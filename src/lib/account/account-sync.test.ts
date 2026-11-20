import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  deleteAccount,
  getAccountStateForTesting,
  resetAccountForTesting,
  resetProgress,
  signInWithEmailForTesting,
  signOut,
  startAccount,
  waitForSync,
} from './account'
import { setSupabaseClientForTesting } from './client'
import { clearProgress, readProgress, recordAnswered, recordOpened } from '../progress/browser-store'
import { EMPTY_PROGRESS } from '../progress/rules'

const LOCAL_SUPABASE_URL = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321'
const LOCAL_SUPABASE_ANON_KEY =
  process.env.LOCAL_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const LOCAL_SUPABASE_SERVICE_ROLE_KEY =
  process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: LOCAL_SUPABASE_ANON_KEY },
    })
    return res.status === 200 || res.status === 401
  } catch {
    return false
  }
}

const supabaseReady = await isSupabaseAvailable()

const adminClient = supabaseReady
  ? createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

const createdUserIds = new Set<string>()

function makeTestUser(tag: string) {
  const id = Math.random().toString(36).slice(2, 9)
  return {
    email: `learner-${tag}-${Date.now()}-${id}@ncertchem.test`,
    password: `P@ss-${id}-${Math.random().toString(36).slice(2, 8)}!`,
    name: `Learner ${tag.toUpperCase()}`,
  }
}

describe.runIf(supabaseReady)('local Supabase account sync and lifecycle', () => {
  let localStorageStore: Map<string, string>
  let testClient: SupabaseClient

  beforeEach(() => {
    localStorageStore = new Map<string, string>()

    const customStorage = {
      getItem: (key: string) => localStorageStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        localStorageStore.set(key, value)
      },
      removeItem: (key: string) => {
        localStorageStore.delete(key)
      },
    }

    vi.stubGlobal('window', {
      localStorage: customStorage,
      dispatchEvent: () => true,
    })

    testClient = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: customStorage,
      },
    })

    setSupabaseClientForTesting(testClient)
    resetAccountForTesting()
    startAccount()
  })

  afterEach(async () => {
    resetAccountForTesting()
    setSupabaseClientForTesting(undefined)
    vi.unstubAllGlobals()
  })

  afterAll(async () => {
    if (adminClient) {
      for (const id of createdUserIds) {
        try {
          await adminClient.auth.admin.deleteUser(id)
        } catch {
          // ignore cleanup failures
        }
      }
      createdUserIds.clear()
    }
  })

  describe('combining on sign-in', () => {
    it('uploads local browser progress to an empty account on first sign-in', async () => {
      const user = makeTestUser('empty')

      // Visitor makes progress while signed out
      recordAnswered('1-8-mole-concept:1', 1_700_000_000_000)
      recordOpened('1-8-mole-concept', 1_700_000_000_000)

      const localBefore = readProgress()
      expect(localBefore.answered).toEqual({ '1-8-mole-concept:1': 1_700_000_000_000 })
      expect(localBefore.lastOpened).toEqual({ slug: '1-8-mole-concept', at: 1_700_000_000_000 })

      // Sign in
      const res = await signInWithEmailForTesting(user.email, user.password, user.name)
      expect(res.ok).toBe(true)

      const state = getAccountStateForTesting()
      expect(state.status).toBe('signed-in')
      expect(state.email).toBe(user.email)

      // Get user id from session to track for cleanup
      const { data: sessionData } = await testClient.auth.getSession()
      if (sessionData.session?.user.id) createdUserIds.add(sessionData.session.user.id)

      // Browser progress is retained
      const localAfter = readProgress()
      expect(localAfter.answered).toEqual({ '1-8-mole-concept:1': 1_700_000_000_000 })
      expect(localAfter.lastOpened).toEqual({ slug: '1-8-mole-concept', at: 1_700_000_000_000 })

      // Remote Supabase database now has the uploaded progress
      const { data: remoteChecks } = await testClient.from('answered_checks').select('*')
      expect(remoteChecks).toHaveLength(1)
      expect(remoteChecks![0]).toMatchObject({
        section_slug: '1-8-mole-concept',
        check_number: '1',
      })

      const { data: remoteOpened } = await testClient.from('last_opened').select('*').single()
      expect(remoteOpened).toMatchObject({
        section_slug: '1-8-mole-concept',
      })
    })

    it('combines pre-existing account progress with local progress without losing either', async () => {
      const user = makeTestUser('combine')

      // Create user directly and seed prior account progress
      const signUpRes = await testClient.auth.signUp({
        email: user.email,
        password: user.password,
        options: { data: { full_name: user.name, name: user.name } },
      })
      const userId = signUpRes.data.user!.id
      createdUserIds.add(userId)

      // Pre-seed remote progress from "another device": Check 2 and Unit 2 last opened
      await testClient.from('answered_checks').insert({
        account_id: userId,
        section_slug: '1-8-mole-concept',
        check_number: '2',
        answered_at: new Date(2_000_000_000_000).toISOString(),
      })
      await testClient.from('last_opened').insert({
        account_id: userId,
        section_slug: '2-1-subatomic-particles',
        opened_at: new Date(2_000_000_000_000).toISOString(),
      })

      // Sign out so this browser is signed out and clean
      await testClient.auth.signOut({ scope: 'local' })
      resetAccountForTesting()
      startAccount()
      clearProgress()

      // Visitor works locally while signed out: answers Check 1 and opens 1-8-mole-concept earlier
      recordAnswered('1-8-mole-concept:1', 1_500_000_000_000)
      recordOpened('1-8-mole-concept', 1_500_000_000_000)

      // Visitor signs in to the existing account
      const loginRes = await signInWithEmailForTesting(user.email, user.password, user.name)
      expect(loginRes.ok).toBe(true)

      // The browser's progress is now the combination of both sources
      const combined = readProgress()
      expect(combined.answered).toEqual({
        '1-8-mole-concept:1': 1_500_000_000_000,
        '1-8-mole-concept:2': 2_000_000_000_000,
      })
      // Newer last-opened wins (2_000_000_000_000 > 1_500_000_000_000)
      expect(combined.lastOpened?.slug).toBe('2-1-subatomic-particles')

      // Supabase has also received the missing Check 1
      const { data: remoteChecks } = await testClient
        .from('answered_checks')
        .select('section_slug, check_number')
        .order('check_number')
      expect(remoteChecks).toEqual([
        { section_slug: '1-8-mole-concept', check_number: '1' },
        { section_slug: '1-8-mole-concept', check_number: '2' },
      ])
    })

    it('immediately sends newly answered checks and opened sections while signed in', async () => {
      const user = makeTestUser('live-sync')
      const login = await signInWithEmailForTesting(user.email, user.password, user.name)
      expect(login.ok).toBe(true)

      const { data: s } = await testClient.auth.getSession()
      if (s.session?.user.id) createdUserIds.add(s.session.user.id)

      recordAnswered('1-8-mole-concept:1')
      await waitForSync()

      const { data: checks } = await testClient.from('answered_checks').select('*')
      expect(checks).toHaveLength(1)
      expect(checks![0].check_number).toBe('1')

      recordOpened('1-8-mole-concept')
      await waitForSync()

      const { data: opened } = await testClient.from('last_opened').select('*').single()
      expect(opened.section_slug).toBe('1-8-mole-concept')
    })
  })

  describe('second account isolation', () => {
    it('ensures each account sees only its own progress and cannot overwrite another', async () => {
      const userA = makeTestUser('user-a')
      const userB = makeTestUser('user-b')

      // ── Step 1: User A signs in, answers a check, and opens a section ──
      const loginA = await signInWithEmailForTesting(userA.email, userA.password, userA.name)
      expect(loginA.ok).toBe(true)

      const { data: sA } = await testClient.auth.getSession()
      const userAId = sA.session!.user.id
      createdUserIds.add(userAId)

      recordAnswered('1-8-mole-concept:1', 1_000_000)
      recordOpened('1-8-mole-concept', 1_000_000)
      await waitForSync()

      // User A signs out
      await signOut()
      expect(readProgress()).toEqual(EMPTY_PROGRESS)
      expect(getAccountStateForTesting().status).toBe('signed-out')

      // ── Step 2: User B signs in on the same browser ──
      const loginB = await signInWithEmailForTesting(userB.email, userB.password, userB.name)
      expect(loginB.ok).toBe(true)

      const { data: sB } = await testClient.auth.getSession()
      const userBId = sB.session!.user.id
      createdUserIds.add(userBId)

      // User B must start completely empty: none of User A's data leaks
      expect(readProgress()).toEqual(EMPTY_PROGRESS)

      // User B queries Supabase directly: sees 0 rows
      const { data: bChecks } = await testClient.from('answered_checks').select('*')
      expect(bChecks).toEqual([])

      // User B answers their own check
      recordAnswered('2-1-subatomic-particles:1', 2_000_000)
      recordOpened('2-1-subatomic-particles', 2_000_000)
      await waitForSync()

      expect(readProgress().answered).toEqual({ '2-1-subatomic-particles:1': 2_000_000 })
      expect(readProgress().lastOpened?.slug).toBe('2-1-subatomic-particles')

      // User B signs out
      await signOut()
      expect(readProgress()).toEqual(EMPTY_PROGRESS)

      // ── Step 3: User A signs back in ──
      const loginA2 = await signInWithEmailForTesting(userA.email, userA.password, userA.name)
      expect(loginA2.ok).toBe(true)

      // User A's progress is restored, and contains NONE of User B's checks
      const restoredA = readProgress()
      expect(restoredA.answered).toEqual({ '1-8-mole-concept:1': 1_000_000 })
      expect(restoredA.lastOpened?.slug).toBe('1-8-mole-concept')

      // Verified directly against Supabase as User A
      const { data: aChecks } = await testClient.from('answered_checks').select('section_slug, check_number')
      expect(aChecks).toEqual([{ section_slug: '1-8-mole-concept', check_number: '1' }])
    })
  })

  describe('reset progress', () => {
    it('clears progress locally and removes all rows from Supabase', async () => {
      const user = makeTestUser('reset')

      const login = await signInWithEmailForTesting(user.email, user.password, user.name)
      expect(login.ok).toBe(true)

      const { data: s } = await testClient.auth.getSession()
      createdUserIds.add(s.session!.user.id)

      recordAnswered('1-8-mole-concept:1')
      recordAnswered('1-8-mole-concept:2')
      recordOpened('1-8-mole-concept')
      await waitForSync()

      expect(Object.keys(readProgress().answered)).toHaveLength(2)

      // Call resetProgress
      const resetRes = await resetProgress()
      expect(resetRes).toEqual({ ok: true })

      // Browser progress is cleared
      expect(readProgress()).toEqual(EMPTY_PROGRESS)

      // Supabase progress is deleted
      const { data: checks } = await testClient.from('answered_checks').select('*')
      expect(checks).toEqual([])

      const { data: opened } = await testClient.from('last_opened').select('*')
      expect(opened).toEqual([])

      // Signing out and signing back in stays empty (not resurrected)
      await signOut()
      const login2 = await signInWithEmailForTesting(user.email, user.password, user.name)
      expect(login2.ok).toBe(true)
      expect(readProgress()).toEqual(EMPTY_PROGRESS)
    })
  })

  describe('account deletion', () => {
    it('permanently deletes user, cascades data deletion, and signs out', async () => {
      const user = makeTestUser('delete')

      const login = await signInWithEmailForTesting(user.email, user.password, user.name)
      expect(login.ok).toBe(true)

      const { data: s } = await testClient.auth.getSession()
      const userId = s.session!.user.id

      recordAnswered('1-8-mole-concept:1')
      recordOpened('1-8-mole-concept')
      await waitForSync()

      // Confirm row was created in Supabase
      const { data: beforeChecks } = await testClient.from('answered_checks').select('*')
      expect(beforeChecks).toHaveLength(1)

      // Call deleteAccount
      const delRes = await deleteAccount()
      expect(delRes).toEqual({ ok: true })

      // Local state is signed out and progress is cleared
      expect(getAccountStateForTesting().status).toBe('signed-out')
      expect(readProgress()).toEqual(EMPTY_PROGRESS)

      // Verify with admin client that the user and rows are permanently gone
      if (adminClient) {
        const { data: adminUser } = await adminClient.auth.admin.getUserById(userId)
        expect(adminUser.user).toBeNull()

        const { data: leftChecks } = await adminClient
          .from('answered_checks')
          .select('*')
          .eq('account_id', userId)
        expect(leftChecks).toEqual([])

        const { data: leftOpened } = await adminClient
          .from('last_opened')
          .select('*')
          .eq('account_id', userId)
        expect(leftOpened).toEqual([])
      }

      // Trying to sign in again with the deleted credentials fails
      const reLogin = await testClient.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      })
      expect(reLogin.error).not.toBeNull()
      expect(reLogin.error?.message).toMatch(/Invalid login credentials/i)
    })
  })
})
