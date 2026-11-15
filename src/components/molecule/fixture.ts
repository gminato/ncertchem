/**
 * Demo data for the molecule components, taken from the chemistry libraries:
 * geometry from vsepr.ts, Lewis structures from lewis.ts, MO fillings from
 * molecular-orbitals.ts and the bond enthalpy from ncert-unit4-tables.ts.
 */

import { vseprPositions, type Vec3 as LibVec3 } from '../../lib/chem/vsepr'
import { LEWIS_STRUCTURES, formalChargesOf } from '../../lib/chem/lewis'
import { summariseSpecies, type MOOccupancy } from '../../lib/chem/molecular-orbitals'
import { NCERT_TEXT_ENTHALPIES } from '../../lib/chem/ncert-unit4-tables'
import { atomPositionMap, type Molecule3DData } from './molecule-data'
import type { LewisAtom, LewisBracket, LewisTransfer } from './LewisDiagram'
import type { LewisBondSpec } from './lewis-geometry'
import type { Vec3 } from './geometry'

const DEG = Math.PI / 180

/**
 * The library puts the axial direction on z and the equatorial plane on xy. The 3D stage
 * is y-up, so the axes are permuted to (-x, z, y): axial along y, and the lone pair of
 * the see-saw on the left.
 */
function toScene(v: LibVec3): Vec3 {
  return [-v[0], v[2], v[1]]
}

/** The bond enthalpy of H–H from the NCERT table, in kJ mol⁻¹ (435.8). */
export const H2_BOND_ENTHALPY = (() => {
  const row = NCERT_TEXT_ENTHALPIES.find((q) => q.label.startsWith('H–H bond enthalpy'))
  if (!row) throw new Error('H–H bond enthalpy missing from NCERT tables')
  return row.value
})()

/** H2O: bent at 104.5° (the NCERT angle), with the two lone pairs on the open side. */
export const WATER_3D: Molecule3DData = (() => {
  const half = (104.5 / 2) * DEG
  const lp = 54.75 * DEG
  return {
    atoms: [
      { id: 'O', element: 'O', position: [0, 0, 0] },
      { id: 'H1', element: 'H', position: [-Math.sin(half), -Math.cos(half), 0] },
      { id: 'H2', element: 'H', position: [Math.sin(half), -Math.cos(half), 0] },
    ],
    bonds: [
      { a: 'O', b: 'H1', order: 1 },
      { a: 'O', b: 'H2', order: 1 },
    ],
    lonePairs: [
      { atom: 'O', direction: [0, Math.cos(lp), Math.sin(lp)] },
      { atom: 'O', direction: [0, Math.cos(lp), -Math.sin(lp)] },
    ],
    angleArcs: [{ a: 'H1', centre: 'O', b: 'H2', label: '104.5°' }],
  }
})()

/** CH4: tetrahedral from the VSEPR positions; every H–C–H angle 109.5°. */
export const METHANE_3D: Molecule3DData = (() => {
  const { bonds } = vseprPositions(4, 0)
  return {
    atoms: [
      { id: 'C', element: 'C', position: [0, 0, 0] },
      ...bonds.map((b, i) => ({ id: `H${i + 1}`, element: 'H', position: toScene(b) })),
    ],
    bonds: bonds.map((_b, i) => ({ a: 'C', b: `H${i + 1}`, order: 1 as const })),
    angleArcs: [{ a: 'H1', centre: 'C', b: 'H2', label: '109.5°' }],
  }
})()

/**
 * SF4: a see-saw from the VSEPR positions for AB4E. The axial fluorines are vertical, the
 * lone pair is equatorial on the left, and the two equatorial fluorines spread to the right.
 */
export const SF4_3D: Molecule3DData = (() => {
  const { bonds, lonePairs } = vseprPositions(4, 1)
  const names = ['Fa', 'Fb', 'Fc', 'Fd']
  const sceneBonds = bonds.map(toScene)
  // Equatorial fluorines are the two that are not on the y axis, and they sit either side of the
  // lone pair. Order them so that the upper one comes first, which keeps the arc label placement fixed.
  const order = [...sceneBonds.keys()].sort((i, j) => Math.abs(sceneBonds[j][1]) - Math.abs(sceneBonds[i][1]))
  return {
    atoms: [
      { id: 'S', element: 'S', position: [0, 0, 0] },
      ...order.map((idx, i) => ({ id: names[i], element: 'F', position: sceneBonds[idx] })),
    ],
    bonds: names.map((id) => ({ a: 'S', b: id, order: 1 as const })),
    lonePairs: lonePairs.map((lp) => ({ atom: 'S', direction: toScene(lp) })),
    angleArcs: [{ a: 'Fc', centre: 'S', b: 'Fd', label: '120°' }],
  }
})()

/**
 * Camera direction for the SF4 see-saw: down the axis that bisects the equatorial F–S–F angle,
 * from the lone-pair side and slightly above, so the lone pair faces the viewer and the two
 * axial fluorines sit top and bottom.
 */
export const SF4_VIEW: Vec3 = (() => {
  const p = atomPositionMap(SF4_3D.atoms)
  const fc = p.get('Fc')!
  const fd = p.get('Fd')!
  const sx = fc[0] + fd[0]
  const sz = fc[2] + fd[2]
  const len = Math.hypot(sx, sz) || 1
  // Turn the view 40° about the vertical axis so the lone pair sits to one side of the centre
  // rather than straight at the viewer, where it would hide behind the sulphur.
  const vx = -sx / len
  const vz = -sz / len
  const a = (40 * Math.PI) / 180
  return [vx * Math.cos(a) + vz * Math.sin(a), 0.45, -vx * Math.sin(a) + vz * Math.cos(a)]
})()

/** Lewis structure of CO₃²⁻ from the NCERT library, drawn at a larger scale with formal charges. */
export const CO3_LEWIS: { atoms: LewisAtom[]; bonds: LewisBondSpec[]; brackets: LewisBracket[] } = (() => {
  const s = LEWIS_STRUCTURES['CO3²⁻']
  const charges = formalChargesOf(s)
  const ids = s.atoms.map((_a, i) => `${s.atoms[i].element}${i}`)
  const scale = 58
  // Shift the library's layout so the carbon sits at the origin with the carbonyl oxygen up.
  const cx = s.atoms[0].x
  const cy = s.atoms[0].y
  return {
    atoms: s.atoms.map((a, i) => ({
      id: ids[i],
      element: a.element,
      x: (a.x - cx) * scale,
      y: (cy - a.y) * scale * 1.0,
      lonePairs: a.lonePairs,
      unpaired: a.unpairedElectrons,
      formalCharge: charges[i],
    })),
    bonds: s.bonds.map((b) => ({ a: ids[b.a], b: ids[b.b], order: b.order })),
    brackets: [{ atoms: ids, charge: '2−' }],
  }
})()

/** Sodium before the transfer: each atom has one electron to give or share. */
export const NACL_BEFORE: { atoms: LewisAtom[] } = {
  atoms: [
    { id: 'Na', element: 'Na', x: -92, y: 0, unpaired: 1 },
    { id: 'Cl', element: 'Cl', x: 92, y: 0, lonePairs: 3, unpaired: 1 },
  ],
}

/** Sodium chloride after the transfer: Na⁺ and [:Cl:]⁻ with an octet on chlorine. */
export const NACL_AFTER: { atoms: LewisAtom[]; brackets: LewisBracket[] } = {
  atoms: [
    { id: 'Na', element: 'Na', x: -56, y: 0, ionCharge: '+' },
    { id: 'Cl', element: 'Cl', x: 56, y: 0, lonePairs: 4, pairOrigins: [null, null, null, 'Na'] },
  ],
  brackets: [{ atoms: ['Cl'], charge: '−' }],
}

export const NACL_TRANSFER: LewisTransfer = { from: 'Na', to: 'Cl' }

/** Molecular orbital fillings for O₂ and N₂, from the library. */
export const O2_LEVELS: MOOccupancy[] = summariseSpecies('O₂').levels
export const N2_LEVELS: MOOccupancy[] = summariseSpecies('N₂').levels
