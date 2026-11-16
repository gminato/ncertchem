import { describe, expect, it } from 'vitest'
import {
  CLEAVAGE_STEP_COUNT,
  CUT_CARBONYLS,
  CUT_PRODUCT,
  DIOL,
  REVERSE_OUT,
  carbonDoubleBond,
  cleavageStep,
  oxygens,
} from './ozonolysis-steps'
import { nameOf } from '@/lib/chem/hydrocarbon-species'

describe('cleavageStep', () => {
  it('has six Steps and clamps out-of-range indices', () => {
    expect(CLEAVAGE_STEP_COUNT).toBe(6)
    expect(cleavageStep(-3).caption).toBe(cleavageStep(0).caption)
    expect(cleavageStep(99).caption).toBe(cleavageStep(5).caption)
  })

  it('keeps every tween target between 0 and 1', () => {
    for (let i = 0; i < CLEAVAGE_STEP_COUNT; i++) {
      for (const v of Object.values(cleavageStep(i).target)) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })

  it('decolourises the reagent in Step 1 and shows the diol from the lib', () => {
    expect(cleavageStep(0).target.reagent).toBe(0)
    expect(cleavageStep(1).target.reagent).toBe(1)
    expect(cleavageStep(1).target.diolA).toBe(1)
    expect(cleavageStep(1).caption).toContain(nameOf(DIOL))
    expect(cleavageStep(1).diolAtoms).toEqual(oxygens(DIOL))
    expect(oxygens(DIOL)).toHaveLength(2)
  })

  it('cuts the C=C in Step 2 and shows the carbonyl products in Step 3', () => {
    expect(cleavageStep(2).target.cut).toBe(1)
    expect(cleavageStep(3).target.productB).toBe(1)
    expect(cleavageStep(3).target.cut).toBe(0)
    expect(cleavageStep(3).productAtoms).toEqual(expect.arrayContaining(CUT_CARBONYLS.flatMap((c) => [c.atom, c.oxygen])))
    expect(cleavageStep(3).caption).toContain(nameOf(CUT_PRODUCT))
  })

  it('joins the carbonyls back in Step 4 to the alkene the lib names', () => {
    const s = cleavageStep(4)
    expect(s.revOutBonds).toEqual([carbonDoubleBond(REVERSE_OUT.graph)])
    expect(s.revOutBonds[0]).toBeGreaterThanOrEqual(0)
    expect(s.target.revIn).toBe(1)
    expect(s.target.revOut).toBe(1)
    expect(s.caption).toContain(REVERSE_OUT.name)
    expect(REVERSE_OUT.name).toBe('1-methylcyclohexene')
  })

  it('shows the polymer in the last Step only', () => {
    expect(cleavageStep(5).target.polymer).toBe(1)
    expect(cleavageStep(5).target.polymerProgress).toBe(1)
    expect(cleavageStep(4).target.polymer).toBe(0)
    expect(cleavageStep(5).caption).toContain('CH₂CH₂')
  })
})
