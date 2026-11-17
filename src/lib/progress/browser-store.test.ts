import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PROGRESS_STORAGE_KEY,
  clearProgress,
  parseProgress,
  readProgress,
  recordAnswered,
  recordOpened,
  writeProgress,
} from './browser-store'
import { EMPTY_PROGRESS } from './rules'

/** Stubs `window` with a working localStorage, and returns the map behind it. */
function stubBrowser(): { store: Map<string, string>; events: string[] } {
  const store = new Map<string, string>()
  const events: string[] = []
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    dispatchEvent: (event: Event) => {
      events.push(event.type)
      return true
    },
  })
  return { store, events }
}

function stubBlockedBrowser(): void {
  const blocked = () => {
    throw new Error('blocked')
  }
  vi.stubGlobal('window', {
    localStorage: { getItem: blocked, setItem: blocked, removeItem: blocked },
    dispatchEvent: () => true,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseProgress', () => {
  it('gives empty Progress for nothing, for text that is not JSON and for JSON of the wrong shape', () => {
    expect(parseProgress(null)).toEqual(EMPTY_PROGRESS)
    expect(parseProgress('')).toEqual(EMPTY_PROGRESS)
    expect(parseProgress('{not json')).toEqual(EMPTY_PROGRESS)
    expect(parseProgress('null')).toEqual(EMPTY_PROGRESS)
    expect(parseProgress('"done"')).toEqual(EMPTY_PROGRESS)
    expect(parseProgress('[1, 2]')).toEqual(EMPTY_PROGRESS)
  })

  it('reads back answered Checks and the last Section opened', () => {
    const raw = JSON.stringify({ answered: { 'a:1': 100 }, lastOpened: { slug: 'a', at: 200 } })
    expect(parseProgress(raw)).toEqual({ answered: { 'a:1': 100 }, lastOpened: { slug: 'a', at: 200 } })
  })

  it('drops entries whose time is not a number, and keeps the rest', () => {
    const raw = JSON.stringify({ answered: { 'a:1': 100, 'a:2': 'yes', 'a:3': null }, lastOpened: null })
    expect(parseProgress(raw).answered).toEqual({ 'a:1': 100 })
  })

  it('drops a malformed last-opened Section', () => {
    expect(parseProgress(JSON.stringify({ answered: {}, lastOpened: { slug: 'a' } })).lastOpened).toBeNull()
    expect(parseProgress(JSON.stringify({ answered: {}, lastOpened: 'a' })).lastOpened).toBeNull()
    expect(parseProgress(JSON.stringify({ answered: [], lastOpened: { slug: '', at: 1 } }))).toEqual(
      EMPTY_PROGRESS
    )
  })
})

describe('the browser store without a browser', () => {
  it('reads empty Progress and does not throw on any write', () => {
    expect(readProgress()).toEqual(EMPTY_PROGRESS)
    expect(() => recordAnswered('a:1')).not.toThrow()
    expect(() => recordOpened('a')).not.toThrow()
    expect(() => clearProgress()).not.toThrow()
  })
})

describe('the browser store with a working localStorage', () => {
  it('records a correct answer and reads it back', () => {
    stubBrowser()
    expect(readProgress().answered).toEqual({})
    recordAnswered('1-8-mole-concept:1', 100)
    expect(readProgress().answered).toEqual({ '1-8-mole-concept:1': 100 })
  })

  it('keeps one entry in localStorage, under the Progress key', () => {
    const { store } = stubBrowser()
    recordAnswered('a:1', 100)
    recordAnswered('a:2', 200)
    recordOpened('a', 300)
    expect([...store.keys()]).toEqual([PROGRESS_STORAGE_KEY])
    expect(JSON.parse(store.get(PROGRESS_STORAGE_KEY)!)).toEqual({
      answered: { 'a:1': 100, 'a:2': 200 },
      lastOpened: { slug: 'a', at: 300 },
    })
  })

  it('keeps the first time when a Check is answered again, and writes nothing', () => {
    const { events } = stubBrowser()
    recordAnswered('a:1', 100)
    const eventsAfterFirst = events.length
    recordAnswered('a:1', 999)
    expect(readProgress().answered['a:1']).toBe(100)
    expect(events.length).toBe(eventsAfterFirst)
  })

  it('returns the same object while nothing has changed', () => {
    stubBrowser()
    recordAnswered('a:1', 100)
    expect(readProgress()).toBe(readProgress())
  })

  it('keeps an answer that another tab stored in the meantime', () => {
    const { store } = stubBrowser()
    recordAnswered('a:1', 100)
    // Another tab writes straight to localStorage.
    store.set(PROGRESS_STORAGE_KEY, JSON.stringify({ answered: { 'a:1': 100, 'b:1': 150 }, lastOpened: null }))
    recordAnswered('a:2', 200)
    expect(readProgress().answered).toEqual({ 'a:1': 100, 'b:1': 150, 'a:2': 200 })
  })

  it('announces every change', () => {
    const { events } = stubBrowser()
    recordAnswered('a:1', 100)
    recordOpened('a', 200)
    clearProgress()
    expect(events).toEqual(['progress-change', 'progress-change', 'progress-change'])
  })

  it('replaces stored Progress with writeProgress and removes it with clearProgress', () => {
    const { store } = stubBrowser()
    writeProgress({ answered: { 'a:1': 1 }, lastOpened: null })
    expect(readProgress().answered).toEqual({ 'a:1': 1 })
    clearProgress()
    expect(store.size).toBe(0)
    expect(readProgress()).toEqual(EMPTY_PROGRESS)
  })

  it('reads a damaged entry as empty Progress and can write over it', () => {
    const { store } = stubBrowser()
    store.set(PROGRESS_STORAGE_KEY, '{broken')
    expect(readProgress()).toEqual(EMPTY_PROGRESS)
    recordAnswered('a:1', 100)
    expect(readProgress().answered).toEqual({ 'a:1': 100 })
  })
})

describe('the browser store with a blocked localStorage', () => {
  it('reads empty Progress and does not throw on any write', () => {
    stubBlockedBrowser()
    expect(readProgress()).toEqual(EMPTY_PROGRESS)
    expect(() => recordAnswered('a:1')).not.toThrow()
    expect(() => recordOpened('a')).not.toThrow()
    expect(() => clearProgress()).not.toThrow()
  })
})
