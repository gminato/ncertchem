import { describe, expect, it } from 'vitest'
import {
  NCERT_COUNTER_IONS,
  NCERT_LIGANDS,
  NCERT_METAL_NAMES,
  NCERT_METAL_OXIDATION_STATES,
  ligandSegment,
  metalOxidationState,
  romanNumeral,
} from './ncert-c12-unit5-s3-tables'

const L = (f: string) => NCERT_LIGANDS.find((l) => l.formula === f)!

describe('Unit 5 section 5.3 tables', () => {
  it('uses the four special neutral names', () => {
    expect(L('H2O').name).toBe('aqua')
    expect(L('NH3').name).toBe('ammine')
    expect(L('CO').name).toBe('carbonyl')
    expect(L('NO').name).toBe('nitrosyl')
  })

  it('ends every anionic ligand name in -o (with optional donor-atom suffix)', () => {
    for (const l of NCERT_LIGANDS.filter((x) => x.charge < 0)) {
      expect(l.name.endsWith('o') || /o-[A-Z]$/.test(l.name)).toBe(true)
    }
  })

  it('marks didentate and polyatomic ligands accurately', () => {
    expect(L('en').denticity).toBe(2)
    expect(L('C2O4').denticity).toBe(2)
    expect(L('Cl').polyatomic).toBe(false)
    expect(L('Br').polyatomic).toBe(false)
    expect(L('NH3').polyatomic).toBe(true)
    expect(L('en').polyatomic).toBe(true)
  })

  it('gives Latin anion stems for iron, silver and copper', () => {
    expect(NCERT_METAL_NAMES.Fe.anion).toBe('ferrate')
    expect(NCERT_METAL_NAMES.Ag.anion).toBe('argentate')
    expect(NCERT_METAL_NAMES.Cu.anion).toBe('cuprate')
  })

  it('provides oxidation states and counter ions for the complex namer', () => {
    expect(NCERT_METAL_OXIDATION_STATES.Ni).toContain(0)
    expect(NCERT_METAL_OXIDATION_STATES.Co).toContain(3)
    expect(NCERT_COUNTER_IONS.find((c) => c.formula === 'SO4')?.name).toBe('sulphate')
  })

  it('finds oxidation states by charge balance', () => {
    expect(metalOxidationState(-4, [{ ligand: L('CN'), count: 6 }])).toBe(2)
    expect(metalOxidationState(3, [{ ligand: L('NH3'), count: 3 }, { ligand: L('H2O'), count: 3 }])).toBe(3)
    expect(metalOxidationState(0, [{ ligand: L('CO'), count: 4 }])).toBe(0)
    expect(romanNumeral(3)).toBe('III')
    expect(romanNumeral(0)).toBe('0')
  })

  it('sorts ligands alphabetically ignoring prefixes', () => {
    expect(ligandSegment([{ ligand: L('Cl'), count: 2 }, { ligand: L('NH3'), count: 4 }])).toBe('tetraammine' + 'dichlorido')
    expect(ligandSegment([{ ligand: L('en'), count: 2 }, { ligand: L('Cl'), count: 2 }])).toBe('dichloridobis(ethane-1,2-diamine)')
    expect(ligandSegment([{ ligand: L('Br'), count: 1 }, { ligand: L('NH3'), count: 5 }])).toBe('pentaamminebromido')
  })
})
