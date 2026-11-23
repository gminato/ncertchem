import { describe, expect, it } from 'vitest'
import { type SchemePath, layoutReactionScheme } from '@/components/organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ACETOPHENONE_NAME,
  AROMPREP_FORMULAS,
  AROMPREP_SMILES,
  AROMPREP_STEP_COUNT,
  AROMPREP_STEPS,
  ROUTE_WIDTH,
  aromprepStepBlocks,
  blockGap,
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

/** The viewBox height and the caption band, from the Scrolly. */
const VIEW_H = 720
const CAPTION_BAND = 40
const MARGIN = 24

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
  it('has seven Steps in Prose order', () => {
    expect(AROMPREP_STEP_COUNT).toBe(7)
  })

  it('Step 1 passes benzaldehyde on to benzoic acid', () => {
    expect(drawnFormulas(AROMPREP_STEPS[0])).toEqual(['C7H8', 'C7H6O', 'C7H6O2'])
  })

  it('Step 2 (Etard) draws toluene and benzaldehyde, with the unnamed complex as text', () => {
    expect(drawnFormulas(AROMPREP_STEPS[1])).toEqual(['C7H8', 'C7H6O'])
  })

  it('Step 3 (CrO₃ in acetic anhydride) passes through benzylidene diacetate', () => {
    expect(AROMPREP_STEPS[2]).toHaveLength(1)
    expect(drawnFormulas(AROMPREP_STEPS[2])).toEqual(['C7H8', 'C7H6O'])
  })

  it('Step 4 (side-chain chlorination) passes through benzal chloride', () => {
    expect(drawnFormulas(AROMPREP_STEPS[3])).toEqual(['C7H8', 'C7H6Cl2', 'C7H6O'])
  })

  it('Step 5 (Gatterman–Koch) draws benzene and benzaldehyde', () => {
    expect(drawnFormulas(AROMPREP_STEPS[4])).toEqual(['C6H6', 'C7H6O'])
  })

  it('Step 6 draws routes (a) and (b), both to acetophenone', () => {
    expect(AROMPREP_STEPS[5]).toHaveLength(2)
    expect(drawnFormulas(AROMPREP_STEPS[5])).toEqual(['C7H5ClO', 'C8H8O', 'C7H5N', 'C8H8O'])
  })

  it('Step 7 draws route (c), benzene to acetophenone', () => {
    expect(AROMPREP_STEPS[6]).toHaveLength(1)
    expect(drawnFormulas(AROMPREP_STEPS[6])).toEqual(['C6H6', 'C8H8O'])
  })

  it('every Step fits the 720-unit viewBox: rows, captions, gaps and margins total at most 720 − 24', () => {
    for (let k = 0; k < AROMPREP_STEP_COUNT; k++) {
      const blocks = aromprepStepBlocks(k)
      const gap = blockGap(blocks)
      const rows = blocks.reduce((sum, b) => sum + b.height + (b.label ? 22 : 0), 0)
      const total = rows + gap * (blocks.length - 1) + CAPTION_BAND + MARGIN
      expect(total, `Step ${k + 1}`).toBeLessThanOrEqual(VIEW_H - 24)
    }
  })

  it('every row of every Step is at most 556 units wide, measured on its layout', () => {
    for (let k = 0; k < AROMPREP_STEP_COUNT; k++) {
      for (const block of aromprepStepBlocks(k)) {
        const layout = layoutReactionScheme(block.path, block.width, block.scales ? [...block.scales] : undefined)
        expect(layout.width, `Step ${k + 1}`).toBeLessThanOrEqual(556)
      }
    }
    expect(ROUTE_WIDTH).toBeLessThanOrEqual(556)
  })

  it('Step 6 and 7 routes are each one row, with its caption above', () => {
    for (const k of [5, 6]) {
      for (const block of aromprepStepBlocks(k)) {
        expect(block.label).toBeDefined()
        expect(block.height).toBeGreaterThan(0)
      }
    }
  })

  it('clamps an out-of-range Step index', () => {
    expect(aromprepStepBlocks(-1)).toEqual(aromprepStepBlocks(0))
    expect(aromprepStepBlocks(99)).toEqual(aromprepStepBlocks(AROMPREP_STEP_COUNT - 1))
  })
})
