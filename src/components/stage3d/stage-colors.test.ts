import { describe, it, expect } from 'vitest'
import { STAGE_FALLBACK, STAGE_TOKENS, sameStageColors, stageColorsFrom } from './stage-colors'

function fakeStyle(values: Record<string, string>) {
  return { getPropertyValue: (name: string) => values[name] ?? '' }
}

describe('stageColorsFrom', () => {
  it('reads each colour from its CSS token, trimming whitespace', () => {
    const colors = stageColorsFrom(
      fakeStyle({
        '--orbital-pos': ' #FF9B7E ',
        '--orbital-neg': '#4FD6C8',
        '--electron': '#6CB6FF',
        '--accent': '#58A6FF',
        '--fg': '#F0F6FC',
        '--fg-muted': '#8B949E',
        '--fg-subtle': '#6E7681',
        '--surface': '#161B22',
      })
    )
    expect(colors.orbitalPos).toBe('#FF9B7E')
    expect(colors.surface).toBe('#161B22')
  })

  it('falls back to the light values for missing tokens', () => {
    expect(stageColorsFrom(fakeStyle({}))).toEqual(STAGE_FALLBACK)
  })

  it('names every colour with a custom property', () => {
    expect(Object.values(STAGE_TOKENS).every((t) => t.startsWith('--'))).toBe(true)
  })
})

describe('sameStageColors', () => {
  it('detects identical and different palettes', () => {
    const copy = { ...STAGE_FALLBACK }
    expect(sameStageColors(STAGE_FALLBACK, copy)).toBe(true)
    expect(sameStageColors(STAGE_FALLBACK, { ...copy, accent: '#000000' })).toBe(false)
  })
})
