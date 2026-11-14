import { describe, expect, it } from 'vitest'
import { analyseReading, expectedReading, sampleTruth, SAMPLE_RANGE } from './reading'

describe('analyseReading (certain digits plus one estimated digit)', () => {
  it('is empty until something is typed', () => {
    expect(analyseReading('', 47.36, 1).state).toBe('empty')
  })

  it('rejects text that is not a plain decimal', () => {
    expect(analyseReading('forty', 47.36, 1).state).toBe('invalid')
    expect(analyseReading('4.7.3', 47.36, 1).state).toBe('invalid')
  })

  it('flags a reading with no estimated digit', () => {
    const result = analyseReading('47', 47.36, 1)
    expect(result.state).toBe('no-estimate')
    expect(result.sigFigs).toBe(2)
  })

  it('accepts one estimated digit and counts three significant figures', () => {
    const result = analyseReading('47.3', 47.36, 1)
    expect(result.state).toBe('estimated')
    expect(result.certain).toBe('47')
    expect(result.estimated).toBe('3')
    expect(result.beyond).toBe('')
    expect(result.sigFigs).toBe(3)
    expect(result.withinHalfDivision).toBe(true)
  })

  it('flags digits the marks cannot support', () => {
    const result = analyseReading('47.36', 47.36, 1)
    expect(result.state).toBe('too-fine')
    expect(result.beyond).toBe('6')
    expect(result.sigFigs).toBe(4)
  })

  it('counts trailing zeros from the typed string, so 47.0 has three figures', () => {
    expect(analyseReading('47.0', 47.36, 1).sigFigs).toBe(3)
    expect(analyseReading('47', 47.36, 1).sigFigs).toBe(2)
  })

  it('is within half a division only when the difference is at most 0.5', () => {
    expect(analyseReading('47.8', 47.36, 1).withinHalfDivision).toBe(true)
    expect(analyseReading('47.9', 47.36, 1).withinHalfDivision).toBe(false)
    expect(analyseReading('46.8', 47.36, 1).withinHalfDivision).toBe(false)
  })
})

describe('expectedReading', () => {
  it('rounds to one estimated digit with the NCERT rounding rule', () => {
    expect(expectedReading(47.36)).toBe('47.4')
    expect(expectedReading(47.96)).toBe('48.0')
    expect(expectedReading(18.25)).toBe('18.2')
    expect(expectedReading(18.35)).toBe('18.4')
  })

  it('always gives three significant figures across the sample range', () => {
    for (let i = 0; i < 200; i++) {
      const truth = sampleTruth(i, SAMPLE_RANGE.min, SAMPLE_RANGE.max)
      expect(expectedReading(truth)).toMatch(/^\d{2}\.\d$/)
    }
  })
})

describe('sampleTruth', () => {
  it('is deterministic and stays inside the range', () => {
    expect(sampleTruth(3, 10, 90)).toBe(sampleTruth(3, 10, 90))
    for (let i = 0; i < 200; i++) {
      const value = sampleTruth(i, 10, 24)
      expect(value).toBeGreaterThanOrEqual(10)
      expect(value).toBeLessThanOrEqual(24)
    }
  })

  it('does not start at the edge of the range', () => {
    const first = sampleTruth(0, 10, 90)
    expect(first).toBeGreaterThan(30)
    expect(first).toBeLessThan(70)
  })
})
