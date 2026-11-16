import { describe, expect, it } from 'vitest'
import {
  ALKENE_STEPS,
  ALKENE_STEP_COUNT,
  BUTENE_VERDICT,
  C4H8_ISOMERS,
  alkeneStep,
  butene,
} from './alkene-steps'

describe('alkene-structure steps', () => {
  it('has the step count the section expects', () => {
    expect(ALKENE_STEPS).toHaveLength(ALKENE_STEP_COUNT)
  })

  it('merges the p lobes monotonically from separate (0) to one cloud (1) and back to separate for the twist', () => {
    expect(ALKENE_STEPS[0].merge).toBe(0)
    expect(ALKENE_STEPS[1].merge).toBe(1)
    for (const s of ALKENE_STEPS) {
      expect(s.merge).toBeGreaterThanOrEqual(0)
      expect(s.merge).toBeLessThanOrEqual(1)
    }
  })

  it('turns the end-on p orbitals from parallel (0 degrees) to perpendicular (90 degrees)', () => {
    expect(ALKENE_STEPS[2].twist).toBe(0)
    expect(ALKENE_STEPS[3].twist).toBe(90)
  })

  it('clamps out-of-range indices', () => {
    expect(alkeneStep(-3)).toBe(ALKENE_STEPS[0])
    expect(alkeneStep(99)).toBe(ALKENE_STEPS[ALKENE_STEP_COUNT - 1])
    expect(alkeneStep(2.4)).toBe(ALKENE_STEPS[2])
  })

  it('names the three C4H8 alkenes from the lib, all with formula C4H8', () => {
    expect(C4H8_ISOMERS.map((i) => i.name)).toEqual(['but-1-ene', 'but-2-ene', '2-methylprop-1-ene'])
    expect(C4H8_ISOMERS.every((i) => i.formula === 'C4H8')).toBe(true)
  })

  it('gives cis-but-2-ene a net dipole and trans-but-2-ene none', () => {
    expect(BUTENE_VERDICT.exists).toBe(true)
    expect(butene('cis')?.polar).toBe(true)
    expect(butene('trans')?.polar).toBe(false)
  })
})
