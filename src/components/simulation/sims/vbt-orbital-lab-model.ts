import { NCERT_MNBR4, NCERT_VBT_COMPLEXES, spinOnly } from '@/lib/chem/ncert-c12-unit5-s5-tables'
import type { GeometryKind, HybridBracket, VbtBox } from '@/components/animations/c12-unit5/vbt/vbt-steps'

export type CoordinationNumber = 4 | 6
export type SpinChoice = 'low' | 'high'

export interface VbtPreset {
  id: string
  formula: string
  metalIon: string
  ligandLabel: string
  d: number
  cn: CoordinationNumber
  spin: SpinChoice
  ncertNote: string
}

/** All 10 complexes from NCERT_VBT_COMPLEXES plus [MnBr4]2- from Section 5.5.2. */
export const VBT_PRESETS: readonly VbtPreset[] = [
  { id: 'co-nh3-6', formula: NCERT_VBT_COMPLEXES[0].formula, metalIon: 'Co³⁺', ligandLabel: 'NH₃', d: 6, cn: 6, spin: 'low', ncertNote: NCERT_VBT_COMPLEXES[0].note },
  { id: 'co-f-6', formula: NCERT_VBT_COMPLEXES[1].formula, metalIon: 'Co³⁺', ligandLabel: 'F⁻', d: 6, cn: 6, spin: 'high', ncertNote: NCERT_VBT_COMPLEXES[1].note },
  { id: 'ni-cl-4', formula: NCERT_VBT_COMPLEXES[2].formula, metalIon: 'Ni²⁺', ligandLabel: 'Cl⁻', d: 8, cn: 4, spin: 'high', ncertNote: NCERT_VBT_COMPLEXES[2].note },
  { id: 'ni-co-4', formula: NCERT_VBT_COMPLEXES[3].formula, metalIon: 'Ni(0)', ligandLabel: 'CO', d: 10, cn: 4, spin: 'high', ncertNote: NCERT_VBT_COMPLEXES[3].note },
  { id: 'ni-cn-4', formula: NCERT_VBT_COMPLEXES[4].formula, metalIon: 'Ni²⁺', ligandLabel: 'CN⁻', d: 8, cn: 4, spin: 'low', ncertNote: NCERT_VBT_COMPLEXES[4].note },
  { id: 'mn-cn-6', formula: NCERT_VBT_COMPLEXES[5].formula, metalIon: 'Mn³⁺', ligandLabel: 'CN⁻', d: 4, cn: 6, spin: 'low', ncertNote: NCERT_VBT_COMPLEXES[5].note },
  { id: 'mn-cl-6', formula: NCERT_VBT_COMPLEXES[6].formula, metalIon: 'Mn³⁺', ligandLabel: 'Cl⁻', d: 4, cn: 6, spin: 'high', ncertNote: NCERT_VBT_COMPLEXES[6].note },
  { id: 'fe-cn-6', formula: NCERT_VBT_COMPLEXES[7].formula, metalIon: 'Fe³⁺', ligandLabel: 'CN⁻', d: 5, cn: 6, spin: 'low', ncertNote: NCERT_VBT_COMPLEXES[7].note },
  { id: 'fe-f-6', formula: NCERT_VBT_COMPLEXES[8].formula, metalIon: 'Fe³⁺', ligandLabel: 'F⁻', d: 5, cn: 6, spin: 'high', ncertNote: NCERT_VBT_COMPLEXES[8].note },
  { id: 'co-ox-3', formula: NCERT_VBT_COMPLEXES[9].formula, metalIon: 'Co³⁺', ligandLabel: 'O', d: 6, cn: 6, spin: 'low', ncertNote: 'inner orbital, diamagnetic (3 bidentate C₂O₄²⁻ ligands)' },
  { id: 'mn-br-4', formula: NCERT_MNBR4.formula, metalIon: 'Mn²⁺', ligandLabel: 'Br⁻', d: 5, cn: 4, spin: 'high', ncertNote: 'NCERT 5.9 BM, five unpaired electrons, tetrahedral' },
]

export const DEFAULT_PRESET_ID = VBT_PRESETS[0].id

export interface VbtLabState {
  formula: string
  metalLabel: string
  ligandLabel: string
  d: number
  cn: CoordinationNumber
  effectiveSpin: SpinChoice
  spinLocked: boolean
  lockReason: string | null
  hybridisation: 'd²sp³' | 'sp³d²' | 'sp³' | 'dsp²'
  geometry: Exclude<GeometryKind, 'none'>
  geometryLabel: string
  orbitalTypeLabel: string
  unpaired: number
  mu: number
  muText: string
  magnetism: 'Diamagnetic' | 'Paramagnetic'
  balancePull: number
  boxes: readonly VbtBox[]
  bracket: HybridBracket
  note: string
}

/** Fills `count` metal electrons into `numBoxes` degenerate orbitals by Hund's rule. */
function fillHund(count: number, numBoxes: number): VbtBox[] {
  const boxes: VbtBox[] = Array.from({ length: numBoxes }, () => ({}))
  let left = count
  for (let i = 0; i < numBoxes && left > 0; i++) {
    boxes[i].up = 'metal'
    left -= 1
  }
  for (let i = 0; i < numBoxes && left > 0; i++) {
    boxes[i].down = 'metal'
    left -= 1
  }
  for (const b of boxes) {
    if (b.up && !b.down) b.highlight = true
  }
  return boxes
}

function emptyBoxes(n: number): VbtBox[] {
  return Array.from({ length: n }, () => ({}))
}

function ligandPair(): VbtBox {
  return { up: 'ligand', down: 'ligand' }
}

/**
 * Computes the complete VBT orbital occupancy, hybridisation, geometry, and spin-only magnetic moment
 * for any (dCount, cn, spinChoice) combination or NCERT preset.
 */
export function computeVbtState(params: {
  d: number
  cn: CoordinationNumber
  spin: SpinChoice
  preset?: VbtPreset | null
}): VbtLabState {
  const d = Math.max(1, Math.min(10, Math.round(params.d)))
  const { cn, preset } = params

  let effectiveSpin: SpinChoice = params.spin
  let spinLocked = false
  let lockReason: string | null = null

  if (cn === 6) {
    if (d <= 3) {
      effectiveSpin = 'low'
      spinLocked = true
      lockReason = `d${toSuperscript(d)} already has at least two empty inner 3d orbitals: d²sp³ forms without pairing.`
    } else if (d >= 7) {
      effectiveSpin = 'high'
      spinLocked = true
      lockReason = `d${toSuperscript(d)} cannot vacate two inner 3d orbitals without electron promotion: uses outer 4d (sp³d²).`
    }
  } else {
    if (d >= 9) {
      effectiveSpin = 'high'
      spinLocked = true
      lockReason = `d${toSuperscript(d)} cannot vacate a 3d orbital (at most 8 electrons fit in four 3d boxes): only sp³ tetrahedral applies.`
    }
  }

  let boxes: VbtBox[]
  let bracket: HybridBracket
  let hybridisation: VbtLabState['hybridisation']
  let geometry: VbtLabState['geometry']
  let geometryLabel: string
  let orbitalTypeLabel: string

  if (cn === 6 && effectiveSpin === 'low') {
    // Inner orbital octahedral: pair d electrons into first 3 boxes, vacate 2 inner 3d boxes
    const dBoxes = fillHund(d, 3)
    boxes = [
      ...dBoxes,
      ligandPair(), // 3d[3]
      ligandPair(), // 3d[4]
      ligandPair(), // 4s
      ligandPair(), // 4p[0]
      ligandPair(), // 4p[1]
      ligandPair(), // 4p[2]
      ...emptyBoxes(5), // 4d
    ]
    hybridisation = 'd²sp³'
    geometry = 'octahedral'
    geometryLabel = 'Octahedral'
    orbitalTypeLabel = d <= 3 ? 'Inner orbital (no pairing needed)' : 'Inner orbital (low spin)'
    bracket = { startIndex: 3, endIndex: 8, label: 'd²sp³ (6 ligand pairs)' }
  } else if (cn === 6) {
    // Outer orbital octahedral: Hund's rule across all 5 3d boxes, use 4s + 3x4p + 2x4d
    const dBoxes = fillHund(d, 5)
    boxes = [
      ...dBoxes,
      ligandPair(), // 4s
      ligandPair(), // 4p[0]
      ligandPair(), // 4p[1]
      ligandPair(), // 4p[2]
      ligandPair(), // 4d[0]
      ligandPair(), // 4d[1]
      ...emptyBoxes(3), // 4d[2..4]
    ]
    hybridisation = 'sp³d²'
    geometry = 'octahedral'
    geometryLabel = 'Octahedral'
    orbitalTypeLabel =
      d === 10
        ? 'Outer orbital (3d¹⁰ filled, diamagnetic)'
        : d === 9
          ? 'Outer orbital (3d⁹, 1 unpaired e⁻)'
          : 'Outer orbital (high spin)'
    bracket = { startIndex: 5, endIndex: 10, label: 'sp³d² (6 ligand pairs)' }
  } else if (effectiveSpin === 'low') {
    // CN = 4 square planar: pair d electrons into first 4 boxes, vacate 5th 3d box
    const dBoxes = fillHund(d, 4)
    boxes = [
      ...dBoxes,
      ligandPair(), // 3d[4]
      ligandPair(), // 4s
      ligandPair(), // 4p[0]
      ligandPair(), // 4p[1]
      {}, // 4p[2] empty
      ...emptyBoxes(5), // 4d
    ]
    hybridisation = 'dsp²'
    geometry = 'square-planar'
    geometryLabel = 'Square planar'
    orbitalTypeLabel = d <= 4 ? 'Inner 3d orbital (no pairing needed)' : 'Inner 3d orbital (low spin)'
    bracket = { startIndex: 4, endIndex: 7, label: 'dsp² (4 ligand pairs)' }
  } else {
    // CN = 4 tetrahedral: Hund's rule across all 5 3d boxes, use 4s + 3x4p
    const dBoxes = fillHund(d, 5)
    boxes = [
      ...dBoxes,
      ligandPair(), // 4s
      ligandPair(), // 4p[0]
      ligandPair(), // 4p[1]
      ligandPair(), // 4p[2]
      ...emptyBoxes(5), // 4d
    ]
    hybridisation = 'sp³'
    geometry = 'tetrahedral'
    geometryLabel = 'Tetrahedral'
    orbitalTypeLabel =
      d === 10
        ? 'Outer s/p (3d¹⁰ filled, diamagnetic)'
        : d === 9
          ? 'Outer s/p (3d⁹, 1 unpaired e⁻)'
          : 'Outer s/p orbitals (high spin)'
    bracket = { startIndex: 5, endIndex: 8, label: 'sp³ (4 ligand pairs)' }
  }

  let unpaired = 0
  for (let i = 0; i < 5; i++) {
    const b = boxes[i]
    if (b.up === 'metal' && !b.down) unpaired += 1
  }

  const mu = spinOnly(unpaired)
  const muText = mu.toFixed(2)
  const magnetism: VbtLabState['magnetism'] = unpaired === 0 ? 'Diamagnetic' : 'Paramagnetic'
  const balancePull = unpaired === 0 ? -0.24 : Math.min(1, mu / 6.0)

  const metalLabel = preset ? preset.metalIon : 'M'
  const ligandLabel = preset ? preset.ligandLabel : 'L'
  const formula = preset ? preset.formula : `[ML${cn === 6 ? '₆' : '₄'}]`
  const note =
    preset?.ncertNote ??
    lockReason ??
    `${hybridisation} ${geometryLabel.toLowerCase()} complex with ${unpaired} unpaired electron${unpaired === 1 ? '' : 's'}.`

  return {
    formula,
    metalLabel,
    ligandLabel,
    d,
    cn,
    effectiveSpin,
    spinLocked,
    lockReason,
    hybridisation,
    geometry,
    geometryLabel,
    orbitalTypeLabel,
    unpaired,
    mu,
    muText,
    magnetism,
    balancePull,
    boxes,
    bracket,
    note,
  }
}

export function toSuperscript(n: number): string {
  const map: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  }
  return String(n)
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
}

export function vbtLiveSummary(state: VbtLabState): string {
  return `${state.formula}: ${state.hybridisation}, ${state.geometryLabel}, ${state.unpaired} unpaired electrons, spin-only magnetic moment ${state.muText} BM, ${state.magnetism}.`
}
