import { describe, expect, it } from 'vitest'
import { itemWidth, rowScale, textWidth, type RowItem } from './row'

describe('row sizing', () => {
  const node = (width: number): RowItem => ({ kind: 'node', width, render: () => null })

  it('estimates text width from its length and size', () => {
    expect(textWidth('HNO₃', 20)).toBe(Math.ceil(4 * 20 * 0.6))
    expect(itemWidth({ kind: 'arrow', width: 80 })).toBe(80)
  })

  it('scales a row down to the target and never above maxScale', () => {
    const items = [node(300), node(300)]
    const natural = 600 + 4 * 12
    expect(rowScale(items, natural / 2)).toBeCloseTo(0.5, 6)
    expect(rowScale(items, 10000, 1.6)).toBe(1.6)
  })

  it('a row whose natural width matches the target is drawn at scale 1', () => {
    const items = [node(200), { kind: 'arrow', width: 60 } as RowItem, node(200)]
    expect(rowScale(items, 200 + 60 + 200 + 6 * 12)).toBeCloseTo(1, 6)
  })
})
