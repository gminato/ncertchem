import { describe, expect, it } from 'vitest'
import {
  BORN_HABER_RANK,
  BORN_HABER_STEP_COUNT,
  schematicLevelY,
  DISSOLUTION_STEP_COUNT,
  bornHaberDiagramLevels,
  bornHaberDiagramSteps,
  bornHaberReadout,
  clampSteps,
  dissolutionDiagramLevels,
  dissolutionDiagramSteps,
  dissolutionReadout,
  formatSignedKJ,
} from './nacl-steps'

describe('clampSteps and signed formatting', () => {
  it('clamps out-of-range and non-finite steps', () => {
    expect(clampSteps(-2, 6)).toBe(0)
    expect(clampSteps(9, 6)).toBe(5)
    expect(clampSteps(Number.NaN, 6)).toBe(0)
  })

  it('uses a true minus sign and one decimal', () => {
    expect(formatSignedKJ(-348.6)).toBe('−348.6')
    expect(formatSignedKJ(108.4)).toBe('+108.4')
    expect(formatSignedKJ(-0.001)).toBe('0.0')
  })
})

describe('schematic Born–Haber levels', () => {
  it('ranks follow the true order of the enthalpies', () => {
    const H = bornHaberDiagramLevels().map((l) => l.H)
    const byHeight = H.map((h, i) => ({ h, i })).sort((a, b) => a.h - b.h)
    byHeight.forEach((entry, rank) => {
      expect(BORN_HABER_RANK[entry.i]).toBe(rank)
    })
  })

  it('adjacent levels are at least 44 units apart on the drawing', () => {
    const ys = BORN_HABER_RANK.map((_, i) => schematicLevelY(i, 300))
    const sorted = [...ys].sort((a, b) => a - b)
    for (let k = 1; k < sorted.length; k++) {
      expect(sorted[k] - sorted[k - 1]).toBeGreaterThanOrEqual(44)
    }
  })
})

describe('Born–Haber scrolly', () => {
  it('has six Steps and six levels', () => {
    expect(BORN_HABER_STEP_COUNT).toBe(6)
    expect(bornHaberDiagramLevels()).toHaveLength(6)
  })

  it('Step 0 has no arrows; Step 5 has all five cycle arrows, the last one marked now', () => {
    expect(bornHaberDiagramSteps(0)).toHaveLength(0)
    const last = bornHaberDiagramSteps(5)
    expect(last).toHaveLength(5)
    expect(last[4].route).toBe('now')
    expect(last[3].route).toBe('done')
    expect(last[4].dH).toBeCloseTo(-788, 6)
  })

  it('the arrows join the levels they should: sublimation goes from the elements to Na(g) + ½Cl₂', () => {
    const first = bornHaberDiagramSteps(1)[0]
    expect(first.from).toBe('level-0')
    expect(first.to).toBe('level-1')
    expect(first.dH).toBeCloseTo(108.4, 6)
  })

  it('the readout for the lattice Step states the sign and the level it lands on', () => {
    expect(bornHaberReadout(5)).toContain('Lattice formation of NaCl(s): −788.0 kJ mol⁻¹')
    expect(bornHaberReadout(5)).toContain('−411.2')
  })

  it('Step 0 reads as the start from the elements', () => {
    expect(bornHaberReadout(0)).toContain('0 kJ mol⁻¹')
  })
})

describe('dissolution scrolly', () => {
  it('has four Steps and three levels', () => {
    expect(DISSOLUTION_STEP_COUNT).toBe(4)
    expect(dissolutionDiagramLevels()).toHaveLength(3)
  })

  it('the aqueous level sits at +4 kJ mol⁻¹, close to the crystal at 0', () => {
    const [solid, gas, aqueous] = dissolutionDiagramLevels()
    expect(solid.H).toBe(0)
    expect(gas.H).toBeCloseTo(788, 6)
    expect(aqueous.H).toBeCloseTo(4, 6)
  })

  it('lattice step is endothermic (+788) and hydration is exothermic (−784)', () => {
    const steps = dissolutionDiagramSteps(3)
    expect(steps).toHaveLength(2)
    expect(steps[0].dH).toBeCloseTo(788, 6)
    expect(steps[1].dH).toBeCloseTo(-784, 6)
  })

  it('the readout at the last Step gives the net +4 kJ mol⁻¹', () => {
    expect(dissolutionReadout(3)).toContain('= +4.0 kJ mol⁻¹')
  })
})
