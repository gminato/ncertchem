import { describe, expect, it } from 'vitest'
import type { SchemePath } from '@/components/organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ACETOPHENONE_NAME,
  AROMPREP_FORMULAS,
  AROMPREP_SMILES,
  AROMPREP_STEP_COUNT,
  AROMPREP_STEPS,
  aromprepStepBlocks,
} from './aromprep-steps'

/** Every drawn molecule (graph species) in a Step, one entry per species. */
function drawnFormulas(content: SchemePath | readonly SchemePath[]): string[] {
  const paths = Array.isArray(content[0]) && Array.isArray((content[0] as unknown[])[0]) ? (content as readonly SchemePath[]) : [content as SchemePath]
  const out: string[] = []
  for (const path of paths) {
    for (const item of path) {
      if (Array.isArray(item)) {
        for (const species of item) if (typeof species.formula !== 'string') out.push(molecularFormula(species.formula))
      }
    }
  }
  return out
}

describe('Aromatic carbonyl routes: molecules', () => {
  for (const key of Object.keys(AROMPREP_SMILES) as (keyof typeof AROMPREP_SMILES)[]) {
    it(`${key} has the molecular formula ${AROMPREP_FORMULAS[key]}`, () => {
      expect(molecularFormula(parseSmiles(AROMPREP_SMILES[key]))).toBe(AROMPREP_FORMULAS[key])
    })
  }

  it('names acetophenone with the namer', () => {
    expect(ACETOPHENONE_NAME).toBe('1-phenylethan-1-one')
  })
})

describe('Aromatic carbonyl routes: Steps', () => {
  it('has six Steps in Prose order', () => {
    expect(AROMPREP_STEP_COUNT).toBe(6)
  })

  it('Step 1 passes benzaldehyde on to benzoic acid', () => {
    const drawn = drawnFormulas(AROMPREP_STEPS[0])
    expect(drawn).toEqual(['C7H8', 'C7H6O', 'C7H6O2'])
  })

  it('Step 2 (Etard) draws toluene and benzaldehyde, with the unnamed complex as text', () => {
    expect(drawnFormulas(AROMPREP_STEPS[1])).toEqual(['C7H8', 'C7H6O'])
  })

  it('Step 3 (CrO₃ in acetic anhydride) passes through benzylidene diacetate', () => {
    expect(drawnFormulas(AROMPREP_STEPS[2])).toEqual(['C7H8', 'C11H12O4', 'C7H6O'])
  })

  it('Step 4 (side-chain chlorination) passes through benzal chloride', () => {
    expect(drawnFormulas(AROMPREP_STEPS[3])).toEqual(['C7H8', 'C7H6Cl2', 'C7H6O'])
  })

  it('Step 5 (Gatterman–Koch) draws benzene and benzaldehyde', () => {
    expect(drawnFormulas(AROMPREP_STEPS[4])).toEqual(['C6H6', 'C7H6O'])
  })

  it('Step 6 draws three routes, all to acetophenone', () => {
    const routes = AROMPREP_STEPS[5] as readonly SchemePath[]
    expect(routes).toHaveLength(3)
    expect(drawnFormulas(AROMPREP_STEPS[5])).toEqual(['C7H5ClO', 'C8H8O', 'C7H5N', 'C8H8O', 'C6H6', 'C8H8O'])
  })

  it('Steps 1 to 5 fit above the caption in the 960-unit viewBox', () => {
    for (let k = 0; k < 5; k++) {
      const blocks = aromprepStepBlocks(k)
      const height = blocks.reduce((sum, b) => sum + b.height + (b.label ? 22 : 0), 0) + 12 * (blocks.length - 1)
      expect(height).toBeLessThanOrEqual(960 - 34 - 40 - 20)
    }
  })

  it('Step 6: each route is one row, at most 300 units with its caption', () => {
    for (const block of aromprepStepBlocks(5)) {
      expect(block.height + 22).toBeLessThanOrEqual(300)
    }
  })

  it('Step 6: the three rows fit above the caption, starting 28 units from the top', () => {
    const blocks = aromprepStepBlocks(5)
    const height = blocks.reduce((sum, b) => sum + b.height + (b.label ? 22 : 0), 0) + 28 * (blocks.length - 1)
    expect(28 + height).toBeLessThanOrEqual(960 - 34 - 20)
  })

  it('Step 6: every row is at most 556 units wide, leaving a 12-unit margin in the 580-unit viewBox', () => {
    for (const block of aromprepStepBlocks(5)) {
      expect(block.width).toBeLessThanOrEqual(580 - 2 * 12)
    }
  })

  it('clamps an out-of-range Step index', () => {
    expect(aromprepStepBlocks(-1)).toEqual(aromprepStepBlocks(0))
    expect(aromprepStepBlocks(99)).toEqual(aromprepStepBlocks(AROMPREP_STEP_COUNT - 1))
  })
})
