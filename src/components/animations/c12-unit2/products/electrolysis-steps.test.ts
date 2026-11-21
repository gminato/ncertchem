import { describe, expect, it } from 'vitest'
import { ELECTROLYSIS_STEPS, clampElectrolysisStep, getElectrolysisStepState } from './electrolysis-steps'

describe('electrolysis product Steps', () => {
  it('has five Steps in the order the Prose describes them', () => {
    expect(ELECTROLYSIS_STEPS.map((s) => s.id)).toEqual([
      'molten-salt',
      'water-at-cathode',
      'chloride-at-anode',
      'net-result',
      'acid-strength',
    ])
    expect(ELECTROLYSIS_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4])
  })

  it('clamps out-of-range and non-finite step values', () => {
    expect(clampElectrolysisStep(-3)).toBe(0)
    expect(clampElectrolysisStep(99)).toBe(4)
    expect(clampElectrolysisStep(Number.NaN)).toBe(0)
    expect(getElectrolysisStepState(7).id).toBe('acid-strength')
  })

  it('draws molten NaCl with Na at the cathode and Cl2 at the anode, and no water', () => {
    const s = getElectrolysisStepState(0)
    expect(s.electrolyte).toBe('molten-nacl')
    expect(s.sodiumBeads).toBe(true)
    expect(s.anodeGas).toBe('Cl₂')
    expect(s.cathodeGas).toBeNull()
    expect(s.alkalineMode).toBe('none')
  })

  it('shows H⁺ (0.00 V) winning the cathode over Na⁺ (−2.71 V), with H2 and no sodium', () => {
    const s = getElectrolysisStepState(1)
    expect(s.sodiumBeads).toBe(false)
    expect(s.cathodeGas).toBe('H₂')
    const win = s.cathodeCard?.rows.find((r) => r.tone === 'win')
    expect(win?.label).toBe('H⁺ / H₂')
    expect(win?.value).toBe('0.00 V')
    expect(s.cathodeCard?.rows.find((r) => r.label === 'Na⁺ / Na')?.value).toBe('−2.71 V')
    // The −0.83 V water couple is not a competing or winning potential at the cathode.
    expect(s.cathodeCard?.rows.some((r) => r.value === '−0.83 V')).toBe(false)
  })

  it('shows Cl⁻ winning the anode despite water having the lower E°', () => {
    const s = getElectrolysisStepState(2)
    expect(s.anodeCard?.rows.find((r) => r.tone === 'win')?.label).toBe('Cl⁻ / Cl₂')
    expect(s.anodeCard?.rows.find((r) => r.tone === 'dim')?.value).toBe('1.23 V')
    expect(s.anodeCard?.rows.find((r) => r.tone === 'dim')?.note).toMatch(/overpotential/)
    expect(s.anodeGas).toBe('Cl₂')
    // No oxygen bubbles are drawn at any Step of the molten or aqueous NaCl cell.
    expect(ELECTROLYSIS_STEPS.some((st) => st.anodeGas === 'O₂')).toBe(false)
  })

  it('writes the balanced net equation only at the net-result Step', () => {
    const eqs = ELECTROLYSIS_STEPS.map((s) => s.equation)
    expect(eqs[3]).toBe('2NaCl + 2H₂O → 2NaOH + H₂ + Cl₂')
    expect(eqs.filter((e) => e !== null)).toHaveLength(1)
    expect(getElectrolysisStepState(3).alkalineMode).toBe('bulk')
  })

  it('ends with concentrated acid giving S2O8 2- and no anode gas, with the dilute route dimmed', () => {
    const s = getElectrolysisStepState(4)
    expect(s.electrolyte).toBe('sulphuric-acid')
    expect(s.anodeGas).toBeNull()
    expect(s.cathodeGas).toBe('H₂')
    expect(s.ionSet).toBe('persulphate')
    expect(s.anodeCard?.rows.find((r) => r.tone === 'win')?.value).toBe('1.96 V')
    expect(s.anodeCard?.rows.find((r) => r.tone === 'dim')?.value).toBe('1.23 V')
  })

  it('uses only U+2212 minus signs in potentials', () => {
    const texts = ELECTROLYSIS_STEPS.flatMap((s) => [
      ...(s.cathodeCard?.rows ?? []).map((r) => r.value),
      ...(s.anodeCard?.rows ?? []).map((r) => r.value),
    ])
    for (const t of texts) expect(t).not.toMatch(/-/)
  })
})
