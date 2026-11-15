import { describe, expect, it } from 'vitest'
import { reactionEnthalpyFromFormation, formationEnthalpyKJ, type ReactionSpec } from './hess'
import { NCERT_TABLE_5_1_FUSION_VAPORISATION } from './ncert-unit5-tables'

const t = (species: string, coefficient: number) => ({ species, coefficient })

/** Worked examples used in Section 5.4 of the MDX. Each is computed from Table 5.2 by the lib. */
const MG_OH2_DECOMPOSITION: ReactionSpec = {
  label: 'Mg(OH)2(s) → MgO(s) + H2O(g)',
  reactants: [t('Mg(OH)2(s)', 1)],
  products: [t('MgO(s)', 1), t('H2O(g)', 1)],
}
const ETHANOL_DOUBLE_COMBUSTION: ReactionSpec = {
  label: '2C2H5OH(l) + 6O2(g) → 4CO2(g) + 6H2O(l)',
  reactants: [t('C2H5OH(l)', 2), t('O2(g)', 6)],
  products: [t('CO2(g)', 4), t('H2O(l)', 6)],
}
const METHANOL_COMBUSTION: ReactionSpec = {
  label: 'CH3OH(l) + 3/2 O2(g) → CO2(g) + 2H2O(l)',
  reactants: [t('CH3OH(l)', 1), t('O2(g)', 1.5)],
  products: [t('CO2(g)', 1), t('H2O(l)', 2)],
}
const HBR_FORMATION_TWICE: ReactionSpec = {
  label: 'H2(g) + Br2(l) → 2HBr(g)',
  reactants: [t('H2(g)', 1), t('Br2(l)', 1)],
  products: [t('HBr(g)', 2)],
}

describe('Section 5.4 worked examples, computed from Table 5.2', () => {
  it('Mg(OH)2 decomposition: ΔrH = −601.7 − 241.82 + 924.54 = +81.02 ≈ +81.0 kJ mol⁻¹', () => {
    expect(reactionEnthalpyFromFormation(MG_OH2_DECOMPOSITION)).toBeCloseTo(81.02, 6)
  })

  it('doubled ethanol combustion: ΔrH ≈ −2733.6 kJ mol⁻¹ (two moles of −1366.8)', () => {
    const dH = reactionEnthalpyFromFormation(ETHANOL_DOUBLE_COMBUSTION)
    expect(dH).toBeCloseTo(-2733.64, 6)
    expect(dH / 2).toBeCloseTo(-1366.82, 6)
  })

  it('methanol combustion: ΔcH ≈ −726.3 kJ mol⁻¹', () => {
    expect(reactionEnthalpyFromFormation(METHANOL_COMBUSTION)).toBeCloseTo(-726.31, 6)
  })

  it('H2 + Br2 → 2HBr: ΔrH = 2 × (−36.40) = −72.8 kJ mol⁻¹', () => {
    expect(reactionEnthalpyFromFormation(HBR_FORMATION_TWICE)).toBeCloseTo(-72.8, 6)
    expect(formationEnthalpyKJ('HBr(g)')).toBeCloseTo(-36.4, 6)
  })

  it('vaporising 2 mol of water at its boiling point: 2 × 40.79 = 81.58 ≈ 81.6 kJ', () => {
    const water = NCERT_TABLE_5_1_FUSION_VAPORISATION.rows.find((r) => r.substance === 'H2O')
    expect(water?.vaporisationKJ).toBe(40.79)
    expect(2 * (water?.vaporisationKJ ?? 0)).toBeCloseTo(81.58, 6)
  })
})
