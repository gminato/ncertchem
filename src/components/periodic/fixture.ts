import type { ElementRecord, TablePosition } from './types'

/**
 * A small local fixture for the vocabulary demo and tests. The real data
 * replaces this on merge. Values are rounded, textbook-level approximations.
 */
export const FIXTURE_ELEMENTS: readonly ElementRecord[] = [
  { Z: 1, symbol: 'H', name: 'Hydrogen', atomicMass: 1.008, group: 1, period: 1, block: 's', category: 'non-metal', electronegativity: 2.2, firstIonizationEnergyEv: 13.6, electronAffinity: 0.75, atomicRadius: 37 },
  { Z: 2, symbol: 'He', name: 'Helium', atomicMass: 4.0026, group: 18, period: 1, block: 's', category: 'non-metal', electronegativity: null, firstIonizationEnergyEv: 24.6, electronAffinity: null, atomicRadius: 32 },
  { Z: 3, symbol: 'Li', name: 'Lithium', atomicMass: 6.94, group: 1, period: 2, block: 's', category: 'metal', electronegativity: 0.98, firstIonizationEnergyEv: 5.39, electronAffinity: 0.62, atomicRadius: 152 },
  { Z: 4, symbol: 'Be', name: 'Beryllium', atomicMass: 9.012, group: 2, period: 2, block: 's', category: 'metal', electronegativity: 1.57, firstIonizationEnergyEv: 9.32, electronAffinity: null, atomicRadius: 112 },
  { Z: 5, symbol: 'B', name: 'Boron', atomicMass: 10.81, group: 13, period: 2, block: 'p', category: 'metalloid', electronegativity: 2.04, firstIonizationEnergyEv: 8.3, electronAffinity: 0.28, atomicRadius: 85 },
  { Z: 6, symbol: 'C', name: 'Carbon', atomicMass: 12.011, group: 14, period: 2, block: 'p', category: 'non-metal', electronegativity: 2.55, firstIonizationEnergyEv: 11.26, electronAffinity: 1.26, atomicRadius: 77 },
  { Z: 7, symbol: 'N', name: 'Nitrogen', atomicMass: 14.007, group: 15, period: 2, block: 'p', category: 'non-metal', electronegativity: 3.04, firstIonizationEnergyEv: 14.53, electronAffinity: -0.07, atomicRadius: 75 },
  { Z: 8, symbol: 'O', name: 'Oxygen', atomicMass: 15.999, group: 16, period: 2, block: 'p', category: 'non-metal', electronegativity: 3.44, firstIonizationEnergyEv: 13.62, electronAffinity: 1.46, atomicRadius: 73 },
  { Z: 9, symbol: 'F', name: 'Fluorine', atomicMass: 18.998, group: 17, period: 2, block: 'p', category: 'non-metal', electronegativity: 3.98, firstIonizationEnergyEv: 17.42, electronAffinity: 3.4, atomicRadius: 71 },
  { Z: 10, symbol: 'Ne', name: 'Neon', atomicMass: 20.18, group: 18, period: 2, block: 'p', category: 'non-metal', electronegativity: null, firstIonizationEnergyEv: 21.56, electronAffinity: null, atomicRadius: 69 },
  { Z: 11, symbol: 'Na', name: 'Sodium', atomicMass: 22.99, group: 1, period: 3, block: 's', category: 'metal', electronegativity: 0.93, firstIonizationEnergyEv: 5.14, electronAffinity: 0.55, atomicRadius: 186 },
  { Z: 12, symbol: 'Mg', name: 'Magnesium', atomicMass: 24.305, group: 2, period: 3, block: 's', category: 'metal', electronegativity: 1.31, firstIonizationEnergyEv: 7.65, electronAffinity: null, atomicRadius: 160 },
  { Z: 13, symbol: 'Al', name: 'Aluminium', atomicMass: 26.982, group: 13, period: 3, block: 'p', category: 'metal', electronegativity: 1.61, firstIonizationEnergyEv: 5.99, electronAffinity: 0.43, atomicRadius: 143 },
  { Z: 14, symbol: 'Si', name: 'Silicon', atomicMass: 28.085, group: 14, period: 3, block: 'p', category: 'metalloid', electronegativity: 1.9, firstIonizationEnergyEv: 8.15, electronAffinity: 1.39, atomicRadius: 118 },
  { Z: 15, symbol: 'P', name: 'Phosphorus', atomicMass: 30.974, group: 15, period: 3, block: 'p', category: 'non-metal', electronegativity: 2.19, firstIonizationEnergyEv: 10.49, electronAffinity: 0.75, atomicRadius: 110 },
  { Z: 16, symbol: 'S', name: 'Sulfur', atomicMass: 32.06, group: 16, period: 3, block: 'p', category: 'non-metal', electronegativity: 2.58, firstIonizationEnergyEv: 10.36, electronAffinity: 2.08, atomicRadius: 103 },
  { Z: 17, symbol: 'Cl', name: 'Chlorine', atomicMass: 35.45, group: 17, period: 3, block: 'p', category: 'non-metal', electronegativity: 3.16, firstIonizationEnergyEv: 12.97, electronAffinity: 3.61, atomicRadius: 99 },
  { Z: 18, symbol: 'Ar', name: 'Argon', atomicMass: 39.948, group: 18, period: 3, block: 'p', category: 'non-metal', electronegativity: null, firstIonizationEnergyEv: 15.76, electronAffinity: null, atomicRadius: 97 },
  { Z: 19, symbol: 'K', name: 'Potassium', atomicMass: 39.098, group: 1, period: 4, block: 's', category: 'metal', electronegativity: 0.82, firstIonizationEnergyEv: 4.34, electronAffinity: 0.5, atomicRadius: 227 },
  { Z: 20, symbol: 'Ca', name: 'Calcium', atomicMass: 40.078, group: 2, period: 4, block: 's', category: 'metal', electronegativity: 1.0, firstIonizationEnergyEv: 6.11, electronAffinity: 0.02, atomicRadius: 197 },
  { Z: 58, symbol: 'Ce', name: 'Cerium', atomicMass: 140.12, group: null, period: 6, block: 'f', category: 'metal', electronegativity: 1.12, firstIonizationEnergyEv: 5.54, electronAffinity: null, atomicRadius: 185 },
]

/** Table position for the fixture elements. Only the elements above are placed. */
const FIXTURE_POSITIONS: Readonly<Record<number, TablePosition>> = {
  1: { row: 1, col: 1 },
  2: { row: 1, col: 18 },
  3: { row: 2, col: 1 },
  4: { row: 2, col: 2 },
  5: { row: 2, col: 13 },
  6: { row: 2, col: 14 },
  7: { row: 2, col: 15 },
  8: { row: 2, col: 16 },
  9: { row: 2, col: 17 },
  10: { row: 2, col: 18 },
  11: { row: 3, col: 1 },
  12: { row: 3, col: 2 },
  13: { row: 3, col: 13 },
  14: { row: 3, col: 14 },
  15: { row: 3, col: 15 },
  16: { row: 3, col: 16 },
  17: { row: 3, col: 17 },
  18: { row: 3, col: 18 },
  19: { row: 4, col: 1 },
  20: { row: 4, col: 2 },
  58: { row: 9, col: 4 },
}

/** Position function for the fixture. Unknown Z values fall back to an off-grid cell. */
export function fixturePosition(Z: number): TablePosition {
  return FIXTURE_POSITIONS[Z] ?? { row: 0, col: 0 }
}
