import { describe, expect, it } from 'vitest'
import { calculatedFe2Molarity, endPointDrops, formatMoles, reactedMoles } from './oxidant-titration'

describe('endPointDrops', () => {
  it('ends at 12.50 mL for 25.00 mL of 0.0500 M Fe²⁺ with 0.0200 M KMnO₄ (5 Fe²⁺ per MnO₄⁻)', () => {
    expect(endPointDrops({ oxidant: 'MnO4-', oxidantMolarity: 0.02, fe2Molarity: 0.05, fe2VolumeMl: 25 })).toBe(1250)
  })

  it('ends at 10.42 mL with dichromate (6 Fe²⁺ per Cr₂O₇²⁻)', () => {
    expect(endPointDrops({ oxidant: 'Cr2O7 2-', oxidantMolarity: 0.02, fe2Molarity: 0.05, fe2VolumeMl: 25 })).toBe(1042)
  })
})

describe('calculatedFe2Molarity', () => {
  it('returns the set value (0.0500 mol dm⁻³) from either end point, to 4 dp', () => {
    const mno4 = calculatedFe2Molarity({ oxidant: 'MnO4-', oxidantMolarity: 0.02, drops: 1250, fe2VolumeMl: 25 })
    const cr2o7 = calculatedFe2Molarity({ oxidant: 'Cr2O7 2-', oxidantMolarity: 0.02, drops: 1042, fe2VolumeMl: 25 })
    expect(mno4.toFixed(4)).toBe('0.0500')
    expect(cr2o7.toFixed(4)).toBe('0.0500')
  })
})

describe('reactedMoles', () => {
  it('gives 2.50 × 10⁻⁴ mol MnO₄⁻ and 1.25 × 10⁻³ mol Fe²⁺ at 12.50 mL', () => {
    const r = reactedMoles({ oxidant: 'MnO4-', oxidantMolarity: 0.02, drops: 1250 })
    expect(formatMoles(r.oxidantMol)).toBe('2.50 × 10⁻⁴ mol')
    expect(formatMoles(r.fe2Mol)).toBe('1.25 × 10⁻³ mol')
  })
})

describe('formatMoles', () => {
  it('rounds half-up and keeps the exponent in superscripts', () => {
    expect(formatMoles(0.000125)).toBe('1.25 × 10⁻⁴ mol')
    expect(formatMoles(9.999e-3)).toBe('1.00 × 10⁻² mol')
    expect(formatMoles(0)).toBe('0 mol')
  })
})
