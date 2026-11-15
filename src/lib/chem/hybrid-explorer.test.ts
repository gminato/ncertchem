import { describe, expect, it } from 'vitest'
import {
  HYBRID_CENTRES,
  centreHybridisation,
  centreValenceElectrons,
  groundStateRows,
  hybridCentre,
  hybridLabel,
  hybridState,
  moleculeGeometry,
  promotedRows,
  promotionNeeded,
  sigmaPiCounts,
  unpairedIn,
} from './hybrid-explorer'

describe('ground state and promotion', () => {
  it('reads the carbon valence boxes of CH₄ from the ground state', () => {
    const rows = groundStateRows(hybridCentre('CH4'))
    expect(rows.map((r) => r.label)).toEqual(['2s', '2p'])
    expect(rows[0].boxes).toEqual([2])
    expect(rows[1].boxes).toEqual([1, 1, 0])
  })

  it('adds an empty 3d row for a third-period centre', () => {
    const rows = groundStateRows(hybridCentre('PCl5'))
    expect(rows.map((r) => r.label)).toEqual(['3s', '3p', '3d'])
    expect(rows[2].boxes).toEqual([0, 0, 0, 0, 0])
  })

  it('promotes carbon to four unpaired electrons and phosphorus to five', () => {
    expect(unpairedIn(promotedRows(hybridCentre('CH4')))).toBe(4)
    expect(unpairedIn(promotedRows(hybridCentre('PCl5')))).toBe(5)
    expect(unpairedIn(promotedRows(hybridCentre('SF6')))).toBe(6)
  })

  it('needs promotion for Be, B, C, P and S, but not for N or O in NH₃ and H₂O', () => {
    for (const id of ['BeCl2', 'BCl3', 'CH4', 'C2H4', 'C2H2', 'PCl5', 'SF6']) {
      expect(promotionNeeded(hybridCentre(id)), id).toBe(true)
    }
    expect(promotionNeeded(hybridCentre('NH3'))).toBe(false)
    expect(promotionNeeded(hybridCentre('H2O'))).toBe(false)
  })

  it('keeps the valence electron count in every promoted state', () => {
    for (const c of HYBRID_CENTRES) {
      const total = promotedRows(c).reduce((sum, r) => sum + r.boxes.reduce<number>((s, b) => s + b, 0), 0)
      expect(total, c.id).toBe(centreValenceElectrons(c))
    }
  })
})

describe('hybrid set', () => {
  it('gives the NCERT hybridisation for each centre', () => {
    const expected: Record<string, string> = {
      BeCl2: 'sp', BCl3: 'sp²', CH4: 'sp³', NH3: 'sp³', H2O: 'sp³',
      C2H4: 'sp²', C2H2: 'sp', PCl5: 'sp³d', SF6: 'sp³d²',
    }
    for (const [id, label] of Object.entries(expected)) {
      expect(hybridLabel(centreHybridisation(hybridCentre(id))), id).toBe(label)
    }
  })

  it('places one electron in each bonding hybrid and a pair in each lone-pair hybrid', () => {
    expect(hybridState(hybridCentre('NH3')).hybrids).toEqual([1, 1, 1, 2])
    expect(hybridState(hybridCentre('H2O')).hybrids).toEqual([1, 1, 2, 2])
  })

  it('leaves the π electrons in the unhybridised p orbitals of ethene and ethyne', () => {
    expect(hybridState(hybridCentre('C2H4')).leftoverP).toEqual([1])
    expect(hybridState(hybridCentre('C2H2')).leftoverP).toEqual([1, 1])
    expect(hybridState(hybridCentre('BeCl2')).leftoverP).toEqual([0, 0])
  })

  it('leaves d orbitals empty for sp³d and sp³d², and none for the lower hybrids', () => {
    expect(hybridState(hybridCentre('PCl5')).leftoverD).toHaveLength(4)
    expect(hybridState(hybridCentre('SF6')).leftoverD).toHaveLength(3)
    expect(hybridState(hybridCentre('CH4')).leftoverD).toHaveLength(0)
  })

  it('conserves the valence electrons across the hybrid set and leftover orbitals', () => {
    for (const c of HYBRID_CENTRES) {
      expect(hybridState(c).electrons, c.id).toBe(centreValenceElectrons(c))
    }
  })

  it('gives the σ and π counts of the whole molecule from NCERT Section 4.6', () => {
    expect(sigmaPiCounts(hybridCentre('C2H4'))).toEqual({ sigma: 5, pi: 1 })
    expect(sigmaPiCounts(hybridCentre('C2H2'))).toEqual({ sigma: 3, pi: 2 })
    expect(sigmaPiCounts(hybridCentre('CH4'))).toEqual({ sigma: 4, pi: 0 })
  })
})

describe('molecule geometry', () => {
  it('draws CH₄ with four bonds and no lone pairs, at tetrahedral angles', () => {
    const g = moleculeGeometry('CH4')
    expect(g.bonds).toHaveLength(4)
    expect(g.lonePairs).toHaveLength(0)
    const dirs = g.atoms.filter((a) => a.id !== 'C').map((a) => a.position)
    const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    const cosine = dot(dirs[0], dirs[1]) / (Math.hypot(...dirs[0]) * Math.hypot(...dirs[1]))
    expect((Math.acos(cosine) * 180) / Math.PI).toBeCloseTo(109.47, 0)
  })

  it('draws NH₃ with one lone pair and H₂O with two', () => {
    expect(moleculeGeometry('NH3').lonePairs).toHaveLength(1)
    expect(moleculeGeometry('H2O').lonePairs).toHaveLength(2)
  })

  it('draws ethene with a C=C double bond and H–C–C angles near 121°', () => {
    const g = moleculeGeometry('C2H4')
    expect(g.bonds.find((b) => b.a === 'C1' && b.b === 'C2')?.order).toBe(2)
    const pos = (id: string) => g.atoms.find((a) => a.id === id)!.position
    const c1 = pos('C1')
    const h1 = pos('H1')
    const c2 = pos('C2')
    const u = [h1[0] - c1[0], h1[1] - c1[1]]
    const v = [c2[0] - c1[0], c2[1] - c1[1]]
    const cosine = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))
    expect((Math.acos(cosine) * 180) / Math.PI).toBeCloseTo(121, 0)
  })

  it('draws ethyne as a straight triple bond', () => {
    const g = moleculeGeometry('C2H2')
    expect(g.bonds.find((b) => b.a === 'C1' && b.b === 'C2')?.order).toBe(3)
    expect(g.atoms.every((a) => Math.abs(a.position[1]) < 1e-9 && Math.abs(a.position[2]) < 1e-9)).toBe(true)
  })

  it('throws for an unknown centre', () => {
    expect(() => hybridCentre('XeO4')).toThrow(RangeError)
    expect(() => moleculeGeometry('XeO4')).toThrow(RangeError)
  })
})
