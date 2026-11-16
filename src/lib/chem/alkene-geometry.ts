import { parseSmiles } from './molecule-parse'
import { nameOf } from './hydrocarbon-species'
import type { MolGraph } from './molecule-graph'

/**
 * Geometrical (cis/trans, E/Z) isomerism of an alkene whose two carbons of the C=C each carry two
 * groups. The Learner picks the groups; this module decides whether the pair of isomers exists,
 * writes the graph and name of each isomer, and reads its net bond-dipole direction from a planar
 * drawing. The dipole model is qualitative (a sign and direction per group), not a measured moment.
 */

export type Group = 'H' | 'CH3' | 'C2H5' | 'Cl' | 'Br' | 'COOH'

export const GROUPS: readonly Group[] = ['H', 'CH3', 'C2H5', 'Cl', 'Br', 'COOH']

/** The label each group is drawn with (subscripts as Unicode). */
export const GROUP_LABEL: Record<Group, string> = {
  H: 'H',
  CH3: 'CH₃',
  C2H5: 'C₂H₅',
  Cl: 'Cl',
  Br: 'Br',
  COOH: 'COOH',
}

/** The SMILES fragment for each group, written so that its first atom bonds to the alkene carbon. */
const GROUP_SMILES: Record<Group, string> = {
  H: '',
  CH3: 'C',
  C2H5: 'CC',
  Cl: 'Cl',
  Br: 'Br',
  COOH: 'C(=O)O',
}

/**
 * CIP precedence of the groups on one carbon (higher wins). Atoms are compared first: Br and Cl
 * outrank carbon, which outranks hydrogen. Among carbon groups, COOH (C bonded to O, O, O) outranks
 * ethyl (C, H, H), which outranks methyl (H, H, H).
 */
const RANK: Record<Group, number> = { H: 0, CH3: 1, C2H5: 2, COOH: 3, Cl: 4, Br: 5 }

/** Qualitative bond-dipole weight: + for an electron-withdrawing group, − for an electron-releasing one. */
const DIPOLE_WEIGHT: Record<Group, number> = { H: 0, CH3: -0.3, C2H5: -0.3, COOH: 0.9, Cl: 1, Br: 0.8 }

/** A point on the drawing; the C=C runs from (0, 0) to (1, 0). */
export interface Point {
  x: number
  y: number
}

/** One group placed on one carbon of the drawing. */
export interface PlacedGroup {
  carbon: 'left' | 'right'
  group: Group
  at: Point
}

export interface AlkeneIsomer {
  /** 'cis' or 'trans' when each carbon carries at most one group other than H; otherwise 'Z' or 'E'. */
  descriptor: 'cis' | 'trans' | 'Z' | 'E'
  /** The full name with its geometric prefix, e.g. 'cis-but-2-ene' or '(Z)-1-chloroprop-1-ene'. */
  name: string
  /** The graph of the alkene (from the SMILES; geometry is not stored in the graph). */
  graph: MolGraph
  smiles: string
  placed: PlacedGroup[]
  /** Net dipole direction in the drawing (unnormalised, sum of weighted group vectors). */
  dipole: Point
  /** True when the net dipole is clearly non-zero. */
  polar: boolean
}

export interface GeometryVerdict {
  /** True when the two groups on each carbon differ, so the two isomers exist. */
  exists: boolean
  /** One sentence that says why, for the Learner. */
  reason: string
  /** The two isomers when they exist, otherwise an empty list. */
  isomers: AlkeneIsomer[]
}

/** Dipoles smaller than this (in weight units times bond vectors) count as cancelled. */
const POLAR_THRESHOLD = 0.05

/** The SMILES of the alkene built from the two pairs of groups, e.g. 'C(C)(Cl)=C' for CH3 and Cl on the left carbon. */
export function alkeneSmiles(left: readonly [Group, Group], right: readonly [Group, Group]): string {
  const branch = (pair: readonly [Group, Group]) =>
    pair
      .filter((g) => g !== 'H')
      .map((g) => `(${GROUP_SMILES[g]})`)
      .join('')
  return `C${branch(left)}=C${branch(right)}`
}

/** Positions of the two groups on one carbon: the first sits up, the second down. */
function slots(carbon: 'left' | 'right'): [Point, Point] {
  const x = carbon === 'left' ? -0.5 : 1.5
  return [
    { x, y: 0.87 },
    { x, y: -0.87 },
  ]
}

/** The net dipole of a set of placed groups, measured from each alkene carbon to its group (qualitative). */
export function netDipole(placed: PlacedGroup[]): Point {
  let x = 0
  let y = 0
  for (const p of placed) {
    const cx = p.carbon === 'left' ? 0 : 1
    const dx = p.at.x - cx
    const dy = p.at.y
    const len = Math.hypot(dx, dy) || 1
    const w = DIPOLE_WEIGHT[p.group]
    x += (w * dx) / len
    y += (w * dy) / len
  }
  return { x, y }
}

/**
 * Places the groups for one arrangement: `leftTop` and `rightTop` name the groups drawn on the upper side of
 * each carbon. Works for any pair of groups, including an arrangement that the Learner's choice does not allow.
 */
export function arrange(
  left: readonly [Group, Group],
  right: readonly [Group, Group],
  leftTop: Group,
  rightTop: Group
): PlacedGroup[] {
  const place = (carbon: 'left' | 'right', pair: readonly [Group, Group], top: Group): PlacedGroup[] => {
    const [up, down] = slots(carbon)
    const bottom = pair[0] === top ? pair[1] : pair[0]
    return [
      { carbon, group: top, at: up },
      { carbon, group: bottom, at: down },
    ]
  }
  return [...place('left', left, leftTop), ...place('right', right, rightTop)]
}

function isomerFrom(
  left: readonly [Group, Group],
  right: readonly [Group, Group],
  placed: PlacedGroup[],
  sameSide: boolean
): AlkeneIsomer {
  const smiles = alkeneSmiles(left, right)
  const graph = parseSmiles(smiles)
  const heavyPerCarbon = [left, right].every((pair) => pair.filter((g) => g !== 'H').length <= 1)
  const descriptor = heavyPerCarbon ? (sameSide ? 'cis' : 'trans') : sameSide ? 'Z' : 'E'
  const base = nameOf(graph)
  const name = heavyPerCarbon ? `${descriptor}-${base}` : `(${descriptor})-${base}`
  const dipole = netDipole(placed)
  const polar = Math.hypot(dipole.x, dipole.y) > POLAR_THRESHOLD
  return { descriptor, name, graph, smiles, placed, dipole, polar }
}

/**
 * Decides whether an alkene built from two pairs of groups has geometrical isomers, and names both
 * when it does. The isomers exist only when the two groups on each doubly bonded carbon differ, so
 * that a like pair on either carbon leaves one arrangement only.
 */
export function geometricIsomers(left: readonly [Group, Group], right: readonly [Group, Group]): GeometryVerdict {
  if (left[0] === left[1]) {
    return {
      exists: false,
      reason: `The left carbon carries two ${GROUP_LABEL[left[0]]} groups, so turning the groups over gives the same molecule.`,
      isomers: [],
    }
  }
  if (right[0] === right[1]) {
    return {
      exists: false,
      reason: `The right carbon carries two ${GROUP_LABEL[right[0]]} groups, so turning the groups over gives the same molecule.`,
      isomers: [],
    }
  }
  const hiL = RANK[left[0]] > RANK[left[1]] ? left[0] : left[1]
  const hiR = RANK[right[0]] > RANK[right[1]] ? right[0] : right[1]
  const loR = hiR === right[0] ? right[1] : right[0]
  // Same side: the higher-ranked group of each carbon is up. Opposite: the right carbon is flipped.
  const sameSide = arrange(left, right, hiL, hiR)
  const opposite = arrange(left, right, hiL, loR)
  return {
    exists: true,
    reason: 'Each doubly bonded carbon carries two different groups, so the two arrangements are different molecules.',
    isomers: [isomerFrom(left, right, sameSide, true), isomerFrom(left, right, opposite, false)],
  }
}
