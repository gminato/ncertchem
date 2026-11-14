import type { ElementRecord, PositionFn, TablePosition } from './types'

/**
 * Pure geometry, keyboard and stagger logic for the periodic table. Kept free
 * of React so every rule can be unit tested.
 */

/** The name shown to learners: NCERT's spelling where it differs from the data name. */
export function displayName(el: ElementRecord): string {
  return el.ncertName ?? el.name
}

export const COLS = 18
/** Distance between cell origins, in SVG user units. */
export const PITCH = 60
/** Side of a square cell. The gap between cells is PITCH - CELL. */
export const CELL = 54
/** Font size of the cell name, in user units (about 10 px at 1440 px). */
export const NAME_FONT = 10
/** Estimated average glyph width as a fraction of the font size, for fit checks. */
const AVG_GLYPH_EM = 0.5

/**
 * Whether a name fits on one line inside a cell at NAME_FONT. Names that do
 * not fit are left off the cell. They still appear in the aria-label and the
 * selection caption, so nothing is lost. Names are never shrunk below NAME_FONT.
 */
export function nameFits(name: string): boolean {
  return name.length * AVG_GLYPH_EM * NAME_FONT <= CELL - 8
}
/** Width of the left gutter that holds period numbers. */
export const GUTTER_LEFT = 34
/** Height of the top band that holds group numbers. */
export const GUTTER_TOP = 30
/** Vertical gap before the f-block rows, as a fraction of PITCH. */
export const F_BLOCK_GAP = 0.5
/** Corner radius of a cell. */
export const CELL_RADIUS = 6

export interface CellRect {
  x: number
  y: number
  width: number
  height: number
  cx: number
  cy: number
}

export interface TableViewBox {
  width: number
  height: number
}

/** Top edge (in user units, below the group-number band) of a table row. */
export function rowTop(row: number): number {
  // Rows 1 to 7 stack directly. Rows 9 and 10 sit one half-pitch below row 7.
  if (row <= 7) return (row - 1) * PITCH
  return (row - 2) * PITCH + F_BLOCK_GAP * PITCH
}

/** Left edge (in user units, right of the period-number gutter) of a column. */
export function colLeft(col: number): number {
  return (col - 1) * PITCH
}

/**
 * The geometry of one cell in the SVG coordinate system, including the
 * gutters. Returns null for positions that are not on the grid (row 0).
 */
export function cellRect(Z: number, position: PositionFn): CellRect | null {
  return rectAt(position(Z))
}

function rectAt(pos: TablePosition): CellRect | null {
  if (pos.row < 1 || pos.col < 1) return null
  const x = GUTTER_LEFT + colLeft(pos.col) + (PITCH - CELL) / 2
  const y = GUTTER_TOP + rowTop(pos.row) + (PITCH - CELL) / 2
  return { x, y, width: CELL, height: CELL, cx: x + CELL / 2, cy: y + CELL / 2 }
}

/** The total SVG size that holds the full table with its gutters and f-block rows. */
export function tableViewBox(): TableViewBox {
  const width = GUTTER_LEFT + COLS * PITCH
  // Rows 9 and 10 are the lowest. Their bottom edge plus the top band gives the height.
  const height = GUTTER_TOP + rowTop(10) + PITCH
  return { width, height }
}

/** A grid lookup of occupied cells, keyed by "row:col". */
export function buildGrid(
  elements: readonly ElementRecord[],
  position: PositionFn
): Map<string, ElementRecord> {
  const grid = new Map<string, ElementRecord>()
  for (const el of elements) {
    const pos = position(el.Z)
    if (pos.row < 1 || pos.col < 1) continue
    grid.set(`${pos.row}:${pos.col}`, el)
  }
  return grid
}

export type NavKey =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'Home'
  | 'End'

/**
 * The Z that receives focus after an arrow key. Movement skips empty positions
 * and lands on the nearest occupied cell in that direction. If there is none,
 * focus stays where it is.
 */
export function nextFocusZ(
  elements: readonly ElementRecord[],
  position: PositionFn,
  fromZ: number,
  key: string
): number {
  const grid = buildGrid(elements, position)
  const from = elements.find((el) => el.Z === fromZ)
  if (!from) return fromZ
  const pos = position(fromZ)
  if (pos.row < 1 || pos.col < 1) return fromZ

  const found = findNext(grid, pos, key)
  return found ? found.Z : fromZ
}

function findNext(
  grid: Map<string, ElementRecord>,
  pos: TablePosition,
  key: string
): ElementRecord | undefined {
  const maxRow = 10
  switch (key) {
    case 'ArrowRight':
      for (let c = pos.col + 1; c <= COLS; c++) {
        const hit = grid.get(`${pos.row}:${c}`)
        if (hit) return hit
      }
      return undefined
    case 'ArrowLeft':
      for (let c = pos.col - 1; c >= 1; c--) {
        const hit = grid.get(`${pos.row}:${c}`)
        if (hit) return hit
      }
      return undefined
    case 'ArrowDown':
      for (let r = pos.row + 1; r <= maxRow; r++) {
        const hit = grid.get(`${r}:${pos.col}`)
        if (hit) return hit
      }
      return undefined
    case 'ArrowUp':
      for (let r = pos.row - 1; r >= 1; r--) {
        const hit = grid.get(`${r}:${pos.col}`)
        if (hit) return hit
      }
      return undefined
    case 'Home':
      for (let c = 1; c <= COLS; c++) {
        const hit = grid.get(`${pos.row}:${c}`)
        if (hit) return hit
      }
      return undefined
    case 'End':
      for (let c = COLS; c >= 1; c--) {
        const hit = grid.get(`${pos.row}:${c}`)
        if (hit) return hit
      }
      return undefined
    default:
      return undefined
  }
}

export type RevealBy = 'group' | 'period' | 'block'

const BLOCK_ORDER: Record<ElementRecord['block'], number> = { s: 0, p: 1, d: 2, f: 3 }

/**
 * A stagger index for each element, so GSAP can reveal the table by group,
 * period or block. Elements are ordered by the chosen key, then by Z.
 */
export function cellRevealOrder(
  elements: readonly ElementRecord[],
  by: RevealBy
): Map<number, number> {
  const sorted = [...elements].sort((a, b) => {
    const primary = revealKey(a, by) - revealKey(b, by)
    return primary !== 0 ? primary : a.Z - b.Z
  })
  const order = new Map<number, number>()
  sorted.forEach((el, index) => order.set(el.Z, index))
  return order
}

function revealKey(el: ElementRecord, by: RevealBy): number {
  switch (by) {
    case 'group':
      // f-block elements have no group. They come after the main groups.
      return el.group ?? 100
    case 'period':
      return el.period
    case 'block':
      return BLOCK_ORDER[el.block]
  }
}
