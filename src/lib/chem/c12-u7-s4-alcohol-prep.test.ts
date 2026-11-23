import { describe, expect, it } from 'vitest'
import { drawingFrame } from '@/components/organic/frame'
import { parseSmiles } from './molecule-parse'
import {
  REAGENTS,
  SUBSTRATES,
  computeWorkbenchOutcome,
  reagentsForFamily,
  substratesForFamily,
} from './c12-u7-s4-alcohol-prep'

describe('Section 7.4.1 alcohol synthesis workbench model', () => {
  it('parses and lays out every substrate, intermediate and product SMILES without errors', () => {
    for (const sub of SUBSTRATES) {
      const g = parseSmiles(sub.smiles)
      const frame = drawingFrame(g, 48)
      expect(frame.points.length).toBe(g.atoms.length)
      for (const r of reagentsForFamily(sub.family)) {
        const out = computeWorkbenchOutcome(sub.id, r.id, 'ch3mgbr')
        if (out.intermediate.smiles) {
          const ig = parseSmiles(out.intermediate.smiles)
          expect(drawingFrame(ig, 48).points.length).toBe(ig.atoms.length)
        }
        if (out.product) {
          const pg = parseSmiles(out.product.smiles)
          expect(drawingFrame(pg, 48).points.length).toBe(pg.atoms.length)
        }
      }
    }
  })

  it('gives Markovnikov vs anti-Markovnikov regioselectivity for alkenes', () => {
    expect(computeWorkbenchOutcome('propene', 'acid-hydration')).toMatchObject({
      status: 'reaction',
      degree: '2°',
      deltaC: 0,
      product: { iupacName: 'Propan-2-ol', formulaUnicode: 'C₃H₈O' },
    })
    expect(computeWorkbenchOutcome('propene', 'hydroboration-oxidation')).toMatchObject({
      status: 'reaction',
      degree: '1°',
      deltaC: 0,
      byProducts: 'B(OH)₃ (boric acid)',
      product: { iupacName: 'Propan-1-ol', formulaUnicode: 'C₃H₈O' },
    })
    expect(computeWorkbenchOutcome('2-methylpropene', 'acid-hydration').product?.iupacName).toBe(
      '2-Methylpropan-2-ol'
    )
    expect(computeWorkbenchOutcome('2-methylpropene', 'hydroboration-oxidation').product?.iupacName).toBe(
      '2-Methylpropan-1-ol'
    )
    expect(computeWorkbenchOutcome('but-1-ene', 'acid-hydration').product?.iupacName).toBe('Butan-2-ol')
    expect(computeWorkbenchOutcome('but-1-ene', 'hydroboration-oxidation').product?.iupacName).toBe('Butan-1-ol')
  })

  it('distinguishes aldehyde/ketone reduction from carboxylic acid chemoselectivity', () => {
    expect(computeWorkbenchOutcome('propanal', 'nabh4')).toMatchObject({
      status: 'reaction',
      degree: '1°',
      product: { iupacName: 'Propan-1-ol' },
    })
    expect(computeWorkbenchOutcome('butanone', 'h2-pd')).toMatchObject({
      status: 'reaction',
      degree: '2°',
      product: { iupacName: 'Butan-2-ol' },
    })
    const nabh4Acid = computeWorkbenchOutcome('butanoic-acid', 'nabh4')
    expect(nabh4Acid.status).toBe('no-reaction')
    expect(nabh4Acid.degree).toBe('No reaction')
    expect(nabh4Acid.mechanismNote).toContain('NaBH₄ is too mild')

    const labAcid = computeWorkbenchOutcome('butanoic-acid', 'lialh4')
    expect(labAcid.status).toBe('reaction')
    expect(labAcid.degree).toBe('1°')
    expect(labAcid.product?.iupacName).toBe('Butan-1-ol')

    const commAcid = computeWorkbenchOutcome('butanoic-acid', 'ester-h2')
    expect(commAcid.status).toBe('reaction')
    expect(commAcid.byProducts).toContain("R'OH")
    expect(commAcid.product?.iupacName).toBe('Butan-1-ol')
  })

  it('handles Grignard Step (i) adduct and Step (ii) 1°, 2°, 3° alcohol degrees with ΔC', () => {
    const step1 = computeWorkbenchOutcome('ethanal', 'adduct', 'c2h5mgbr')
    expect(step1.status).toBe('intermediate-only')
    expect(step1.deltaC).toBe(2)
    expect(step1.degree).toBe('Adduct (yields 2°)')

    expect(computeWorkbenchOutcome('methanal', 'hydrolysis', 'ch3mgbr')).toMatchObject({
      status: 'reaction',
      degree: '1°',
      deltaC: 1,
      byProducts: 'Mg(OH)Br',
      product: { iupacName: 'Ethanol' },
    })
    expect(computeWorkbenchOutcome('ethanal', 'hydrolysis', 'c2h5mgbr')).toMatchObject({
      status: 'reaction',
      degree: '2°',
      deltaC: 2,
      product: { iupacName: 'Butan-2-ol' },
    })
    expect(computeWorkbenchOutcome('propanone', 'hydrolysis', 'ch3mgbr')).toMatchObject({
      status: 'reaction',
      degree: '3°',
      deltaC: 1,
      product: { iupacName: '2-Methylpropan-2-ol' },
    })
    expect(computeWorkbenchOutcome('propanone', 'hydrolysis', 'c2h5mgbr')).toMatchObject({
      status: 'reaction',
      degree: '3°',
      deltaC: 2,
      product: { iupacName: '2-Methylbutan-2-ol' },
    })
  })

  it('covers all families and highlights valid bond indices', () => {
    expect(substratesForFamily('alkenes')).toHaveLength(3)
    expect(substratesForFamily('carbonyls')).toHaveLength(3)
    expect(substratesForFamily('grignard')).toHaveLength(3)
    expect(REAGENTS).toHaveLength(8)

    const grigOut = computeWorkbenchOutcome('propanone', 'hydrolysis', 'c2h5mgbr')
    expect(grigOut.product).not.toBeNull()
    const g = parseSmiles(grigOut.product!.smiles)
    const bIdx = grigOut.product!.highlightBonds[0]
    expect(bIdx).toBeGreaterThanOrEqual(0)
    expect(bIdx).toBeLessThan(g.bonds.length)
    // Highlighted bond for Grignard must be a C-C bond, not C-O.
    const bond = g.bonds[bIdx]
    expect(g.atoms[bond.a].element).toBe('C')
    expect(g.atoms[bond.b].element).toBe('C')
  })
})
