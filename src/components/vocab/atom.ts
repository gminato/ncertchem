/**
 * Atom drawing constants shared by Atom, Molecule and ParticleBox.
 * Colours are never hex here: each element maps to a `--el-*` CSS variable.
 */

/** Default sphere radius (SVG units at scale 1), by element symbol. */
export const ATOM_RADIUS: Readonly<Record<string, number>> = {
  H: 10,
  C: 13,
  N: 13,
  O: 13,
  Cl: 16,
  Na: 16,
  S: 15,
  Fe: 15,
  Cu: 15,
  F: 12,
  B: 13,
  Be: 12,
  P: 15,
  Xe: 17,
}

/** Radius used for any element without an explicit entry. */
export const ATOM_RADIUS_FALLBACK = 13

/** Elements with a dedicated `--el-*` token. Anything else uses `--el-other`. */
export const ATOM_COLOR_ELEMENTS: readonly string[] = [
  'H',
  'C',
  'O',
  'N',
  'Cl',
  'Na',
  'S',
  'Fe',
  'Cu',
  'F',
  'B',
  'Be',
  'P',
  'Xe',
]

/** The CSS variable that paints an element, e.g. `var(--el-O)`. */
export function atomColor(element: string): string {
  return ATOM_COLOR_ELEMENTS.includes(element) ? `var(--el-${element})` : 'var(--el-other)'
}

/** The default radius for an element, e.g. hydrogen is smaller than chlorine. */
export function atomRadius(element: string): number {
  return ATOM_RADIUS[element] ?? ATOM_RADIUS_FALLBACK
}
