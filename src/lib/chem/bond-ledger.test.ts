import { describe, expect, it } from 'vitest'
import {
  LEDGER_REACTIONS,
  bondCounts,
  bondEnergy,
  formationReactionEnthalpy,
  ledgerEstimate,
  ledgerEvents,
  ledgerMolecule,
  ledgerTotalsAt,
  moleculeBondTotal,
} from './bond-ledger'

function reactionById(id: string) {
  const reaction = LEDGER_REACTIONS.find((r) => r.id === id)
  if (!reaction) throw new Error(`no reaction ${id}`)
  return reaction
}

describe('bond totals of molecules (Table 5.3)', () => {
  it('H2 has one H–H bond of 435.8 kJ mol⁻¹', () => {
    expect(moleculeBondTotal(ledgerMolecule('H2'))).toBeCloseTo(435.8, 6)
  })

  it('CH4 has four C–H bonds of 414 kJ mol⁻¹ each, 1656 in all', () => {
    expect(moleculeBondTotal(ledgerMolecule('CH4'))).toBeCloseTo(1656, 6)
  })

  it('O2 uses the double-bond value from Table 5.3(b), 498 kJ mol⁻¹', () => {
    expect(bondEnergy(ledgerMolecule('O2'), ledgerMolecule('O2').bonds[0])).toBe(498)
  })

  it('N2 uses the triple-bond value, 946 kJ mol⁻¹', () => {
    expect(moleculeBondTotal(ledgerMolecule('N2'))).toBe(946)
  })

  it('bond counts of CO2 are two C=O double bonds', () => {
    expect(bondCounts(ledgerMolecule('CO2'))).toEqual([{ a: 'C', b: 'O', order: 2, count: 2 }])
  })

  it('C2H6 has one C–C bond and six C–H bonds', () => {
    const counts = bondCounts(ledgerMolecule('C2H6'))
    expect(counts.find((c) => c.a === 'C' && c.b === 'C')?.count).toBe(1)
    expect(counts.find((c) => c.a === 'C' && c.b === 'H')?.count).toBe(6)
  })
})

describe('bond-enthalpy estimate against Table 5.2 (equation 5.17)', () => {
  it('CH4 + 2O2 → CO2 + 2H2O: estimate −686 kJ mol⁻¹, Table 5.2 −802.34 kJ mol⁻¹', () => {
    const r = reactionById('ch4-o2')
    expect(ledgerEstimate(r).brokenKJ).toBeCloseTo(2652, 6)
    expect(ledgerEstimate(r).formedKJ).toBeCloseTo(3338, 6)
    expect(ledgerEstimate(r).deltaHKJ).toBeCloseTo(-686, 6)
    expect(formationReactionEnthalpy(r)).toBeCloseTo(-802.34, 2)
  })

  it('H2 + Cl2 → 2HCl: estimate −183.2 kJ mol⁻¹, Table 5.2 −184.62 kJ mol⁻¹', () => {
    const r = reactionById('h2-cl2')
    expect(ledgerEstimate(r).deltaHKJ).toBeCloseTo(-183.2, 6)
    expect(formationReactionEnthalpy(r)).toBeCloseTo(-184.62, 2)
  })

  it('C2H4 + H2 → C2H6: estimate −128.2 kJ mol⁻¹, Table 5.2 −136.94 kJ mol⁻¹', () => {
    const r = reactionById('c2h4-h2')
    expect(ledgerEstimate(r).deltaHKJ).toBeCloseTo(-128.2, 6)
    expect(formationReactionEnthalpy(r)).toBeCloseTo(-136.94, 2)
  })

  it('N2 + 3H2 → 2NH3: estimate −80.6 kJ mol⁻¹, Table 5.2 −92.22 kJ mol⁻¹', () => {
    const r = reactionById('n2-h2')
    expect(ledgerEstimate(r).deltaHKJ).toBeCloseTo(-80.6, 6)
    expect(formationReactionEnthalpy(r)).toBeCloseTo(-92.22, 2)
  })

  it('every reaction has a finite estimate within 20 kJ mol⁻¹ of the Table 5.2 value except CH4 + 2O2', () => {
    for (const r of LEDGER_REACTIONS) {
      const gap = Math.abs(ledgerEstimate(r).deltaHKJ - formationReactionEnthalpy(r))
      if (r.id === 'ch4-o2') expect(gap).toBeGreaterThan(100)
      else expect(gap).toBeLessThan(20)
    }
  })
})

describe('the ledger events', () => {
  it('CH4 + 2O2 has 6 breaking events and 6 forming events, 12 in all', () => {
    const events = ledgerEvents(reactionById('ch4-o2'))
    expect(events).toHaveLength(12)
    expect(events.filter((e) => e.phase === 'break')).toHaveLength(6)
    expect(events.filter((e) => e.phase === 'form')).toHaveLength(6)
  })

  it('breaking events come before forming events', () => {
    const events = ledgerEvents(reactionById('n2-h2'))
    const firstForm = events.findIndex((e) => e.phase === 'form')
    expect(events.slice(firstForm).every((e) => e.phase === 'form')).toBe(true)
  })

  it('the totals after every event end on the estimate', () => {
    for (const r of LEDGER_REACTIONS) {
      const events = ledgerEvents(r)
      expect(ledgerTotalsAt(events, events.length).netKJ).toBeCloseTo(ledgerEstimate(r).deltaHKJ, 6)
    }
  })

  it('the running totals never exceed the final sums', () => {
    const r = reactionById('ch4-o2')
    const events = ledgerEvents(r)
    const final = ledgerEstimate(r)
    for (let k = 0; k <= events.length; k++) {
      const t = ledgerTotalsAt(events, k)
      expect(t.brokenKJ).toBeLessThanOrEqual(final.brokenKJ + 1e-9)
      expect(t.formedKJ).toBeLessThanOrEqual(final.formedKJ + 1e-9)
    }
  })

  it('an index outside the events is clamped', () => {
    const events = ledgerEvents(reactionById('h2-cl2'))
    expect(ledgerTotalsAt(events, -3).brokenCount).toBe(0)
    expect(ledgerTotalsAt(events, 99).formedCount).toBe(2)
  })
})
