import {
  OCTAHEDRAL_EG_COUNT,
  OCTAHEDRAL_EG_SHIFT,
  OCTAHEDRAL_T2G_COUNT,
  OCTAHEDRAL_T2G_SHIFT,
} from '@/lib/chem/ncert-c12-unit5-s6-tables'

export const OCTAHEDRAL_STEP_COUNT = 4

export function clampOctahedralStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(OCTAHEDRAL_STEP_COUNT - 1, Math.max(0, Math.trunc(step)))
}

export type OctahedralStepKind = 'spherical' | 'ligands-arrive' | 'levels-split' | 'energy-balance'

export interface OctahedralStepState {
  readonly index: number
  readonly kind: OctahedralStepKind
  /** 0 = degenerate at barycentre, 1 = full octahedral splitting. */
  readonly splitFraction: number
  /** 0 = ligands far away, 1 = ligands seated at octahedral vertices. */
  readonly ligandProgress: number
  readonly showSphere: boolean
  readonly highlightRepulsion: boolean
  readonly showShiftBrackets: boolean
  readonly egShift: number
  readonly t2gShift: number
  readonly egCount: number
  readonly t2gCount: number
  readonly netShift: number
  readonly ariaLabel: string
}

export function octahedralStepState(step: number): OctahedralStepState {
  const index = clampOctahedralStep(step)
  const netShift = OCTAHEDRAL_EG_COUNT * OCTAHEDRAL_EG_SHIFT + OCTAHEDRAL_T2G_COUNT * OCTAHEDRAL_T2G_SHIFT

  switch (index) {
    case 0:
      return {
        index,
        kind: 'spherical',
        splitFraction: 0,
        ligandProgress: 0,
        showSphere: true,
        highlightRepulsion: false,
        showShiftBrackets: false,
        egShift: OCTAHEDRAL_EG_SHIFT,
        t2gShift: OCTAHEDRAL_T2G_SHIFT,
        egCount: OCTAHEDRAL_EG_COUNT,
        t2gCount: OCTAHEDRAL_T2G_COUNT,
        netShift,
        ariaLabel: 'Metal ion inside a spherical negative field; all five d orbitals remain degenerate on one energy level.',
      }
    case 1:
      return {
        index,
        kind: 'ligands-arrive',
        splitFraction: 0.15,
        ligandProgress: 1,
        showSphere: false,
        highlightRepulsion: true,
        showShiftBrackets: false,
        egShift: OCTAHEDRAL_EG_SHIFT,
        t2gShift: OCTAHEDRAL_T2G_SHIFT,
        egCount: OCTAHEDRAL_EG_COUNT,
        t2gCount: OCTAHEDRAL_T2G_COUNT,
        netShift,
        ariaLabel: 'Six ligands arrive along the x, y and z axes; axial orbitals dx²-y² and dz² feel strong repulsion while dxy, dyz and dxz feel weak repulsion.',
      }
    case 2:
      return {
        index,
        kind: 'levels-split',
        splitFraction: 1,
        ligandProgress: 1,
        showSphere: false,
        highlightRepulsion: false,
        showShiftBrackets: false,
        egShift: OCTAHEDRAL_EG_SHIFT,
        t2gShift: OCTAHEDRAL_T2G_SHIFT,
        egCount: OCTAHEDRAL_EG_COUNT,
        t2gCount: OCTAHEDRAL_T2G_COUNT,
        netShift,
        ariaLabel: 'The d orbitals split around the barycentre into an upper eg pair at +3/5 Δo and a lower t2g triple at -2/5 Δo, separated by Δo.',
      }
    default:
      return {
        index,
        kind: 'energy-balance',
        splitFraction: 1,
        ligandProgress: 1,
        showSphere: false,
        highlightRepulsion: false,
        showShiftBrackets: true,
        egShift: OCTAHEDRAL_EG_SHIFT,
        t2gShift: OCTAHEDRAL_T2G_SHIFT,
        egCount: OCTAHEDRAL_EG_COUNT,
        t2gCount: OCTAHEDRAL_T2G_COUNT,
        netShift,
        ariaLabel: 'Energy balance: 2 orbitals rise by 3/5 Δo and 3 orbitals drop by 2/5 Δo, summing to zero net shift.',
      }
  }
}
