import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { halogenate } from '@/lib/chem/hydrocarbon-reactions'
import { RADICAL_STEP_COUNT, RADICAL_STEP_KINDS, TERMINATIONS, radicalStep } from './radical-chain-steps'
import { PENTANE_SMILES, pentaneData, pentaneModels } from './pentane-shapes'

describe('radical-chain Steps', () => {
  it('has five Steps in the order of the mechanism, then the shapes', () => {
    expect(RADICAL_STEP_COUNT).toBe(5)
    expect(RADICAL_STEP_KINDS.map((_, i) => radicalStep(i).kind)).toEqual(RADICAL_STEP_KINDS)
  })

  it('clamps out-of-range indices', () => {
    expect(radicalStep(-3).kind).toBe('initiation')
    expect(radicalStep(99).kind).toBe('shape')
    expect(radicalStep(2.4).kind).toBe('chain')
  })

  it('ends the chain with ethane, the only termination that forms a C–C bond', () => {
    const ethane = TERMINATIONS.find((t) => t.highlight)
    expect(ethane?.product).toBe('C₂H₆')
    expect(molecularFormula(parseSmiles('CC'))).toBe('C2H6')
    expect(TERMINATIONS.filter((t) => t.product.includes('–')).length).toBe(2)
  })

  it('the first propagation equation is the lib monochlorination of methane', () => {
    expect(halogenate(parseSmiles('C'), 'Cl').equations[0]).toContain('CH4 + Cl2 -> CH3Cl + HCl')
  })
})

describe('pentane shapes', () => {
  it('builds one bond per graph bond, with a plausible length, for each isomer', () => {
    for (const smiles of PENTANE_SMILES) {
      const g = parseSmiles(smiles)
      const data = pentaneData(smiles)
      expect(data.atoms.length).toBe(g.atoms.length)
      expect(data.bonds.length).toBe(g.bonds.length)
      for (const b of data.bonds) {
        const p = data.atoms.find((a) => a.id === b.a)!.position
        const q = data.atoms.find((a) => a.id === b.b)!.position
        const len = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
        expect(len).toBeGreaterThan(1.3)
        expect(len).toBeLessThan(1.65)
      }
    }
  })

  it('lists the three pentanes by name with their Table 9.2 boiling points, highest first', () => {
    const models = pentaneModels()
    expect(models.map((m) => m.name)).toEqual(['pentane', '2-methylbutane', '2,2-dimethylpropane'])
    expect(models.map((m) => m.boilingPointK)).toEqual([309.1, 300.9, 282.5])
  })
})
