import { describe, expect, it } from 'vitest'
import { fitScheme, MAX_SCHEME_SCALE } from './scheme-fit'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { sodiumSaltLabel, startingSpecies } from './alkane-routes-steps'

describe('fitScheme', () => {
  it('scales a one-row scheme up to the width, within the limit', () => {
    const seq = [[startingSpecies(parseSmiles('CCC'))], { reagents: 'H₂', conditions: 'Zn' }, [{ formula: 'CH₃CH₂CH₃', tag: '3 C' }]]
    const f = fitScheme(seq, 580)
    expect(f.rows).toBe(1)
    expect(f.scale).toBeGreaterThanOrEqual(1)
    expect(f.scale).toBeLessThanOrEqual(MAX_SCHEME_SCALE)
    expect(f.width).toBeLessThanOrEqual(580 + 0.5)
  })

  it('does not scale a two-row scheme', () => {
    const big = parseSmiles('CC(C)C(C)C')
    const seq = [[startingSpecies(big), startingSpecies(big), startingSpecies(big)], { reagents: 'x', conditions: 'y' }, [startingSpecies(big)]]
    const f = fitScheme(seq, 200)
    expect(f.rows).toBe(2)
    expect(f.scale).toBe(1)
  })
})

describe('sodiumSaltLabel', () => {
  it('writes the salts of the menu acids from the lib label', () => {
    expect(sodiumSaltLabel(parseSmiles('CCCC(=O)O'))).toBe('CH3CH2CH2COONa')
    expect(sodiumSaltLabel(parseSmiles('CC(=O)O'))).toBe('CH3COONa')
    expect(sodiumSaltLabel(parseSmiles('C(=O)O'))).toBe('HCOONa')
  })
})
