/**
 * An entry in the element table. Atomic masses are the values NCERT Class 11
 * Unit 1 uses in its worked examples (in u, i.e. g mol⁻¹ numerically).
 */
export interface Element {
  symbol: string
  name: string
  atomicNumber: number
  atomicMass: number
}

/**
 * Elements used in NCERT Class 11 Unit 1 (Some Basic Concepts of Chemistry),
 * keyed by chemical symbol.
 */
export const ELEMENTS: Record<string, Element> = {
  H: { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, atomicMass: 1.008 },
  He: { symbol: 'He', name: 'Helium', atomicNumber: 2, atomicMass: 4.003 },
  C: { symbol: 'C', name: 'Carbon', atomicNumber: 6, atomicMass: 12.011 },
  N: { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, atomicMass: 14.007 },
  O: { symbol: 'O', name: 'Oxygen', atomicNumber: 8, atomicMass: 16.0 },
  F: { symbol: 'F', name: 'Fluorine', atomicNumber: 9, atomicMass: 19.0 },
  Na: { symbol: 'Na', name: 'Sodium', atomicNumber: 11, atomicMass: 23.0 },
  Mg: { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, atomicMass: 24.31 },
  Al: { symbol: 'Al', name: 'Aluminium', atomicNumber: 13, atomicMass: 26.98 },
  Si: { symbol: 'Si', name: 'Silicon', atomicNumber: 14, atomicMass: 28.09 },
  P: { symbol: 'P', name: 'Phosphorus', atomicNumber: 15, atomicMass: 30.97 },
  S: { symbol: 'S', name: 'Sulphur', atomicNumber: 16, atomicMass: 32.07 },
  Cl: { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, atomicMass: 35.5 },
  Ar: { symbol: 'Ar', name: 'Argon', atomicNumber: 18, atomicMass: 39.95 },
  K: { symbol: 'K', name: 'Potassium', atomicNumber: 19, atomicMass: 39.1 },
  Ca: { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, atomicMass: 40.08 },
  Fe: { symbol: 'Fe', name: 'Iron', atomicNumber: 26, atomicMass: 55.85 },
  Cu: { symbol: 'Cu', name: 'Copper', atomicNumber: 29, atomicMass: 63.55 },
  Zn: { symbol: 'Zn', name: 'Zinc', atomicNumber: 30, atomicMass: 65.38 },
  Li: { symbol: 'Li', name: 'Lithium', atomicNumber: 3, atomicMass: 6.94 },
  Be: { symbol: 'Be', name: 'Beryllium', atomicNumber: 4, atomicMass: 9.01 },
  B: { symbol: 'B', name: 'Boron', atomicNumber: 5, atomicMass: 10.81 },
  Ne: { symbol: 'Ne', name: 'Neon', atomicNumber: 10, atomicMass: 20.18 },
  Sc: { symbol: 'Sc', name: 'Scandium', atomicNumber: 21, atomicMass: 44.96 },
  Ti: { symbol: 'Ti', name: 'Titanium', atomicNumber: 22, atomicMass: 47.87 },
  V: { symbol: 'V', name: 'Vanadium', atomicNumber: 23, atomicMass: 50.94 },
  Cr: { symbol: 'Cr', name: 'Chromium', atomicNumber: 24, atomicMass: 52.0 },
  Mn: { symbol: 'Mn', name: 'Manganese', atomicNumber: 25, atomicMass: 54.94 },
  Co: { symbol: 'Co', name: 'Cobalt', atomicNumber: 27, atomicMass: 58.93 },
  Ni: { symbol: 'Ni', name: 'Nickel', atomicNumber: 28, atomicMass: 58.69 },
  Br: { symbol: 'Br', name: 'Bromine', atomicNumber: 35, atomicMass: 79.9 },
  Rb: { symbol: 'Rb', name: 'Rubidium', atomicNumber: 37, atomicMass: 85.47 },
  Sr: { symbol: 'Sr', name: 'Strontium', atomicNumber: 38, atomicMass: 87.62 },
  Ag: { symbol: 'Ag', name: 'Silver', atomicNumber: 47, atomicMass: 107.87 },
  Cd: { symbol: 'Cd', name: 'Cadmium', atomicNumber: 48, atomicMass: 112.41 },
  Sn: { symbol: 'Sn', name: 'Tin', atomicNumber: 50, atomicMass: 118.71 },
  I: { symbol: 'I', name: 'Iodine', atomicNumber: 53, atomicMass: 126.9 },
  Xe: { symbol: 'Xe', name: 'Xenon', atomicNumber: 54, atomicMass: 131.29 },
  Cs: { symbol: 'Cs', name: 'Caesium', atomicNumber: 55, atomicMass: 132.91 },
  Ba: { symbol: 'Ba', name: 'Barium', atomicNumber: 56, atomicMass: 137.33 },
  Pt: { symbol: 'Pt', name: 'Platinum', atomicNumber: 78, atomicMass: 195.08 },
  Au: { symbol: 'Au', name: 'Gold', atomicNumber: 79, atomicMass: 196.97 },
  Hg: { symbol: 'Hg', name: 'Mercury', atomicNumber: 80, atomicMass: 200.59 },
  Tl: { symbol: 'Tl', name: 'Thallium', atomicNumber: 81, atomicMass: 204.38 },
  Pb: { symbol: 'Pb', name: 'Lead', atomicNumber: 82, atomicMass: 207.2 },
}
