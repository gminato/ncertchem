import { describe, expect, it } from 'vitest'
import { LAB_LIGANDS, MIN_PAIRING_ENERGY, computeCftLabSnapshot } from './cft-lab'

describe('cft-lab model', () => {
  it('lists all 15 NCERT spectrochemical ligands with strictly rising illustrative Δo', () => {
    expect(LAB_LIGANDS).toHaveLength(15)
    expect(LAB_LIGANDS[0].display).toBe('I⁻')
    expect(LAB_LIGANDS[14].display).toBe('CO')
    for (let i = 1; i < LAB_LIGANDS.length; i++) {
      expect(LAB_LIGANDS[i].illustrativeDeltaO).toBeGreaterThan(LAB_LIGANDS[i - 1].illustrativeDeltaO)
    }
  })

  it('switches octahedral d4 between high spin and low spin as Δo crosses P', () => {
    const weak = computeCftLabSnapshot(4, 'octahedral', 0, 210) // I⁻ (Δo=85 < 210)
    expect(weak.field).toBe('weak')
    expect(weak.lowerElectrons).toBe(3)
    expect(weak.upperElectrons).toBe(1)
    expect(weak.unpaired).toBe(4)
    expect(weak.spinSummary).toContain('High spin')

    const strong = computeCftLabSnapshot(4, 'octahedral', 13, 210) // CN⁻ (Δo=320 > 210)
    expect(strong.field).toBe('strong')
    expect(strong.lowerElectrons).toBe(4)
    expect(strong.upperElectrons).toBe(0)
    expect(strong.unpaired).toBe(2)
    expect(strong.spinSummary).toContain('Low spin')
  })

  it('reports no spin choice for d1-d3 and d8-d10 in octahedral geometry', () => {
    expect(computeCftLabSnapshot(3, 'octahedral', 13, 210).spinSummary).toBe('No choice for this d count')
    expect(computeCftLabSnapshot(8, 'octahedral', 0, 210).spinSummary).toBe('No choice for this d count')
  })

  it('inverts levels and scales Δt = (4/9) Δo in tetrahedral geometry', () => {
    const tet = computeCftLabSnapshot(6, 'tetrahedral', 13, 210) // CN⁻ Δo=320 -> Δt=142
    expect(tet.lowerLabel).toBe('e')
    expect(tet.upperLabel).toBe('t₂')
    expect(tet.lowerSlots).toBe(2)
    expect(tet.upperSlots).toBe(3)
    expect(tet.deltaActive).toBe(Math.round((4 / 9) * 320))
    expect(tet.lowerElectrons).toBe(3)
    expect(tet.upperElectrons).toBe(3)
    expect(tet.unpaired).toBe(4)
    expect(tet.spinSummary).toContain('low spin rarely observed')
  })

  it('keeps Δt < P and cheaperRoute === "gap" for all ligands at MIN_PAIRING_ENERGY in tetrahedral geometry', () => {
    for (let i = 0; i < LAB_LIGANDS.length; i++) {
      const tet = computeCftLabSnapshot(4, 'tetrahedral', i, MIN_PAIRING_ENERGY)
      expect(tet.deltaActive).toBeLessThan(tet.pairingEnergy)
      expect(tet.cheaperRoute).toBe('gap')
      expect(tet.field).toBe('weak')
    }
  })
})
