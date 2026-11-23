import { describe, expect, it } from 'vitest'
import {
  DEHYDRATION_CONDITIONS,
  REAGENTS,
  SUBSTRATES,
  evaluateCleavageReaction,
} from './c12-u7-s8-cleavage'

describe('NCERT Section 7.4.4(b) C-O cleavage and oxidation model', () => {
  it('exposes the 4 substrates, 6 reagents, and 4 dehydration conditions', () => {
    expect(SUBSTRATES.map((s) => s.id)).toEqual([
      'ethanol',
      'propan-2-ol',
      '2-methylpropan-2-ol',
      'but-2-en-1-ol',
    ])
    expect(REAGENTS.map((r) => r.id)).toEqual([
      'lucas',
      'dehydration',
      'pcc',
      'cro3',
      'kmno4',
      'cu-573k',
    ])
    expect(DEHYDRATION_CONDITIONS).toHaveLength(4)
  })

  it('distinguishes 1°, 2°, and 3° alcohols in the Lucas test', () => {
    const tBu = evaluateCleavageReaction('2-methylpropan-2-ol', 'lucas')
    expect(tBu.lucasTurbidity).toBe('immediate')
    expect(tBu.bondsCleaved).toBe('C-O')
    expect(tBu.majorProductFormula).toBe('(CH₃)₃C-Cl')
    expect(tBu.byProduct).toBe('H₂O')

    const iPr = evaluateCleavageReaction('propan-2-ol', 'lucas')
    expect(iPr.lucasTurbidity).toBe('delayed')
    expect(iPr.majorProductFormula).toBe('CH₃CH(Cl)CH₃')

    const et = evaluateCleavageReaction('ethanol', 'lucas')
    expect(et.lucasTurbidity).toBe('none')
    expect(et.reacts).toBe(false)
    expect(et.bondsCleaved).toBe('None')

    const allylic = evaluateCleavageReaction('but-2-en-1-ol', 'lucas')
    expect(allylic.lucasTurbidity).toBe('immediate')
    expect(allylic.reacts).toBe(true)
    expect(allylic.bondsCleaved).toBe('C-O')
    expect(allylic.majorProductName).toBe('1-Chlorobut-2-ene')
    expect(allylic.majorProductFormula).toBe('CH₃-CH=CH-CH₂Cl')
    expect(allylic.byProduct).toBe('H₂O')
    expect(allylic.preserveDoubleBond).toBe(true)
  })

  it('matches NCERT acid dehydration temperatures and barrier overrides', () => {
    const etMatched = evaluateCleavageReaction('ethanol', 'dehydration', 'matched')
    expect(etMatched.reacts).toBe(true)
    expect(etMatched.reagentArrowBottom).toBe('443 K')
    expect(etMatched.majorProductFormula).toBe('CH₂=CH₂')

    const etMild = evaluateCleavageReaction('ethanol', 'dehydration', '20-h3po4-358k')
    expect(etMild.reacts).toBe(false)
    expect(etMild.dehydrationAssessment?.passes).toBe(false)

    const tBuMild = evaluateCleavageReaction('2-methylpropan-2-ol', 'dehydration', '20-h3po4-358k')
    expect(tBuMild.reacts).toBe(true)
    expect(tBuMild.dehydrationAssessment?.passes).toBe(true)
    expect(tBuMild.majorProductFormula).toBe('CH₂=C(CH₃)CH₃')

    const iPrMatched = evaluateCleavageReaction('propan-2-ol', 'dehydration', 'matched')
    expect(iPrMatched.reagentArrowTop).toBe('85% H₃PO₄')
    expect(iPrMatched.reagentArrowBottom).toBe('440 K')
    expect(iPrMatched.majorProductFormula).toBe('CH₃-CH=CH₂')
  })

  it('handles PCC selectivity on but-2-en-1-ol vs strong KMnO4', () => {
    const pcc = evaluateCleavageReaction('but-2-en-1-ol', 'pcc')
    expect(pcc.reacts).toBe(true)
    expect(pcc.preserveDoubleBond).toBe(true)
    expect(pcc.majorProductFormula).toBe('CH₃-CH=CH-CHO')
    expect(pcc.bondsCleaved).toBe('O-H and α-C-H')
    expect(pcc.mechanismNote).toContain('C=C')

    const allylicMatched = evaluateCleavageReaction('but-2-en-1-ol', 'dehydration', 'matched')
    expect(allylicMatched.reacts).toBe(true)
    expect(allylicMatched.reagentArrowTop).toBe('85% H₃PO₄')
    expect(allylicMatched.reagentArrowBottom).toBe('440 K')
    expect(allylicMatched.dehydrationAssessment?.requiredLabel).toBe('85% H₃PO₄, 440 K')
    expect(allylicMatched.dehydrationAssessment?.passes).toBe(true)

    const allylicDehydration = evaluateCleavageReaction('but-2-en-1-ol', 'dehydration', 'conc-h2so4-443k')
    expect(allylicDehydration.reacts).toBe(true)
    expect(allylicDehydration.majorProductFormula).toBe('CH₂=CH-CH=CH₂')
    expect(allylicDehydration.bondsCleaved).toBe('C-O and allylic C-H')

    const kmno4 = evaluateCleavageReaction('but-2-en-1-ol', 'kmno4')
    expect(kmno4.preserveDoubleBond).toBe(false)
    expect(kmno4.highlightMode).toBe('oh-alpha-ch-and-cc-double')
  })

  it('contrasts heated Cu at 573 K across 1°, 2°, and 3° alcohols', () => {
    const eth = evaluateCleavageReaction('ethanol', 'cu-573k')
    expect(eth.reactionType).toBe('Catalytic Dehydrogenation')
    expect(eth.byProduct).toBe('H₂')
    expect(eth.majorProductFormula).toBe('CH₃CHO')

    const iso = evaluateCleavageReaction('propan-2-ol', 'cu-573k')
    expect(iso.reactionType).toBe('Catalytic Dehydrogenation')
    expect(iso.byProduct).toBe('H₂')
    expect(iso.majorProductFormula).toBe('CH₃COCH₃')

    const tBu = evaluateCleavageReaction('2-methylpropan-2-ol', 'cu-573k')
    expect(tBu.reactionType).toBe('Catalytic Dehydration')
    expect(tBu.byProduct).toBe('H₂O')
    expect(tBu.majorProductFormula).toBe('CH₂=C(CH₃)CH₃')
    expect(tBu.bondsCleaved).toBe('C-O and β-C-H')
  })

  it('blocks mild oxidation of 3° alcohol while allowing harsh C-C cleavage with KMnO4', () => {
    expect(evaluateCleavageReaction('2-methylpropan-2-ol', 'pcc').reacts).toBe(false)
    expect(evaluateCleavageReaction('2-methylpropan-2-ol', 'cro3').reacts).toBe(false)
    const harsh = evaluateCleavageReaction('2-methylpropan-2-ol', 'kmno4')
    expect(harsh.reacts).toBe(true)
    expect(harsh.reactionType).toBe('C-C Cleavage (harsh T)')
    expect(harsh.bondsCleaved).toBe('C-C under elevated T')
  })
})
