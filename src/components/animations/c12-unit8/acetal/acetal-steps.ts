import { drawingFrame, type Bounds } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'

/** One viewBox for every Step, so the panel keeps its size as the reader scrolls. */
export const W = 580
export const H = 600

/** Pixels per bond length for the small and the large structures in the panel. */
export const SMALL = 52
export const LARGE = 60

export interface PlacedMolecule {
  /** Stable key inside its Step. */
  id: string
  smiles: string
  /** Molecular formula the drawing must carry (asserted in the unit test). */
  formula: string
  /** Centre of the drawing in viewBox units. */
  cx: number
  cy: number
  scale: number
}

/** Molecules drawn in each Step, in order. Step 6 is a text table and draws no structure. */
export const STEP_MOLECULES: readonly (readonly PlacedMolecule[])[] = [
  // 1. Dry HCl protonates the carbonyl oxygen.
  [
    { id: 'propanal', smiles: 'CCC=O', formula: 'C3H6O', cx: 210, cy: 170, scale: SMALL },
    { id: 'pro', smiles: 'CCC=[OH+]', formula: 'C3H7O+', cx: 210, cy: 400, scale: LARGE },
  ],
  // 2. Methanol adds; the oxonium ion loses H⁺ to give the hemiacetal.
  [
    { id: 'pro', smiles: 'CCC=[OH+]', formula: 'C3H7O+', cx: 150, cy: 120, scale: SMALL },
    { id: 'meoh', smiles: 'CO', formula: 'CH4O', cx: 400, cy: 200, scale: SMALL },
    { id: 'oxo', smiles: 'CCC(O)[OH+]C', formula: 'C4H11O2+', cx: 290, cy: 330, scale: LARGE },
    { id: 'hemi', smiles: 'CCC(O)OC', formula: 'C4H10O2', cx: 290, cy: 500, scale: SMALL },
  ],
  // 3. A second methanol gives the acetal and water.
  [
    { id: 'hemi', smiles: 'CCC(O)OC', formula: 'C4H10O2', cx: 150, cy: 150, scale: SMALL },
    { id: 'meoh', smiles: 'CO', formula: 'CH4O', cx: 380, cy: 150, scale: SMALL },
    { id: 'acetal', smiles: 'CCC(OC)OC', formula: 'C5H12O2', cx: 200, cy: 430, scale: LARGE },
    { id: 'water', smiles: 'O', formula: 'H2O', cx: 360, cy: 430, scale: SMALL },
  ],
  // 4. Butan-2-one with ethylene glycol gives the cyclic ketal and water.
  [
    { id: 'ketone', smiles: 'CCC(C)=O', formula: 'C4H8O', cx: 150, cy: 150, scale: SMALL },
    { id: 'glycol', smiles: 'OCCO', formula: 'C2H6O2', cx: 440, cy: 150, scale: SMALL },
    { id: 'ketal', smiles: 'CCC1(C)OCCO1', formula: 'C6H12O2', cx: 290, cy: 420, scale: LARGE },
    { id: 'water', smiles: 'O', formula: 'H2O', cx: 450, cy: 420, scale: SMALL },
  ],
  // 5. Ammonia adds to propanal; the intermediate loses water to give the imine.
  [
    { id: 'propanal', smiles: 'CCC=O', formula: 'C3H6O', cx: 150, cy: 150, scale: SMALL },
    { id: 'nh3', smiles: 'N', formula: 'H3N', cx: 440, cy: 150, scale: SMALL },
    { id: 'hemiaminal', smiles: 'CCC(O)N', formula: 'C3H9NO', cx: 290, cy: 320, scale: LARGE },
    { id: 'imine', smiles: 'CCC=N', formula: 'C3H7N', cx: 170, cy: 510, scale: SMALL },
    { id: 'water', smiles: 'O', formula: 'H2O', cx: 340, cy: 510, scale: SMALL },
  ],
  // 6. Table 8.2 family: drawn as a text table, see AcetalScrolly.
  [],
]

/** Viewbox bounds of a placed drawing, in viewBox units (label room included). */
export function placedBounds(p: PlacedMolecule): Bounds {
  const b = drawingFrame(parseSmiles(p.smiles), p.scale).bounds
  return { x: p.cx + b.x, y: p.cy + b.y, width: b.width, height: b.height }
}

/** Position of atom `index` of a placed drawing, in viewBox units. */
export function atomPoint(p: PlacedMolecule, index: number): { x: number; y: number } {
  const pt = drawingFrame(parseSmiles(p.smiles), p.scale).points[index]
  if (!pt) throw new Error(`No atom ${index} in ${p.smiles}`)
  return { x: p.cx + pt.x, y: p.cy + pt.y }
}
