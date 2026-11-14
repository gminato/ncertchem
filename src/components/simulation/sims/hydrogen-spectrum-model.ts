/**
 * Pure geometry and timing for the hydrogen-spectrum Simulation. Nothing here
 * touches the DOM, so the jump animation and the series brackets can be tested.
 */
import type { SeriesName } from '@/lib/chem/bohr'
import { SIM_LEVEL_MAX, spectrumAxisFraction } from '@/lib/chem/hydrogen-spectrum'

export type TransitionMode = 'emission' | 'absorption'

/** Length of one jump, from the first move of the electron to the line lighting up. */
export const JUMP_MS = 1800

/** Fraction of the jump the electron takes to move to its starting level, before it jumps. */
const PRE_END = 0.25

export interface JumpFrame {
  /** Electron level, continuous between 1 and SIM_LEVEL_MAX. */
  level: number
  /**
   * Photon position along its path, or -1 when none is in flight. Emission: 0 at
   * the atom, 1 at the strip. Absorption: 0 at the strip, 1 at the atom.
   */
  photon: number
  /** 1 once the spectral line has been lit or darkened. */
  lineLit: number
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Segment of progress: 0 before `a`, 1 after `b`, linear in between. */
function seg(p: number, a: number, b: number): number {
  return clamp01((p - a) / (b - a))
}

/** Smooth start and end. */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * The state of one transition at progress p (0 to 1).
 *
 * Emission: the electron first moves from its rest level to the upper level,
 * then drops to the lower one. The photon leaves as the drop ends and travels
 * to the strip, where the line lights.
 *
 * Absorption: the electron first moves to the lower level. A photon travels
 * from the strip to the atom and is absorbed, and the electron rises to the
 * upper level. The dark line appears at absorption.
 */
export function jumpFrame(
  progress: number,
  mode: TransitionMode,
  rest: number,
  upper: number,
  lower: number
): JumpFrame {
  const p = clamp01(progress)
  if (mode === 'emission') {
    let level: number
    if (p < PRE_END) {
      level = lerp(rest, upper, easeInOut(seg(p, 0, PRE_END)))
    } else if (p < 0.55) {
      level = lerp(upper, lower, easeInOut(seg(p, PRE_END, 0.55)))
    } else {
      level = lower
    }
    const flight = seg(p, 0.55, 1)
    const inFlight = p > 0.55 && p < 1
    return {
      level,
      photon: inFlight ? flight : -1,
      lineLit: p >= 1 ? 1 : 0,
    }
  }

  let level: number
  if (p < PRE_END) {
    level = lerp(rest, lower, easeInOut(seg(p, 0, PRE_END)))
  } else if (p < 0.5) {
    level = lower
  } else {
    level = lerp(lower, upper, easeInOut(seg(p, 0.5, 0.8)))
  }
  const inFlight = p < 0.5
  return {
    level,
    photon: inFlight ? easeInOut(seg(p, 0, 0.5)) : -1,
    lineLit: p >= 0.5 ? 1 : 0,
  }
}

/** Level the electron rests on after a transition. */
export function restLevelAfter(mode: TransitionMode, upper: number, lower: number): number {
  return mode === 'emission' ? lower : upper
}

/** Orbit radius (SVG units) of a continuous level: proportional to n². */
export function orbitRadiusFor(level: number, rMax: number): number {
  return rMax * ((level * level) / (SIM_LEVEL_MAX * SIM_LEVEL_MAX))
}

/** Position of a wavelength on the strip, in SVG units from the strip's left edge. */
export function stripX(nm: number, width: number): number {
  return spectrumAxisFraction(nm) * width
}

/** Series colour token for the series bracket and the coloured lines. */
export function seriesToken(series: SeriesName): string {
  return `var(--series-${series.toLowerCase()})`
}

export interface SeriesBracket {
  series: SeriesName
  /** Leftmost and rightmost wavelengths of the lines in this series that are drawn. */
  fromNm: number
  toNm: number
  /** True when some line of the series lies beyond the axis. */
  offScale: boolean
  /** Row above the strip, 0 nearest the strip. Rows are fixed per series so they never move. */
  row: number
}

const SERIES_ORDER: readonly SeriesName[] = ['Lyman', 'Balmer', 'Paschen', 'Brackett', 'Pfund']

/**
 * Brackets for each series that has lines on the page. A bracket spans the
 * wavelengths of that series' lines, so it grows as the Learner adds lines.
 */
export function seriesBrackets(lines: readonly { nm: number; series: SeriesName; onAxis: boolean }[]): SeriesBracket[] {
  const brackets: SeriesBracket[] = []
  SERIES_ORDER.forEach((series, row) => {
    const mine = lines.filter((line) => line.series === series)
    if (mine.length === 0) return
    const onAxisNm = mine.filter((line) => line.onAxis).map((line) => line.nm)
    const fromNm = onAxisNm.length > 0 ? Math.min(...onAxisNm) : Math.min(...mine.map((line) => line.nm))
    const toNm = onAxisNm.length > 0 ? Math.max(...onAxisNm) : Math.max(...mine.map((line) => line.nm))
    brackets.push({
      series,
      fromNm,
      toNm,
      offScale: mine.some((line) => !line.onAxis),
      row,
    })
  })
  return brackets
}
