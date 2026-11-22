import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { CHOOSER_SUBSTRATES, chooserSummary, chooserView } from './zaitsev-chooser'

describe('chooserView', () => {
  it('names each substrate with the IUPAC namer and matches its molecular formula', () => {
    for (const smiles of CHOOSER_SUBSTRATES) {
      const view = chooserView(smiles)
      expect(view.name).toBe(iupacNameFromSmiles(smiles))
      expect(view.formula).toContain('Br')
    }
    expect(chooserView('CCCC(Br)C').formula).toBe('C₅H₁₁Br')
    expect(chooserView('CC(C)(C)Br').formula).toBe('C₄H₉Br')
    expect(molecularFormula(parseSmiles('CC(Br)C(C)C'))).toBe('C5H11Br')
  })

  it('finds the α-carbon and the β-carbons with their hydrogens', () => {
    const pentane = chooserView('CCCC(Br)C')
    expect(pentane.betaCarbons.map((b) => b.hydrogens)).toEqual([2, 3])
    expect(pentane.betaHydrogenTotal).toBe(5)

    const tertiary = chooserView('CC(C)(C)Br')
    expect(tertiary.betaCarbons.map((b) => b.hydrogens)).toEqual([3, 3, 3])
    expect(tertiary.betaHydrogenTotal).toBe(9)

    const ethyl = chooserView('CCBr')
    expect(ethyl.betaHydrogenTotal).toBe(3)
  })

  it('keeps β-hydrogen totals equal to the sum over the products', () => {
    for (const smiles of CHOOSER_SUBSTRATES) {
      const view = chooserView(smiles)
      const fromProducts = view.products.reduce((sum, p) => sum + p.betaHydrogens, 0)
      // Each product lists the β-H that lead to it. Together they cover every β-H the substrate has.
      expect(fromProducts).toBe(view.betaHydrogenTotal)
    }
  })

  it('gives NCERT 81 % and 19 % for 2-bromopentane only', () => {
    const pentane = chooserView('CCCC(Br)C')
    expect(pentane.hasNcertSplit).toBe(true)
    const pent2 = pentane.products.find((p) => p.name === 'pent-2-ene')
    const pent1 = pentane.products.find((p) => p.name === 'pent-1-ene')
    expect(pent2?.percent).toBe(81)
    expect(pent1?.percent).toBe(19)
    expect(pent2?.zaitsev).toBe(true)

    for (const smiles of CHOOSER_SUBSTRATES.filter((s) => s !== 'CCCC(Br)C')) {
      const view = chooserView(smiles)
      expect(view.hasNcertSplit).toBe(false)
      expect(view.products.every((p) => p.percent === null)).toBe(true)
    }
  })

  it('flags the Zaitsev alkene for 2-bromo-3-methylbutane and 2-bromo-2-methylbutane', () => {
    const byThree = chooserView('CC(Br)C(C)C')
    const zaitsev = byThree.products.filter((p) => p.zaitsev)
    expect(zaitsev.map((p) => p.name)).toEqual(['2-methylbut-2-ene'])
    expect(zaitsev[0].alkylGroups).toBe(3)

    const byTwo = chooserView('CCC(C)(C)Br')
    expect(byTwo.products.find((p) => p.zaitsev)?.name).toBe('2-methylbut-2-ene')
  })

  it('has one product for the tertiary and primary bromides', () => {
    expect(chooserView('CC(C)(C)Br').products.map((p) => p.name)).toEqual(['2-methylprop-1-ene'])
    expect(chooserView('CCBr').products.map((p) => p.name)).toEqual(['ethene'])
    expect(chooserView('CC(C)Br').products.map((p) => p.name)).toEqual(['propene'])
  })
})

describe('chooserSummary', () => {
  it('names the flagged product only when the flag is on', () => {
    const view = chooserView('CCCC(Br)C')
    expect(chooserSummary(view, true)).toContain('pent-2-ene, 2 alkyl groups, 81 % (Zaitsev product)')
    expect(chooserSummary(view, false)).not.toContain('Zaitsev')
  })

  it('reads a single-product substrate as its only alkene', () => {
    const text = chooserSummary(chooserView('CCBr'), true)
    expect(text).toContain('Its only alkene is ethene')
    expect(text).not.toContain('%')
  })
})
