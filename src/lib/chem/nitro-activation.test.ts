import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from './iupac-organic'
import { canonicalKey, molecularFormula, parseSmiles } from './molecule-parse'
import { NCERT_HALOARENE_HYDROLYSIS } from './ncert-c12-unit6-data'
import { nitroActivation } from './haloalkanes'
import {
  carbanionContributors,
  carbanionContributorSmiles,
  nitroSubstrateSmiles,
  nitroVerdict,
  nitroOxygenContributorSmiles,
  printedHydrolysisCase,
  withResonantNitroChargesOnly,
} from './nitro-activation'

describe('nitro-activation substrate', () => {
  it('draws the printed NCERT arrangements as the same molecules', () => {
    const printed = [
      { pos: [4], entry: 1 },
      { pos: [2, 4], entry: 2 },
      { pos: [2, 4, 6], entry: 3 },
    ]
    for (const { pos, entry } of printed) {
      const ours = nitroSubstrateSmiles(pos)
      const theirs = NCERT_HALOARENE_HYDROLYSIS[entry].smiles
      expect(canonicalKey(parseSmiles(ours))).toBe(canonicalKey(parseSmiles(theirs)))
      expect(iupacNameFromSmiles(ours)).toBe(iupacNameFromSmiles(theirs))
    }
  })

  it('names and formulas match the chloronitrobenzene patterns', () => {
    expect(iupacNameFromSmiles(nitroSubstrateSmiles([]))).toBe('chlorobenzene')
    expect(iupacNameFromSmiles(nitroSubstrateSmiles([3]))).toBe('1-chloro-3-nitrobenzene')
    expect(molecularFormula(parseSmiles(nitroSubstrateSmiles([2, 4])))).toBe('C6H3ClN2O4')
    expect(molecularFormula(parseSmiles(nitroSubstrateSmiles([])))).toBe('C6H5Cl')
  })

  it('places the nitro groups where the positions say (C1 carries Cl)', () => {
    const g = parseSmiles(nitroSubstrateSmiles([3, 5]))
    expect(molecularFormula(g)).toBe('C6H3ClN2O4')
    expect(iupacNameFromSmiles(nitroSubstrateSmiles([3, 5]))).toBe('1-chloro-3,5-dinitrobenzene')
  })
})

describe('carbanion contributors', () => {
  it('each contributor is a single anion with the sp³ C1 carrying Cl and the new OH', () => {
    for (const pos of [[], [4], [3], [2, 4, 6]]) {
      for (const c of carbanionContributors(pos)) {
        const g = parseSmiles(c.smiles)
        const charge = g.atoms.reduce((s, a) => s + (a.charge ?? 0), 0)
        expect(charge).toBe(-1)
        // OH⁻ adds to the substrate: one more O and one more H, and the anion carries the −1 charge.
        const base = elementCounts(nitroSubstrateSmiles(pos))
        const added = elementCounts(c.smiles)
        expect(added.O).toBe((base.O ?? 0) + 1)
        expect(added.Cl).toBe(1)
        expect(added.C).toBe(6)
        expect(added.N ?? 0).toBe(base.N ?? 0)
      }
    }
  })

  it('marks the charge on a nitro carbon only when the nitro group is ortho or para', () => {
    expect(carbanionContributors([4]).map((c) => c.reachesNitro)).toEqual([false, true, false])
    expect(carbanionContributors([3]).map((c) => c.reachesNitro)).toEqual([false, false, false])
    expect(carbanionContributors([2, 4, 6]).map((c) => c.reachesNitro)).toEqual([true, true, true])
  })

  it('the contributor for C4 has the anion on C4 and the nitro group on it', () => {
    expect(carbanionContributorSmiles([4], 4)).toBe('ClC1(O)C=C[C-]([N+](=O)[O-])C=C1')
  })
})

describe('verdicts and printed conditions', () => {
  it('agrees with nitroActivation for every pattern', () => {
    for (const pos of [[], [2], [3], [4], [5], [6], [2, 4], [3, 5], [2, 3, 4]]) {
      const v = nitroVerdict(pos)
      expect(v.activated).toBe(nitroActivation(pos).activated)
    }
  })

  it('gives temperatures only for the three printed arrangements', () => {
    expect(printedHydrolysisCase([4])?.temperatureK).toBe(443)
    expect(printedHydrolysisCase([2, 4])?.temperatureK).toBe(368)
    expect(printedHydrolysisCase([2, 4, 6])?.temperatureK).toBeNull()
    expect(printedHydrolysisCase([])?.temperatureK).toBe(623)
    expect(printedHydrolysisCase([3])).toBeNull()
    expect(printedHydrolysisCase([2])).toBeNull()
  })

  it('rejects positions that are not ring positions 2 to 6', () => {
    expect(() => nitroSubstrateSmiles([1])).toThrow(RangeError)
    expect(() => nitroSubstrateSmiles([7])).toThrow(RangeError)
  })
})

/** Element counts of a parsed graph, with the hydrogens each atom carries. */
function elementCounts(smiles: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const a of parseSmiles(smiles).atoms) {
    counts[a.element] = (counts[a.element] ?? 0) + 1
    counts.H = (counts.H ?? 0) + (a.hCount ?? 0)
  }
  return counts
}

describe('nitro-activation nitro-O contributor', () => {
  it('writes the para and ortho nitro-O forms and keeps the formula C6H5ClNO3 with one negative charge', () => {
    expect(nitroOxygenContributorSmiles([4], 4)).toBe('ClC1(O)C=CC(=[N+]([O-])[O-])C=C1')
    expect(nitroOxygenContributorSmiles([2], 2)).toBe('ClC1(O)C(=[N+]([O-])[O-])C=CC=C1')
    const cases = [
      { nitro: [4], site: 4 as const, formula: 'C6H5ClNO3' },
      { nitro: [2], site: 2 as const, formula: 'C6H5ClNO3' },
      { nitro: [2, 4], site: 2 as const, formula: 'C6H4ClN2O5' },
      { nitro: [2, 4, 6], site: 6 as const, formula: 'C6H3ClN3O7' },
    ]
    for (const { nitro, site, formula } of cases) {
      const g = parseSmiles(nitroOxygenContributorSmiles(nitro, site))
      expect(molecularFormula(g).replace(/[+-]$/, '')).toBe(formula)
      expect(g.atoms.reduce((sum, a) => sum + (a.charge ?? 0), 0)).toBe(-1)
    }
  })

  it('refuses a site that carries no NO₂', () => {
    expect(() => nitroOxygenContributorSmiles([4], 2)).toThrow()
  })

  it('keeps nitro charges only on the nitro-O contributor', () => {
    const carbanion = withResonantNitroChargesOnly(parseSmiles(carbanionContributorSmiles([4], 6)))
    expect(carbanion.atoms.filter((a) => a.element === 'O' && (a.charge ?? 0) !== 0)).toHaveLength(0)
    const para = withResonantNitroChargesOnly(parseSmiles(nitroOxygenContributorSmiles([4], 4)))
    expect(para.atoms.filter((a) => a.element === 'O' && a.charge === -1)).toHaveLength(2)
  })
})
