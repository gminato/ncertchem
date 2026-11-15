import { describe, expect, it } from 'vitest'
import {
  BALANCER_PRESETS,
  getBalancerStep,
  getPresetBalanceResult,
  prettyFormula,
  skeletonRoles,
  toTallyItems,
  type BalancerMethod,
} from './balancer-presets'
import { isBalanced } from './redox-balance'

const preset = (id: string) => {
  const p = BALANCER_PRESETS.find((x) => x.id === id)
  if (!p) throw new Error(`missing preset ${id}`)
  return p
}

describe('balancer-presets.ts', () => {
  it('contains at least 8 presets across acidic and basic media', () => {
    expect(BALANCER_PRESETS.length).toBeGreaterThanOrEqual(8)
    expect(BALANCER_PRESETS.filter((p) => p.medium === 'acidic').length).toBeGreaterThanOrEqual(4)
    expect(BALANCER_PRESETS.filter((p) => p.medium === 'basic').length).toBeGreaterThanOrEqual(4)
  })

  it('none of the presets duplicate NCERT Problems 7.8, 7.9 or 7.10', () => {
    for (const p of BALANCER_PRESETS) {
      expect(p.skeleton).not.toBe('Cr2O72- + SO32- -> Cr3+ + SO42-')
      expect(p.skeleton).not.toBe('MnO4- + Br- -> MnO2 + BrO3-')
      expect(p.skeleton).not.toBe('MnO4- + I- -> MnO2 + I2')
    }
  })

  it('every preset balances with both methods, with 7 and 5 steps', () => {
    for (const p of BALANCER_PRESETS) {
      const hr = getPresetBalanceResult(p, 'half-reaction')
      expect(hr.isBalanced).toBe(true)
      expect(hr.steps).toHaveLength(7)
      const on = getPresetBalanceResult(p, 'oxidation-number')
      expect(on.isBalanced).toBe(true)
      expect(on.steps).toHaveLength(5)
    }
  })

  it('every step view is computable for every preset and method, with valid try-it targets', () => {
    const methods: BalancerMethod[] = ['half-reaction', 'oxidation-number']
    for (const p of BALANCER_PRESETS) {
      for (const m of methods) {
        const total = getPresetBalanceResult(p, m).steps.length
        for (let i = 0; i < total; i++) {
          const view = getBalancerStep(p, m, i)
          expect(view.equation.length).toBeGreaterThan(0)
          for (const f of view.challenge?.fields ?? []) {
            expect(Number.isInteger(f.target)).toBe(true)
            expect(f.target).toBeGreaterThan(0)
            expect(f.hint.length).toBeGreaterThan(10)
          }
        }
      }
    }
  })

  it('half-reaction steps 2 to 5 carry two halves, and the halves are balanced by the lib', () => {
    const p = preset('chromium-hypochlorite')
    expect(getBalancerStep(p, 'half-reaction', 0).halves).toBeUndefined()
    for (let i = 1; i < 7; i++) {
      const v = getBalancerStep(p, 'half-reaction', i)
      expect(v.halves).toBeDefined()
      expect(v.halves?.ox.equation).not.toContain('|')
      if (i >= 4) {
        expect(v.halves?.ox.tally.every((t) => t.balanced)).toBe(true)
      }
    }
  })

  it('chromium-hypochlorite (basic): electrons 3 and 2, multipliers 2 and 3', () => {
    const p = preset('chromium-hypochlorite')
    const electrons = getBalancerStep(p, 'half-reaction', 3).challenge
    expect(electrons?.fields.map((f) => f.target)).toEqual([3, 2])
    const multipliers = getBalancerStep(p, 'half-reaction', 4).challenge
    expect(multipliers?.fields.map((f) => f.target)).toEqual([2, 3])
    const v = getBalancerStep(p, 'half-reaction', 5)
    expect(v.halves?.ox.multiplier).toBe(2)
    expect(v.halves?.red.multiplier).toBe(3)
    expect(v.halves?.ox.electrons).toBe(6)
  })

  it('permanganate-oxalate (acidic, oxidation number): multipliers 5 and 2, then 16 H+ and 8 H2O', () => {
    const p = preset('permanganate-oxalate')
    expect(getBalancerStep(p, 'oxidation-number', 1).challenge?.fields.map((f) => f.target)).toEqual([5, 2])
    expect(getBalancerStep(p, 'oxidation-number', 2).challenge?.fields[0].target).toBe(16)
    expect(getBalancerStep(p, 'oxidation-number', 3).challenge?.fields[0].target).toBe(8)
  })

  it('a try-it hint names the oxidation-number change and the electron count', () => {
    const p = preset('permanganate-oxalate')
    const hint = getBalancerStep(p, 'oxidation-number', 1).challenge?.fields[1].hint ?? ''
    expect(hint).toContain('Mn goes from +7 to +2')
    expect(hint).toContain('gains 5 e⁻')
  })

  it('isBalanced and toTallyItems compute atoms and charges with electrons in half-reactions', () => {
    const v = isBalanced('Cr(OH)3 + 5OH- -> CrO42- + 4H2O + 3e-')
    expect(v.balanced).toBe(true)
    const tally = toTallyItems(v)
    expect(tally.find((t) => t.item === 'Cr')?.balanced).toBe(true)
    const charge = tally.find((t) => t.item === 'Charge')
    expect(charge?.left).toBe(-5)
    expect(charge?.right).toBe(-5)
  })

  it('skeletonRoles: reductants are oxidised, oxidants reduced, disproportionation gets no role', () => {
    expect(skeletonRoles(preset('permanganate-oxalate').skeleton)).toEqual({ ox: ['C2O4'], red: ['MnO4'] })
    expect(skeletonRoles(preset('chromium-hypochlorite').skeleton)).toEqual({ ox: ['Cr(OH)3'], red: ['ClO'] })
    expect(skeletonRoles(preset('phosphorus-disproportionation').skeleton)).toEqual({ ox: [], red: [] })
    expect(skeletonRoles(preset('dichromate-h2o2').skeleton)).toEqual({ ox: ['H2O2'], red: ['Cr2O7'] })
  })

  it('oxidation-number multipliers are reactant coefficients (copper: Cu x1, NO3- x2)', () => {
    const p = preset('copper-nitrate')
    expect(getBalancerStep(p, 'oxidation-number', 1).challenge?.fields.map((f) => f.target)).toEqual([1, 2])
    expect(getBalancerStep(p, 'half-reaction', 3).challenge?.fields.map((f) => f.target)).toEqual([2, 1])
  })

  it('step descriptions are readable: no raw arrows, e- or bare charges', () => {
    const p = preset('dichromate-iodide')
    const text = getBalancerStep(p, 'half-reaction', 1).description
    expect(text).toBe('Oxidation half: I⁻ → I₂; Reduction half: Cr₂O₇²⁻ → Cr³⁺.')
    expect(getBalancerStep(preset('permanganate-oxalate'), 'half-reaction', 4).description).toBe(
      'Oxidation loses 2e⁻; Reduction gains 5e⁻.',
    )
  })

  it('prettyFormula writes subscripts and superscript charges', () => {
    expect(prettyFormula('C2O4^2-')).toBe('C₂O₄²⁻')
    expect(prettyFormula('Cr(OH)3')).toBe('Cr(OH)₃')
    expect(prettyFormula('Mn^2+')).toBe('Mn²⁺')
  })
})
