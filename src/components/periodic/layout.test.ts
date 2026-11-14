import { describe, it, expect } from 'vitest'
import {
  CELL,
  PITCH,
  cellRevealOrder,
  cellRect,
  displayName,
  nameFits,
  nextFocusZ,
  rowTop,
  tableViewBox,
} from './layout'
import { FIXTURE_ELEMENTS, fixturePosition } from './fixture'
import { PERIODIC_TABLE } from '../../lib/chem/periodic-data'

describe('rowTop', () => {
  it('stacks rows 1 to 7 at one pitch each', () => {
    expect(rowTop(1)).toBe(0)
    expect(rowTop(2)).toBe(PITCH)
    expect(rowTop(7)).toBe(6 * PITCH)
  })

  it('detaches the f-block rows below a half-pitch gap', () => {
    const gap = rowTop(9) - rowTop(7)
    expect(gap).toBeGreaterThan(PITCH)
    expect(rowTop(10) - rowTop(9)).toBe(PITCH)
  })
})

describe('tableViewBox', () => {
  it('is wide enough for 18 columns and tall enough for the f-block rows', () => {
    const { width, height } = tableViewBox()
    expect(width).toBeGreaterThanOrEqual(18 * PITCH)
    expect(height).toBeGreaterThan(rowTop(10) + CELL)
  })
})

describe('cellRect', () => {
  it('centres the cell inside its pitch and reports the centre', () => {
    const rect = cellRect(1, fixturePosition)
    expect(rect).not.toBeNull()
    if (!rect) return
    expect(rect.width).toBe(CELL)
    expect(rect.cx).toBeCloseTo(rect.x + CELL / 2)
    expect(rect.cy).toBeCloseTo(rect.y + CELL / 2)
  })

  it('places an element one column to the right, one pitch further along', () => {
    const h = cellRect(1, fixturePosition)
    const he = cellRect(2, fixturePosition)
    expect(he).not.toBeNull()
    if (!h || !he) return
    expect(he.x - h.x).toBeCloseTo(17 * PITCH)
    expect(he.y).toBeCloseTo(h.y)
  })

  it('returns null for positions off the grid', () => {
    expect(cellRect(1, () => ({ row: 0, col: 0 }))).toBeNull()
  })
})

describe('displayName and nameFits', () => {
  it('prefers the NCERT spelling and falls back to the data name', () => {
    const al = PERIODIC_TABLE.find((e) => e.symbol === 'Al')
    expect(al && displayName(al)).toBe(al?.ncertName ?? al?.name)
    const h = PERIODIC_TABLE.find((e) => e.symbol === 'H')
    expect(h && displayName(h)).toBe('Hydrogen')
  })

  it('fits short names and drops long ones rather than shrinking them', () => {
    expect(nameFits('Sodium')).toBe(true)
    expect(nameFits('Praseodymium')).toBe(false)
  })
})

describe('nextFocusZ', () => {
  it('moves right to the next occupied cell in the same row', () => {
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 1, 'ArrowRight')).toBe(2)
  })

  it('skips empty positions when moving right', () => {
    // Li (Z 3) is at col 1 of row 2. The next occupied cell is Be at col 2.
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 3, 'ArrowRight')).toBe(4)
    // Be (Z 4) is at col 2. The next occupied cell is B at col 13.
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 4, 'ArrowRight')).toBe(5)
  })

  it('moves left and stays put at the edge', () => {
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 2, 'ArrowLeft')).toBe(1)
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 1, 'ArrowLeft')).toBe(1)
  })

  it('moves down the same column, so Helium lands on Neon', () => {
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 2, 'ArrowDown')).toBe(10)
  })

  it('moves up the same column', () => {
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 10, 'ArrowUp')).toBe(2)
  })

  it('stays put when there is no occupied cell in that direction', () => {
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 58, 'ArrowDown')).toBe(58)
  })

  it('jumps to the first and last cell of a row with Home and End', () => {
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 5, 'Home')).toBe(3)
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 5, 'End')).toBe(10)
  })

  it('ignores keys it does not handle', () => {
    expect(nextFocusZ(FIXTURE_ELEMENTS, fixturePosition, 5, 'a')).toBe(5)
  })
})

describe('cellRevealOrder', () => {
  it('orders by group and then by Z, with f-block elements last', () => {
    const order = cellRevealOrder(FIXTURE_ELEMENTS, 'group')
    expect(order.get(1)).toBe(0)
    expect(order.get(3)).toBeLessThan(order.get(11) as number)
    expect(order.get(58)).toBe(FIXTURE_ELEMENTS.length - 1)
  })

  it('gives every element a unique index', () => {
    for (const by of ['group', 'period', 'block'] as const) {
      const order = cellRevealOrder(FIXTURE_ELEMENTS, by)
      expect(new Set(order.values()).size).toBe(FIXTURE_ELEMENTS.length)
    }
  })

  it('groups by period and by block', () => {
    const byPeriod = cellRevealOrder(FIXTURE_ELEMENTS, 'period')
    expect(byPeriod.get(1)).toBeLessThan(byPeriod.get(3) as number)
    const byBlock = cellRevealOrder(FIXTURE_ELEMENTS, 'block')
    // The f-block element comes last when ordering by block.
    expect(byBlock.get(58)).toBe(FIXTURE_ELEMENTS.length - 1)
  })
})
