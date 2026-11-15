import { describe, expect, it } from 'vitest'
import { ACID_BASE_FIELDS, ACID_BASE_STEP_COUNT, acidBaseTarget } from './acid-base-steps'

describe('acid-base Scrolly targets', () => {
  it('has four Steps', () => {
    expect(ACID_BASE_STEP_COUNT).toBe(4)
  })

  it('keeps every field between 0 and 1', () => {
    for (let s = 0; s < ACID_BASE_STEP_COUNT; s++) {
      const t = acidBaseTarget(s)
      for (const f of ACID_BASE_FIELDS) {
        expect(t[f]).toBeGreaterThanOrEqual(0)
        expect(t[f]).toBeLessThanOrEqual(1)
      }
    }
  })

  it('shows HCl alone at Step 0, then the proton transfer and products at Step 1', () => {
    expect(acidBaseTarget(0)).toMatchObject({ hcl: 1, proton: 0, products: 0 })
    expect(acidBaseTarget(1)).toMatchObject({ hcl: 1, proton: 1, products: 1 })
  })

  it('shows the conjugate-pair scene with its tint at Step 2 and no other scene', () => {
    expect(acidBaseTarget(2)).toMatchObject({ nh3: 1, pairs: 1, hcl: 0, bf3: 0 })
  })

  it('forms the BF3 adduct only at Step 3', () => {
    expect(acidBaseTarget(3)).toMatchObject({ bf3: 1, adduct: 1, nh3: 0 })
    for (let s = 0; s < 3; s++) expect(acidBaseTarget(s).adduct).toBe(0)
  })

  it('clamps out-of-range Step indices', () => {
    expect(acidBaseTarget(-4)).toEqual(acidBaseTarget(0))
    expect(acidBaseTarget(99)).toEqual(acidBaseTarget(ACID_BASE_STEP_COUNT - 1))
    expect(acidBaseTarget(1.4)).toEqual(acidBaseTarget(1))
  })
})
