/**
 * Pure step model for the `vbt-hybridisation` Scrolly Animation (Class 12, Unit 5, Section 5.5.1).
 * Models the five orbital-box states walked through in the Section prose.
 */

export type ElectronOrigin = 'metal' | 'ligand'

export interface VbtBox {
  up?: ElectronOrigin
  down?: ElectronOrigin
  /** Highlight box (e.g. unpaired 3d electrons). */
  highlight?: boolean
}

export interface HybridBracket {
  /** 0-based index across the 14 valence boxes: 0..4 = 3d, 5 = 4s, 6..8 = 4p, 9..13 = 4d. */
  startIndex: number
  endIndex: number
  label: string
}

export type GeometryKind = 'none' | 'octahedral' | 'tetrahedral' | 'square-planar'

export interface OrbitalSchemeSpec {
  id: string
  formula: string
  metalLabel: string
  ligandLabel: string
  hybridisation: string
  geometry: GeometryKind
  unpaired: number
  muText: string
  magnetism: 'Paramagnetic' | 'Diamagnetic'
  spinLabel: string
  show4d: boolean
  /** Always 14 boxes: 0..4 (3d), 5 (4s), 6..8 (4p), 9..13 (4d). */
  boxes: readonly VbtBox[]
  bracket: HybridBracket | null
}

export interface VbtStepSpec {
  index: number
  title: string
  subtitle: string
  primary: OrbitalSchemeSpec
  /** Present on Step 3 where [NiCl4]2- and [Ni(CO)4] are contrasted. */
  secondary?: OrbitalSchemeSpec
  ariaLabel: string
}

function emptyBoxes(count: number): VbtBox[] {
  return Array.from({ length: count }, () => ({}))
}

function pair(origin: ElectronOrigin): VbtBox {
  return { up: origin, down: origin }
}

function single(origin: ElectronOrigin, highlight = true): VbtBox {
  return { up: origin, highlight }
}

/** Step 0: Free Co3+ ion (3d6), no ligands yet. */
const FREE_CO3: OrbitalSchemeSpec = {
  id: 'free-co3',
  formula: 'Co³⁺ (free ion)',
  metalLabel: 'Co³⁺',
  ligandLabel: '',
  hybridisation: 'Unhybridised',
  geometry: 'none',
  unpaired: 4,
  muText: '4.90 BM',
  magnetism: 'Paramagnetic',
  spinLabel: 'Hund\'s rule ground state',
  show4d: true,
  boxes: [
    pair('metal'),
    single('metal', true),
    single('metal', true),
    single('metal', true),
    single('metal', true),
    ...emptyBoxes(1), // 4s
    ...emptyBoxes(3), // 4p
    ...emptyBoxes(5), // 4d
  ],
  bracket: null,
}

/** Step 1: [Co(NH3)6]3+ inner orbital octahedral (d2sp3). */
const CO_NH3_6: OrbitalSchemeSpec = {
  id: 'co-nh3-6',
  formula: '[Co(NH₃)₆]³⁺',
  metalLabel: 'Co³⁺',
  ligandLabel: 'NH₃',
  hybridisation: 'd²sp³',
  geometry: 'octahedral',
  unpaired: 0,
  muText: '0.00 BM',
  magnetism: 'Diamagnetic',
  spinLabel: 'Inner orbital (low spin, spin paired)',
  show4d: true,
  boxes: [
    pair('metal'),
    pair('metal'),
    pair('metal'),
    pair('ligand'),
    pair('ligand'),
    pair('ligand'), // 4s
    pair('ligand'), // 4p
    pair('ligand'),
    pair('ligand'),
    ...emptyBoxes(5), // 4d
  ],
  bracket: { startIndex: 3, endIndex: 8, label: 'd²sp³ (6 NH₃ pairs)' },
}

/** Step 2: [CoF6]3- outer orbital octahedral (sp3d2). */
const CO_F_6: OrbitalSchemeSpec = {
  id: 'co-f-6',
  formula: '[CoF₆]³⁻',
  metalLabel: 'Co³⁺',
  ligandLabel: 'F⁻',
  hybridisation: 'sp³d²',
  geometry: 'octahedral',
  unpaired: 4,
  muText: '4.90 BM',
  magnetism: 'Paramagnetic',
  spinLabel: 'Outer orbital (high spin, spin free)',
  show4d: true,
  boxes: [
    pair('metal'),
    single('metal', true),
    single('metal', true),
    single('metal', true),
    single('metal', true),
    pair('ligand'), // 4s
    pair('ligand'), // 4p
    pair('ligand'),
    pair('ligand'),
    pair('ligand'), // 4d (2 used)
    pair('ligand'),
    ...emptyBoxes(3), // 4d (3 empty)
  ],
  bracket: { startIndex: 5, endIndex: 10, label: 'sp³d² (6 F⁻ pairs)' },
}

/** Step 3 (top): [NiCl4]2- tetrahedral (sp3), Ni2+ (3d8). */
const NI_CL_4: OrbitalSchemeSpec = {
  id: 'ni-cl-4',
  formula: '[NiCl₄]²⁻',
  metalLabel: 'Ni²⁺',
  ligandLabel: 'Cl⁻',
  hybridisation: 'sp³',
  geometry: 'tetrahedral',
  unpaired: 2,
  muText: '2.83 BM',
  magnetism: 'Paramagnetic',
  spinLabel: 'High spin, 2 unpaired e⁻',
  show4d: false,
  boxes: [
    pair('metal'),
    pair('metal'),
    pair('metal'),
    single('metal', true),
    single('metal', true),
    pair('ligand'), // 4s
    pair('ligand'), // 4p
    pair('ligand'),
    pair('ligand'),
    ...emptyBoxes(5),
  ],
  bracket: { startIndex: 5, endIndex: 8, label: 'sp³ (4 Cl⁻ pairs)' },
}

/** Step 3 (bottom): [Ni(CO)4] tetrahedral (sp3), Ni(0) (3d10). */
const NI_CO_4: OrbitalSchemeSpec = {
  id: 'ni-co-4',
  formula: '[Ni(CO)₄]',
  metalLabel: 'Ni(0)',
  ligandLabel: 'CO',
  hybridisation: 'sp³',
  geometry: 'tetrahedral',
  unpaired: 0,
  muText: '0.00 BM',
  magnetism: 'Diamagnetic',
  spinLabel: '3d¹⁰ filled, 0 unpaired e⁻',
  show4d: false,
  boxes: [
    pair('metal'),
    pair('metal'),
    pair('metal'),
    pair('metal'),
    pair('metal'),
    pair('ligand'), // 4s
    pair('ligand'), // 4p
    pair('ligand'),
    pair('ligand'),
    ...emptyBoxes(5),
  ],
  bracket: { startIndex: 5, endIndex: 8, label: 'sp³ (4 CO pairs)' },
}

/** Step 4: [Ni(CN)4]2- square planar (dsp2), Ni2+ (3d8). */
const NI_CN_4: OrbitalSchemeSpec = {
  id: 'ni-cn-4',
  formula: '[Ni(CN)₄]²⁻',
  metalLabel: 'Ni²⁺',
  ligandLabel: 'CN⁻',
  hybridisation: 'dsp²',
  geometry: 'square-planar',
  unpaired: 0,
  muText: '0.00 BM',
  magnetism: 'Diamagnetic',
  spinLabel: 'Low spin (spin paired)',
  show4d: false,
  boxes: [
    pair('metal'),
    pair('metal'),
    pair('metal'),
    pair('metal'),
    pair('ligand'), // 5th 3d vacated and used
    pair('ligand'), // 4s
    pair('ligand'), // 4p (2 used)
    pair('ligand'),
    {}, // 3rd 4p empty
    ...emptyBoxes(5),
  ],
  bracket: { startIndex: 4, endIndex: 7, label: 'dsp² (4 CN⁻ pairs)' },
}

export const VBT_STEPS: readonly VbtStepSpec[] = [
  {
    index: 0,
    title: 'Free Co³⁺ ion (3d⁶)',
    subtitle: 'Four unpaired 3d electrons: no vacant 3d pair available yet',
    primary: FREE_CO3,
    ariaLabel:
      'Valence orbital boxes of free Co3+ (3d6): five 3d boxes with one pair and four unpaired electrons, plus empty 4s, 4p, and 4d boxes.',
  },
  {
    index: 1,
    title: 'Inner orbital octahedral: [Co(NH₃)₆]³⁺',
    subtitle: '3d electrons pair up to vacate two inner 3d orbitals for d²sp³',
    primary: CO_NH3_6,
    ariaLabel:
      'Orbital diagram and octahedral geometry of [Co(NH3)6]3+: six 3d electrons paired in three boxes, two 3d plus 4s plus three 4p form six d2sp3 hybrid orbitals filled by NH3 pairs; zero unpaired electrons, diamagnetic, inner orbital.',
  },
  {
    index: 2,
    title: 'Outer orbital octahedral: [CoF₆]³⁻',
    subtitle: '3d electrons stay unpaired; two outer 4d orbitals join for sp³d²',
    primary: CO_F_6,
    ariaLabel:
      'Orbital diagram and octahedral geometry of [CoF6]3-: six 3d electrons keep four unpaired spins, 4s plus three 4p plus two outer 4d form six sp3d2 hybrid orbitals filled by F- pairs; four unpaired electrons, paramagnetic, outer orbital.',
  },
  {
    index: 3,
    title: 'Tetrahedral complexes: [NiCl₄]²⁻ and [Ni(CO)₄]',
    subtitle: 'Both use sp³ hybridisation (4s + 3 × 4p), but differ in magnetism',
    primary: NI_CL_4,
    secondary: NI_CO_4,
    ariaLabel:
      'Comparison of tetrahedral sp3 complexes: [NiCl4]2- has Ni2+ (3d8) with two unpaired electrons and is paramagnetic; [Ni(CO)4] has neutral Ni (3d10) with zero unpaired electrons and is diamagnetic.',
  },
  {
    index: 4,
    title: 'Square planar complex: [Ni(CN)₄]²⁻',
    subtitle: 'One 3d orbital is vacated by pairing to form four dsp² hybrids',
    primary: NI_CN_4,
    ariaLabel:
      'Orbital diagram and square planar geometry of [Ni(CN)4]2-: eight 3d electrons of Ni2+ pair into four boxes, freeing one 3d orbital to form four dsp2 hybrid orbitals with 4s and two 4p orbitals; zero unpaired electrons, diamagnetic.',
  },
]

export const STEP_COUNT = VBT_STEPS.length

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.max(0, Math.min(STEP_COUNT - 1, Math.round(step)))
}

/** Counts metal and ligand electrons in a scheme (for verification and testing). */
export function countElectrons(scheme: OrbitalSchemeSpec): {
  metal: number
  ligand: number
  unpaired: number
} {
  let metal = 0
  let ligand = 0
  let unpaired = 0
  for (const box of scheme.boxes) {
    if (box.up === 'metal') metal += 1
    if (box.down === 'metal') metal += 1
    if (box.up === 'ligand') ligand += 1
    if (box.down === 'ligand') ligand += 1
    const occupied = (box.up ? 1 : 0) + (box.down ? 1 : 0)
    if (occupied === 1) unpaired += 1
  }
  return { metal, ligand, unpaired }
}
