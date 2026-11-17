import { describe, expect, it } from 'vitest'
import { hashText } from './hashText'

describe('hashText', () => {
  it('is stable for the same text and differs for different text', () => {
    expect(hashText('Which particle?')).toBe(hashText('Which particle?'))
    expect(hashText('Which particle?')).not.toBe(hashText('Which orbit?'))
  })
})
