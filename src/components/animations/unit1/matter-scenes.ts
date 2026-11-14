/**
 * Scenes and classification tree for the MatterClassification Scrolly Animation
 * (Section 1.2). Each Step shows one kind of sample in a particle box, and reveals
 * the part of the tree that the sample belongs to.
 */
import type { ParticleItem } from '@/components/vocab'
import { scatter, type Point, type Rect } from './scatter'

export const MATTER_STEP_COUNT = 6

/** Particle box size in SVG units. Items are placed in box coordinates. */
export const MATTER_BOX = { width: 360, height: 360 }

/** Interior rectangle that particles may occupy, inside the glass wall. */
const INNER: Rect = { x0: 30, y0: 30, x1: MATTER_BOX.width - 30, y1: MATTER_BOX.height - 30 }

/** Molecules drawn at this scale in the box (ball-and-stick). */
const MOLECULE_SCALE = 0.9
/** Radius of atoms drawn as single particles in the box. */
const ATOM_R = 11

export interface MatterScene {
  title: string
  caption: string
  /** Visually hidden description of the Step, read by screen readers. */
  description: string
  items: ParticleItem[]
}

function molecules(formula: string, points: readonly Point[], scale = MOLECULE_SCALE): ParticleItem[] {
  return points.map((p): ParticleItem => ({
    kind: 'molecule',
    formula,
    x: p.x,
    y: p.y,
    scale,
    style: 'ball-and-stick',
  }))
}

function atoms(element: string, points: readonly Point[], r = ATOM_R): ParticleItem[] {
  return points.map((p): ParticleItem => ({ kind: 'atom', element, x: p.x, y: p.y, r }))
}

// Each scene places its particles with a fixed seed and a minimum spacing, so
// the picture is the same on every visit and nothing overlaps.
const mixedSample = (() => {
  const water = scatter(101, 6, INNER, 46)
  const oxygen = scatter(102, 5, INNER, 46, water)
  const sodium = scatter(103, 6, INNER, 46, [...water, ...oxygen])
  return [
    ...molecules('H2O', water, 1),
    ...molecules('O2', oxygen),
    ...atoms('Na', sodium),
  ]
})()

const sodiumAtoms = atoms('Na', scatter(201, 24, INNER, 30))
const oxygenMolecules = molecules('O2', scatter(301, 16, INNER, 46))
const waterMolecules = molecules('H2O', scatter(401, 18, INNER, 46), 1)

const air = (() => {
  const points = scatter(501, 19, INNER, 42)
  return points.map((p, i) =>
    i < 15
      ? { kind: 'molecule' as const, formula: 'N2', x: p.x, y: p.y, scale: MOLECULE_SCALE, style: 'ball-and-stick' as const }
      : { kind: 'molecule' as const, formula: 'O2', x: p.x, y: p.y, scale: MOLECULE_SCALE, style: 'ball-and-stick' as const }
  )
})()

const patches = (() => {
  const iron = scatter(601, 14, { x0: 30, y0: 40, x1: 160, y1: 320 }, 30)
  const sulphur = scatter(602, 14, { x0: 200, y0: 40, x1: 330, y1: 320 }, 30)
  return [...atoms('Fe', iron), ...atoms('S', sulphur)]
})()

export const MATTER_SCENES: readonly MatterScene[] = [
  {
    title: 'A sample of matter',
    caption: 'Samples mix particles of one or more kinds',
    description:
      'A sample of matter is made of particles. This sample has water, oxygen and sodium particles. The question is what kinds of particles a sample contains.',
    items: mixedSample,
  },
  {
    title: 'Element: atoms',
    caption: 'Sodium, Na: every particle is a single sodium atom',
    description:
      'An element made of atoms. Every particle is one sodium atom, and no two kinds of atom are present.',
    items: sodiumAtoms,
  },
  {
    title: 'Element: molecules',
    caption: 'Oxygen, O₂: every particle is an O₂ molecule',
    description:
      'An element made of molecules. Every particle is a pair of oxygen atoms bonded together, O₂.',
    items: oxygenMolecules,
  },
  {
    title: 'Compound',
    caption: 'Water, H₂O: two H atoms for every O atom',
    description:
      'A compound. Every particle is a water molecule, H₂O, with two hydrogen atoms bonded to one oxygen atom. Its composition is fixed.',
    items: waterMolecules,
  },
  {
    title: 'Homogeneous mixture',
    caption: 'Air: nitrogen and oxygen, mixed evenly',
    description:
      'A homogeneous mixture. Nitrogen, N₂, and oxygen, O₂, are spread evenly, so the composition is the same throughout.',
    items: air,
  },
  {
    title: 'Heterogeneous mixture',
    caption: 'Iron filings and sulphur form separate patches',
    description:
      'A heterogeneous mixture. Iron and sulphur sit in separate patches, so the composition differs from place to place.',
    items: patches,
  },
]

export interface TreeNode {
  id: string
  label: string
  depth: number
  /** Index into TREE of the parent node, or -1 for the root. */
  parent: number
  /** First Step at which the node is shown. */
  reveal: number
}

/** The classification tree, in depth-first order (one row per node). */
export const MATTER_TREE: readonly TreeNode[] = [
  { id: 'matter', label: 'Matter', depth: 0, parent: -1, reveal: 0 },
  { id: 'pure', label: 'Pure substance', depth: 1, parent: 0, reveal: 1 },
  { id: 'element', label: 'Element', depth: 2, parent: 1, reveal: 1 },
  { id: 'atoms', label: 'Atoms', depth: 3, parent: 2, reveal: 1 },
  { id: 'molecules', label: 'Molecules', depth: 3, parent: 2, reveal: 2 },
  { id: 'compound', label: 'Compound', depth: 2, parent: 1, reveal: 3 },
  { id: 'mixture', label: 'Mixture', depth: 1, parent: 0, reveal: 4 },
  { id: 'homogeneous', label: 'Homogeneous', depth: 2, parent: 6, reveal: 4 },
  { id: 'heterogeneous', label: 'Heterogeneous', depth: 2, parent: 6, reveal: 5 },
]

/** Index into MATTER_TREE of the node each Step points at. */
export const MATTER_STEP_FOCUS: readonly number[] = [0, 3, 4, 5, 7, 8]

export function clampMatterStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(MATTER_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** Ancestors of a tree node, nearest first. */
export function ancestorsOf(index: number): number[] {
  const out: number[] = []
  let parent = MATTER_TREE[index].parent
  while (parent >= 0) {
    out.push(parent)
    parent = MATTER_TREE[parent].parent
  }
  return out
}
