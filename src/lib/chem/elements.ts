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
  Ag: { symbol: 'Ag', name: 'Silver', atomicNumber: 47, atomicMass: 107.87 },
}
