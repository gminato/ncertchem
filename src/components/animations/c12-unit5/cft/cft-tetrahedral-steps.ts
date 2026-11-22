import {
  OCTAHEDRAL_EG_SHIFT,
  OCTAHEDRAL_T2G_SHIFT,
  TETRAHEDRAL_E_SHIFT,
  TETRAHEDRAL_RATIO,
  TETRAHEDRAL_T2_SHIFT,
} from '@/lib/chem/ncert-c12-unit5-s6-tables'

export const TETRAHEDRAL_STEP_COUNT = 3

export function clampTetrahedralStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(TETRAHEDRAL_STEP_COUNT - 1, Math.max(0, Math.trunc(step)))
}

export type TetrahedralStepKind = 'cube-geometry' | 'inverted-split' | 'side-by-side'

export interface TetrahedralStepState {
  readonly index: number
  readonly kind: TetrahedralStepKind
  readonly t2Shift: number
  readonly eShift: number
  readonly ratio: number
  readonly octEgShift: number
  readonly octT2gShift: number
  readonly ariaLabel: string
}

export function tetrahedralStepState(step: number): TetrahedralStepState {
  const index = clampTetrahedralStep(step)
  switch (index) {
    case 0:
      return {
        index,
        kind: 'cube-geometry',
        t2Shift: TETRAHEDRAL_T2_SHIFT,
        eShift: TETRAHEDRAL_E_SHIFT,
        ratio: TETRAHEDRAL_RATIO,
        octEgShift: OCTAHEDRAL_EG_SHIFT,
        octT2gShift: OCTAHEDRAL_T2G_SHIFT,
        ariaLabel: 'Metal ion at the centre of a cube with four ligands on alternate corners between the axes; dxy, dyz and dxz point closer to ligands than dx²-y² and dz².',
      }
    case 1:
      return {
        index,
        kind: 'inverted-split',
        t2Shift: TETRAHEDRAL_T2_SHIFT,
        eShift: TETRAHEDRAL_E_SHIFT,
        ratio: TETRAHEDRAL_RATIO,
        octEgShift: OCTAHEDRAL_EG_SHIFT,
        octT2gShift: OCTAHEDRAL_T2G_SHIFT,
        ariaLabel: 'Inverted tetrahedral crystal field splitting: lower e pair at -3/5 Δt and upper t2 triple at +2/5 Δt around the barycentre, without a g subscript.',
      }
    default:
      return {
        index,
        kind: 'side-by-side',
        t2Shift: TETRAHEDRAL_T2_SHIFT,
        eShift: TETRAHEDRAL_E_SHIFT,
        ratio: TETRAHEDRAL_RATIO,
        octEgShift: OCTAHEDRAL_EG_SHIFT,
        octT2gShift: OCTAHEDRAL_T2G_SHIFT,
        ariaLabel: 'Octahedral and tetrahedral splitting diagrams on the same energy scale, showing Δt = (4/9) Δo so tetrahedral complexes are almost always high spin.',
      }
  }
}
