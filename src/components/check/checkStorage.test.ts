import { describe, it, expect, afterEach, vi } from 'vitest'
import { checkStorageKey, hashText, readCheckDone, writeCheckDone } from './checkStorage'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('checkStorageKey', () => {
  it('formats check:<section-slug>:<n>', () => {
    expect(checkStorageKey('2-4-bohr-model', 1)).toBe('check:2-4-bohr-model:1')
    expect(checkStorageKey('2-4-bohr-model', 'dev-choice')).toBe('check:2-4-bohr-model:dev-choice')
  })
})

describe('hashText', () => {
  it('is stable for the same text and differs for different text', () => {
    expect(hashText('Which particle?')).toBe(hashText('Which particle?'))
    expect(hashText('Which particle?')).not.toBe(hashText('Which orbit?'))
  })
})

describe('completion storage without a browser', () => {
  it('reads as not done when window is unavailable, without throwing', () => {
    expect(readCheckDone('check:x:1')).toBe(false)
  })

  it('does not throw when writing without a browser', () => {
    expect(() => writeCheckDone('check:x:1')).not.toThrow()
  })
})

describe('completion storage with a working localStorage', () => {
  it('records and reads back a completed Check', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
      dispatchEvent: () => true,
    })
    expect(readCheckDone('check:x:1')).toBe(false)
    writeCheckDone('check:x:1')
    expect(readCheckDone('check:x:1')).toBe(true)
  })

  it('treats a throwing localStorage as not done', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('blocked')
        },
        setItem: () => {
          throw new Error('blocked')
        },
      },
      dispatchEvent: () => true,
    })
    expect(readCheckDone('check:x:1')).toBe(false)
    expect(() => writeCheckDone('check:x:1')).not.toThrow()
  })
})
