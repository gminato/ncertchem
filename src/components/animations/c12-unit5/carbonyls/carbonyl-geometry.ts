import { NCERT_CARBONYLS, type Carbonyl } from '@/lib/chem/ncert-c12-unit5-s8-tables'

export type CarbonylFormula = (typeof NCERT_CARBONYLS)[number]['formula']

export interface MetalNode {
  readonly id: string
  readonly symbol: string
  readonly x: number
  readonly y: number
}

export interface TerminalLigand {
  readonly id: string
  readonly metalId: string
  /** Position of the CO label centre (bonded to metal via C). */
  readonly x: number
  readonly y: number
  /** Label orientation so C faces the metal atom (e.g. "OC" on the left, "CO" on the right). */
  readonly label: 'CO' | 'OC'
  /** Optional depth cue for 3D perspective: 'front' | 'back' | 'plane'. */
  readonly depth?: 'front' | 'back' | 'plane'
}

export interface BridgingLigand {
  readonly id: string
  readonly metalIds: readonly [string, string]
  /** Position of the bridging carbon atom. */
  readonly cx: number
  readonly cy: number
  /** Position of the oxygen atom pointing away from the M-M axis. */
  readonly ox: number
  readonly oy: number
}

export interface MetalBond {
  readonly fromId: string
  readonly toId: string
  readonly label: string
}

export interface GeometryGuide {
  /** Faint polygon points (x,y pairs) hinting at the 3D equatorial plane or tetrahedron. */
  readonly points: readonly (readonly [number, number])[]
}

export interface CarbonylLayout {
  readonly formula: string
  readonly metals: readonly MetalNode[]
  readonly terminals: readonly TerminalLigand[]
  readonly bridges: readonly BridgingLigand[]
  readonly metalBond?: MetalBond
  readonly guides?: readonly GeometryGuide[]
  /** Natural bounding half-extents for framing in an SVG. */
  readonly halfWidth: number
  readonly halfHeight: number
}

/** Element tone CSS variables from tokens.css for the five Fig. 5.13 metals. */
export const METAL_TONE: Readonly<Record<string, string>> = {
  Ni: 'var(--sol-ni)',
  Fe: 'var(--el-Fe)',
  Cr: 'var(--db-4d)',
  Mn: 'var(--rev)',
  Co: 'var(--accent)',
  M: 'var(--db-3d)',
}

export const SIGMA_TONE = 'var(--fwd)'
export const PI_TONE = 'var(--db-3d)'

export function metalTone(symbol: string): string {
  return METAL_TONE[symbol] ?? METAL_TONE.M
}

export function findCarbonyl(formula: string): Carbonyl {
  const found = NCERT_CARBONYLS.find((c) => c.formula === formula)
  return found ?? NCERT_CARBONYLS[0]
}

/**
 * 2D skeletal coordinates for the five homoleptic carbonyls in NCERT Fig. 5.13,
 * centred on (0, 0). Every CO bonds to the metal through its carbon atom.
 */
export const CARBONYL_LAYOUTS: Readonly<Record<string, CarbonylLayout>> = {
  'Ni(CO)4': {
    formula: 'Ni(CO)4',
    metals: [{ id: 'Ni', symbol: 'Ni', x: 0, y: 0 }],
    terminals: [
      { id: 'co-top', metalId: 'Ni', x: 0, y: -88, label: 'CO', depth: 'plane' },
      { id: 'co-bl', metalId: 'Ni', x: -82, y: 46, label: 'OC', depth: 'back' },
      { id: 'co-bc', metalId: 'Ni', x: 0, y: 86, label: 'CO', depth: 'front' },
      { id: 'co-br', metalId: 'Ni', x: 82, y: 46, label: 'CO', depth: 'front' },
    ],
    bridges: [],
    guides: [
      {
        points: [
          [-82, 46],
          [0, 86],
          [82, 46],
        ],
      },
    ],
    halfWidth: 112,
    halfHeight: 110,
  },

  'Fe(CO)5': {
    formula: 'Fe(CO)5',
    metals: [{ id: 'Fe', symbol: 'Fe', x: 0, y: 0 }],
    terminals: [
      { id: 'co-ax1', metalId: 'Fe', x: 0, y: -92, label: 'CO', depth: 'plane' },
      { id: 'co-ax2', metalId: 'Fe', x: 0, y: 92, label: 'CO', depth: 'plane' },
      { id: 'co-eq1', metalId: 'Fe', x: 92, y: 0, label: 'CO', depth: 'plane' },
      { id: 'co-eq2', metalId: 'Fe', x: -74, y: -38, label: 'OC', depth: 'back' },
      { id: 'co-eq3', metalId: 'Fe', x: -74, y: 38, label: 'OC', depth: 'front' },
    ],
    bridges: [],
    guides: [
      {
        points: [
          [92, 0],
          [-74, -38],
          [-74, 38],
        ],
      },
    ],
    halfWidth: 122,
    halfHeight: 112,
  },

  'Cr(CO)6': {
    formula: 'Cr(CO)6',
    metals: [{ id: 'Cr', symbol: 'Cr', x: 0, y: 0 }],
    terminals: [
      { id: 'co-ax1', metalId: 'Cr', x: 0, y: -92, label: 'CO', depth: 'plane' },
      { id: 'co-ax2', metalId: 'Cr', x: 0, y: 92, label: 'CO', depth: 'plane' },
      { id: 'co-eq1', metalId: 'Cr', x: -80, y: -40, label: 'OC', depth: 'back' },
      { id: 'co-eq2', metalId: 'Cr', x: 80, y: -40, label: 'CO', depth: 'back' },
      { id: 'co-eq3', metalId: 'Cr', x: -80, y: 40, label: 'OC', depth: 'front' },
      { id: 'co-eq4', metalId: 'Cr', x: 80, y: 40, label: 'CO', depth: 'front' },
    ],
    bridges: [],
    guides: [
      {
        points: [
          [-80, -40],
          [80, -40],
          [80, 40],
          [-80, 40],
        ],
      },
    ],
    halfWidth: 116,
    halfHeight: 112,
  },

  '[Mn2(CO)10]': {
    formula: '[Mn2(CO)10]',
    metals: [
      { id: 'Mn1', symbol: 'Mn', x: -96, y: 0 },
      { id: 'Mn2', symbol: 'Mn', x: 96, y: 0 },
    ],
    metalBond: { fromId: 'Mn1', toId: 'Mn2', label: 'Mn-Mn bond' },
    terminals: [
      // Left Mn(CO)5 square pyramid
      { id: 'mn1-ax', metalId: 'Mn1', x: -194, y: 0, label: 'OC', depth: 'plane' },
      { id: 'mn1-top', metalId: 'Mn1', x: -96, y: -94, label: 'CO', depth: 'plane' },
      { id: 'mn1-bot', metalId: 'Mn1', x: -96, y: 94, label: 'CO', depth: 'plane' },
      { id: 'mn1-ur', metalId: 'Mn1', x: -42, y: -56, label: 'CO', depth: 'back' },
      { id: 'mn1-ll', metalId: 'Mn1', x: -150, y: 56, label: 'OC', depth: 'front' },
      // Right Mn(CO)5 square pyramid
      { id: 'mn2-ax', metalId: 'Mn2', x: 194, y: 0, label: 'CO', depth: 'plane' },
      { id: 'mn2-top', metalId: 'Mn2', x: 96, y: -94, label: 'CO', depth: 'plane' },
      { id: 'mn2-bot', metalId: 'Mn2', x: 96, y: 94, label: 'CO', depth: 'plane' },
      { id: 'mn2-ur', metalId: 'Mn2', x: 150, y: -56, label: 'CO', depth: 'back' },
      { id: 'mn2-ll', metalId: 'Mn2', x: 42, y: 56, label: 'OC', depth: 'front' },
    ],
    bridges: [],
    halfWidth: 230,
    halfHeight: 118,
  },

  '[Co2(CO)8]': {
    formula: '[Co2(CO)8]',
    metals: [
      { id: 'Co1', symbol: 'Co', x: -86, y: 0 },
      { id: 'Co2', symbol: 'Co', x: 86, y: 0 },
    ],
    metalBond: { fromId: 'Co1', toId: 'Co2', label: 'Co-Co bond' },
    terminals: [
      { id: 'co1-ul', metalId: 'Co1', x: -170, y: -62, label: 'OC', depth: 'back' },
      { id: 'co1-l', metalId: 'Co1', x: -186, y: 0, label: 'OC', depth: 'plane' },
      { id: 'co1-ll', metalId: 'Co1', x: -170, y: 62, label: 'OC', depth: 'front' },
      { id: 'co2-ur', metalId: 'Co2', x: 170, y: -62, label: 'CO', depth: 'back' },
      { id: 'co2-r', metalId: 'Co2', x: 186, y: 0, label: 'CO', depth: 'plane' },
      { id: 'co2-lr', metalId: 'Co2', x: 170, y: 62, label: 'CO', depth: 'front' },
    ],
    bridges: [
      { id: 'br-top', metalIds: ['Co1', 'Co2'], cx: 0, cy: -66, ox: 0, oy: -112 },
      { id: 'br-bot', metalIds: ['Co1', 'Co2'], cx: 0, cy: 66, ox: 0, oy: 112 },
    ],
    halfWidth: 222,
    halfHeight: 132,
  },
}

export function carbonylLayout(formula: string): CarbonylLayout {
  return CARBONYL_LAYOUTS[formula] ?? CARBONYL_LAYOUTS['Ni(CO)4']
}
