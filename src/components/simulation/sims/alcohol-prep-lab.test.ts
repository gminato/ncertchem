import { describe, expect, it } from 'vitest'
import { skeletalBounds } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  SUBSTRATES,
  computeWorkbenchOutcome,
  reagentsForFamily,
} from '@/lib/chem/c12-u7-s4-alcohol-prep'
import { fitMoleculeScale } from './alcohol-prep-lab'

describe('AlcoholPrepLab SVG fitting and invariants', () => {
  it('fits every substrate, intermediate and product inside its 178 x 264 card cleanly', () => {
    for (const sub of SUBSTRATES) {
      const subGraph = parseSmiles(sub.smiles)
      const subScale = fitMoleculeScale(subGraph)
      const subBounds = skeletalBounds(subGraph, subScale)
      expect(subBounds.width).toBeLessThanOrEqual(170)
      expect(subBounds.height).toBeLessThanOrEqual(150)

      for (const r of reagentsForFamily(sub.family)) {
        for (const g of sub.family === 'grignard' ? (['ch3mgbr', 'c2h5mgbr'] as const) : (['ch3mgbr'] as const)) {
          const out = computeWorkbenchOutcome(sub.id, r.id, g)
          if (out.intermediate.smiles) {
            const ig = parseSmiles(out.intermediate.smiles)
            const is = fitMoleculeScale(ig)
            const ib = skeletalBounds(ig, is)
            expect(ib.width).toBeLessThanOrEqual(170)
            expect(ib.height).toBeLessThanOrEqual(150)
          }
          if (out.product) {
            const pg = parseSmiles(out.product.smiles)
            const ps = fitMoleculeScale(pg)
            const pb = skeletalBounds(pg, ps)
            expect(pb.width).toBeLessThanOrEqual(170)
            expect(pb.height).toBeLessThanOrEqual(150)
          }
        }
      }
    }
  })
})
