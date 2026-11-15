import { describe, expect, it } from 'vitest'
import { ladderBounds } from './LaneLadder'
import { buildLadderModel, formatOn, markerLabel, superscriptCharge, toUnicodeFormula } from './ladder-model'
import { parseSpeciesToken } from '@/lib/chem/redox-analysis'

describe('ladder-model formatting', () => {
  it('subscripts formulas and signs charges', () => {
    expect(toUnicodeFormula('KClO3')).toBe('KClO₃')
    expect(superscriptCharge(2)).toBe('²⁺')
    expect(superscriptCharge(-1)).toBe('⁻')
    expect(formatOn(-2)).toBe('−2')
    expect(formatOn(2)).toBe('+2')
    expect(formatOn(0)).toBe('0')
  })

  it('labels markers with the species they belong to', () => {
    const label = (token: string, element: string, on: number) =>
      markerLabel(parseSpeciesToken(token), element, on)
    expect(label('Mg(s)', 'Mg', 0)).toBe('Mg')
    expect(label('O2(g)', 'O', 0)).toBe('O₂')
    expect(label('MgO(s)', 'Mg', 2)).toBe('Mg²⁺ in MgO')
    expect(label('MgO(s)', 'O', -2)).toBe('O²⁻ in MgO')
    expect(label('KClO3(s)', 'Cl', 5)).toBe('Cl in KClO₃')
    expect(label('KCl(s)', 'Cl', -1)).toBe('Cl⁻ in KCl')
    expect(label('Cl-(aq)', 'Cl', -1)).toBe('Cl⁻')
    expect(label('ClO-(aq)', 'Cl', 1)).toBe('Cl in ClO⁻')
    expect(label('H2O2(aq)', 'O', -1)).toBe('O in H₂O₂')
  })
})

describe('buildLadderModel', () => {
  it('returns null for a reaction that is not redox', () => {
    expect(buildLadderModel('CaCO3(s) -> CaO(s) + CO2(g)')).toBeNull()
  })

  it('gives every changing element its own lane (combination)', () => {
    const model = buildLadderModel('2Mg(s) + O2(g) -> 2MgO(s)')!
    expect(model.laneCount).toBe(2)
    const byId = new Map(model.markers.map((m) => [m.id, m]))
    for (const arrow of model.arrows) {
      const from = byId.get(arrow.fromId)!
      const to = byId.get(arrow.toId)!
      expect(from.lane).toBe(to.lane)
    }
    const labels = model.markers.map((m) => m.label).sort()
    expect(labels).toEqual(['Mg', 'Mg²⁺ in MgO', 'O²⁻ in MgO', 'O₂'].sort())
    expect(model.arrows.map((a) => a.title).sort()).toEqual(['Oxidation', 'Reduction'])
  })

  it('uses the libraries for the decomposition ladder (Cl +5 to -1, O -2 to 0)', () => {
    const model = buildLadderModel('2KClO3(s) -> 2KCl(s) + 3O2(g)')!
    const cl = model.arrows.find((a) => a.detail.startsWith('Cl'))!
    expect(cl.detail).toBe('Cl: +5 → −1')
    expect(cl.tone).toBe('red')
    const o = model.arrows.find((a) => a.detail.startsWith('O:'))!
    expect(o.detail).toBe('O: −2 → 0')
    expect(o.tone).toBe('ox')
    expect(model.range[0]).toBeLessThanOrEqual(-2)
    expect(model.range[1]).toBeGreaterThanOrEqual(5)
  })

  it('draws disproportionation as one start marker and two arrows into separate lanes', () => {
    const model = buildLadderModel('Cl2(g) + 2OH-(aq) -> ClO-(aq) + Cl-(aq) + H2O(l)')!
    expect(model.laneCount).toBe(2)
    expect(model.arrows).toHaveLength(2)
    expect(model.arrows[0].fromId).toBe(model.arrows[1].fromId)
    const tones = model.arrows.map((a) => a.tone).sort()
    expect(tones).toEqual(['ox', 'red'])
    const lanesOfTargets = new Set(model.arrows.map((a) => model.markers.find((m) => m.id === a.toId)!.lane))
    expect(lanesOfTargets.size).toBe(1)
  })

  it('never puts two markers of one lane closer than one oxidation-number unit', () => {
    const equations = [
      '2Mg(s) + O2(g) -> 2MgO(s)',
      '2KClO3(s) -> 2KCl(s) + 3O2(g)',
      'Zn(s) + CuSO4(aq) -> ZnSO4(aq) + Cu(s)',
      'Cl2(g) + 2KBr(aq) -> 2KCl(aq) + Br2(l)',
      'Cl2(g) + 2OH-(aq) -> ClO-(aq) + Cl-(aq) + H2O(l)',
      'P4(s) + 3OH-(aq) + 3H2O(l) -> PH3(g) + 3H2PO2-(aq)',
    ]
    for (const eq of equations) {
      const model = buildLadderModel(eq)!
      for (let lane = 0; lane < model.laneCount; lane++) {
        const ons = model.markers.filter((m) => m.lane === lane).map((m) => m.on)
        for (let i = 0; i < ons.length; i++) {
          for (let j = i + 1; j < ons.length; j++) {
            expect(Math.abs(ons[i] - ons[j]), eq).toBeGreaterThanOrEqual(1)
          }
        }
      }
    }
  })
})

describe('ladderBounds', () => {
  it('adds headroom only for diagonal arrows', () => {
    const decomposition = buildLadderModel('2KClO3(s) -> 2KCl(s) + 3O2(g)')!
    expect(ladderBounds(decomposition)).toEqual([-2, 5])
    const disproportionation = buildLadderModel('Cl2(g) + 2OH-(aq) -> ClO-(aq) + Cl-(aq) + H2O(l)')!
    expect(ladderBounds(disproportionation)).toEqual([-2, 2])
    const nonMetal = buildLadderModel('Cl2(g) + 2KBr(aq) -> 2KCl(aq) + Br2(l)')!
    expect(ladderBounds(nonMetal)).toEqual([-1, 0])
  })
})
