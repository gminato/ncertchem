import { describe, expect, it } from 'vitest'
import {
  ALKYNE_STEP_COPY,
  ALKYNE_STEP_COUNT,
  acidityRows,
  benzeneScheme,
  brominationScheme,
  hydrationScheme,
  pairRadius,
  plainEquation,
  sCharacter,
  equationSides,
  sodamideLine,
  sodiumEquation,
  sodiumScheme,
} from './alkyne-reactions-steps'
import { toDisplay } from '@/lib/chem/alkyne-acid-test'

describe('alkyne-reactions Steps', () => {
  it('has one copy entry per Step', () => {
    expect(ALKYNE_STEP_COPY).toHaveLength(ALKYNE_STEP_COUNT)
    expect(ALKYNE_STEP_COUNT).toBe(5)
  })

  it('s character is 1/(1 + p orbitals): sp 50%, sp2 33.3%, sp3 25%', () => {
    expect(sCharacter('sp')).toBe(0.5)
    expect(sCharacter('sp2')).toBeCloseTo(1 / 3, 10)
    expect(sCharacter('sp3')).toBe(0.25)
  })

  it('the bonding pair is closest to the carbon at 50% s and furthest at 25% s', () => {
    expect(pairRadius(0.25)).toBe(1)
    expect(pairRadius(0.5)).toBeCloseTo(0.4, 10)
    expect(pairRadius(0.5)).toBeLessThan(pairRadius(1 / 3))
    expect(pairRadius(1 / 3)).toBeLessThan(pairRadius(0.25))
  })

  it('acidity rows are ethane, ethene, ethyne with the hybrid read from the lib', () => {
    const rows = acidityRows()
    expect(rows.map((r) => r.name)).toEqual(['ethane', 'ethene', 'ethyne'])
    expect(rows.map((r) => r.hybrid)).toEqual(['sp3', 'sp2', 'sp'])
    // Higher s character means a more acidic C–H (NCERT 9.4.4 A).
    const s = rows.map((r) => r.sCharacter)
    expect([...s].sort((a, b) => a - b)).toEqual(s)
  })

  it('toDisplay turns mhchem text into display text', () => {
    expect(toDisplay('CH#CNa')).toBe('CH≡CNa')
    expect(toDisplay('CCl4 solvent')).toBe('CCl₄ solvent')
    expect(toDisplay('Hg2+ and H+ (dilute H2SO4) at 333 K')).toBe('Hg²⁺ and H⁺ (dilute H₂SO₄) at 333 K')
  })

  it('the schemes are built from lib products', () => {
    const na = sodiumScheme()
    expect(na).toHaveLength(3)
    expect(brominationScheme()).toHaveLength(5)
    expect(hydrationScheme()).toHaveLength(5)
    expect(benzeneScheme()).toHaveLength(3)
  })

  it('the balanced sodium line reads as display text', () => {
    expect(sodiumEquation()).toBe('\\ce{2CH#CH + 2Na -> 2CH#CNa + H2}')
    expect(plainEquation(sodiumEquation())).toBe('2CH≡CH + 2Na → 2CH≡CNa + H₂')
  })

  it('the sodium scheme is the balanced equation only, with coefficients', () => {
    const path = sodiumScheme()
    const formulas = (group: unknown) => (group as { formula: string }[]).map((x) => x.formula)
    expect(path).toHaveLength(3)
    expect(formulas(path[0])).toEqual(['2CH≡CH', '2Na'])
    expect(path[1]).toEqual({})
    expect(formulas(path[2])).toEqual(['2CH≡CNa', 'H₂'])
    expect(equationSides(sodiumEquation())).toEqual({ left: ['2CH≡CH', '2Na'], right: ['2CH≡CNa', 'H₂'] })
  })

  it('the sodamide line is the propyne equation from the acid test', () => {
    expect(sodamideLine()).toBe('With sodamide: CH≡CCH₃ + NaNH₂ → CH₃C≡CNa + NH₃')
  })
})
