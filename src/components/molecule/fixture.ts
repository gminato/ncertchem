/**
 * Local demo data for the molecule components. The vocabulary page and the tests
 * use these; the real chemistry data is wired in later from src/lib/chem.
 */

import type { Molecule3DData } from './molecule-data'
import type { LewisAtom, LewisBracket, LewisTransfer } from './LewisDiagram'
import type { LewisBondSpec } from './lewis-geometry'
import type { MOElectrons } from './mo-levels'
import type { Vec3 } from './geometry'

const DEG = Math.PI / 180

/** H2O: bent at 104.5°, with the two lone pairs on the open side (tetrahedral-like). */
export const WATER_3D: Molecule3DData = (() => {
  const half = (104.5 / 2) * DEG
  const h1: Vec3 = [-Math.sin(half), -Math.cos(half), 0]
  const h2: Vec3 = [Math.sin(half), -Math.cos(half), 0]
  const lp = 54.75 * DEG
  return {
    atoms: [
      { id: 'O', element: 'O', position: [0, 0, 0] },
      { id: 'H1', element: 'H', position: h1 },
      { id: 'H2', element: 'H', position: h2 },
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

/** CH4: tetrahedral, every H–C–H angle 109.5°. */
export const METHANE_3D: Molecule3DData = (() => {
  const t = 1 / Math.sqrt(3)
  return {
    atoms: [
      { id: 'C', element: 'C', position: [0, 0, 0] },
      { id: 'H1', element: 'H', position: [t, t, t] },
      { id: 'H2', element: 'H', position: [t, -t, -t] },
      { id: 'H3', element: 'H', position: [-t, t, -t] },
      { id: 'H4', element: 'H', position: [-t, -t, t] },
    ],
    bonds: [
      { a: 'C', b: 'H1', order: 1 },
      { a: 'C', b: 'H2', order: 1 },
      { a: 'C', b: 'H3', order: 1 },
      { a: 'C', b: 'H4', order: 1 },
    ],
    angleArcs: [{ a: 'H1', centre: 'C', b: 'H2', label: '109.5°' }],
  }
})()

/**
 * SF4: trigonal bipyramid with one equatorial lone pair (see-saw). The axial
 * fluorines are on the y axis and the equatorial ones in the xz plane, squeezed
 * towards each other by the lone pair.
 */
export const SF4_3D: Molecule3DData = (() => {
  const eq = 50 * DEG
  return {
    atoms: [
      { id: 'S', element: 'S', position: [0, 0, 0] },
      { id: 'Fa', element: 'F', position: [0, 1, 0] },
      { id: 'Fb', element: 'F', position: [0, -1, 0] },
      { id: 'Fc', element: 'F', position: [Math.cos(eq), 0, -Math.sin(eq)] },
      { id: 'Fd', element: 'F', position: [Math.cos(eq), 0, Math.sin(eq)] },
    ],
    bonds: [
      { a: 'S', b: 'Fa', order: 1 },
      { a: 'S', b: 'Fb', order: 1 },
      { a: 'S', b: 'Fc', order: 1 },
      { a: 'S', b: 'Fd', order: 1 },
    ],
    lonePairs: [{ atom: 'S', direction: [-1, 0, 0] }],
    angleArcs: [{ a: 'Fc', centre: 'S', b: 'Fd', label: '≈102°' }],
  }
})()

/** Lewis structure of CO₃²⁻: one C=O and two C–O⁻, with formal charges and octets. */
export const CO3_LEWIS: { atoms: LewisAtom[]; bonds: LewisBondSpec[]; brackets: LewisBracket[] } = {
  atoms: [
    { id: 'C', element: 'C', x: 0, y: 0, formalCharge: 0 },
    { id: 'Od', element: 'O', x: 0, y: -54, lonePairs: 2, formalCharge: 0 },
    { id: 'Oa', element: 'O', x: -47, y: 27, lonePairs: 3, formalCharge: -1 },
    { id: 'Ob', element: 'O', x: 47, y: 27, lonePairs: 3, formalCharge: -1 },
  ],
  bonds: [
    { a: 'C', b: 'Od', order: 2 },
    { a: 'C', b: 'Oa', order: 1 },
    { a: 'C', b: 'Ob', order: 1 },
  ],
  brackets: [{ atoms: ['C', 'Od', 'Oa', 'Ob'], charge: '2−' }],
}

/** Sodium before the transfer: each atom has one electron to give or share. */
export const NACL_BEFORE: { atoms: LewisAtom[] } = {
  atoms: [
    { id: 'Na', element: 'Na', x: -70, y: 0, unpaired: 1 },
    { id: 'Cl', element: 'Cl', x: 70, y: 0, lonePairs: 3, unpaired: 1 },
  ],
}

/** Sodium chloride after the transfer: Na⁺ and [:Cl:]⁻ with an octet on chlorine. */
export const NACL_AFTER: { atoms: LewisAtom[]; brackets: LewisBracket[] } = {
  atoms: [
    { id: 'Na', element: 'Na', x: -40, y: 0, ionCharge: '+' },
    { id: 'Cl', element: 'Cl', x: 40, y: 0, lonePairs: 4, pairOrigins: [null, null, null, 'Na'] },
  ],
  brackets: [{ atoms: ['Cl'], charge: '−' }],
}

export const NACL_TRANSFER: LewisTransfer = { from: 'Na', to: 'Cl' }

/** Molecular orbital occupations for O₂ (unmixed order): bond order 2, paramagnetic. */
export const O2_ELECTRONS: MOElectrons = {
  's1s': 2,
  's*1s': 2,
  's2s': 2,
  's*2s': 2,
  's2p': 2,
  'p2p': 4,
  'p*2p': 2,
}

/** Molecular orbital occupations for N₂ (mixed order): bond order 3, diamagnetic. */
export const N2_ELECTRONS: MOElectrons = {
  's1s': 2,
  's*1s': 2,
  's2s': 2,
  's*2s': 2,
  'p2p': 4,
  's2p': 2,
}
