import { describe, expect, it } from 'vitest'
import { NCERT_TABLE_7_3 } from './ncert-c12-unit7-data'
import {
  ACIDITY_COMPOUNDS,
  ACYL_REAGENTS,
  ESTER_SUBSTRATES,
  compareAcidity,
  esterificationOutcome,
  getAcidityCompound,
  reagentTestOutcome,
  type AcidityCompoundId,
} from './c12-u7-s7-acidity-esterification'

describe('Section 7.4.4 acidity and esterification chemistry model', () => {
  it('matches every NCERT Table 7.3 pKa value exactly and keeps qualitative compounds null', () => {
    for (const row of NCERT_TABLE_7_3) {
      const match = ACIDITY_COMPOUNDS.find((c) => c.name.startsWith(row.name))
      expect(match, `Missing compound for ${row.name}`).toBeDefined()
      expect(match?.pKa).toBe(row.pKa)
      expect(match?.printedPka).toBe(row.printed)
    }

    const qualitative: AcidityCompoundId[] = ['water', 'propan-2-ol', 'tert-butanol']
    for (const id of qualitative) {
      const c = getAcidityCompound(id)
      expect(c.pKa).toBeNull()
      expect(c.printedPka).toBeNull()
    }
  })

  it('orders acidity strictly as nitrophenols > phenol > cresols > water > 1° > 2° > 3° alcohols', () => {
    const chain: AcidityCompoundId[] = [
      'p-nitrophenol',
      'o-nitrophenol',
      'm-nitrophenol',
      'phenol',
      'm-cresol',
      'o-cresol',
      'water',
      'ethanol',
      'propan-2-ol',
      'tert-butanol',
    ]
    for (let i = 0; i < chain.length - 1; i++) {
      const cmp = compareAcidity(chain[i], chain[i + 1])
      expect(cmp.stronger, `${chain[i]} should be stronger than ${chain[i + 1]}`).toBe('A')
    }

    const tiedCresols = compareAcidity('o-cresol', 'p-cresol')
    expect(tiedCresols.stronger).toBe('equal')
    expect(tiedCresols.deltaPka).toBe(0)
  })

  it('computes exact Table 7.3 delta pKa and relative acidity factor for phenol vs ethanol', () => {
    const cmp = compareAcidity('phenol', 'ethanol')
    expect(cmp.stronger).toBe('A')
    expect(cmp.deltaPka).toBe(5.9)
    expect(cmp.relativeFactor).toBeCloseTo(Math.pow(10, 5.9), 2)
    expect(cmp.factorDisplay).toContain('10⁵·⁹')
  })

  it('distinguishes phenols and alcohols in NaOH while active metals react with both', () => {
    const phenols: AcidityCompoundId[] = [
      'p-nitrophenol',
      'o-nitrophenol',
      'm-nitrophenol',
      'phenol',
      'm-cresol',
      'o-cresol',
      'p-cresol',
    ]
    const alcohols: AcidityCompoundId[] = ['ethanol', 'propan-2-ol', 'tert-butanol']

    for (const id of phenols) {
      expect(reagentTestOutcome(id, 'NaOH').reacts).toBe(true)
      expect(reagentTestOutcome(id, 'Na').gasEvolved).toBe(true)
      expect(reagentTestOutcome(id, 'Al').gasEvolved).toBe(true)
    }

    for (const id of alcohols) {
      expect(reagentTestOutcome(id, 'NaOH').reacts).toBe(false)
      expect(reagentTestOutcome(id, 'Na').gasEvolved).toBe(true)
      expect(reagentTestOutcome(id, 'Al').gasEvolved).toBe(true)
    }

    const tBuAl = reagentTestOutcome('tert-butanol', 'Al')
    expect(tBuAl.productName).toBe('Aluminium tert-butoxide')
    expect(tBuAl.equation).toContain('6 (CH₃)₃C–OH + 2 Al')
  })

  it('produces valid esterification outcomes across all substrates, reagents, and trap states', () => {
    for (const s of ESTER_SUBSTRATES) {
      for (const r of ACYL_REAGENTS) {
        const trapped = esterificationOutcome(s.id, r.id, true)
        const untrapped = esterificationOutcome(s.id, r.id, false)
        expect(trapped.equilibriumPosition).toBeGreaterThan(untrapped.equilibriumPosition)
        expect(trapped.equation.length).toBeGreaterThan(10)
      }
    }

    const aspirin = esterificationOutcome('salicylic-acid', 'anhydride', true)
    expect(aspirin.isAspirinSynthesis).toBe(true)
    expect(aspirin.productName).toBe('Acetylsalicylic acid (Aspirin)')
    expect(aspirin.byproduct).toContain('CH₃COOH')

    const acylCl = esterificationOutcome('ethanol', 'acyl-chloride', true)
    expect(acylCl.catalystOrBase).toContain('Pyridine')
    expect(acylCl.byproduct).toContain('HCl')
  })
})
