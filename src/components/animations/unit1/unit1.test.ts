import { describe, expect, it } from 'vitest'
import type { ParticleItem } from '@/components/vocab'
import { EVERYDAY_STEP_COUNT, clampEverydayStep, everydayStepText } from './everyday-steps'
import { scatter } from './scatter'
import {
  MATTER_BOX,
  MATTER_SCENES,
  MATTER_STEP_COUNT,
  MATTER_STEP_FOCUS,
  MATTER_TREE,
  ancestorsOf,
  clampMatterStep,
} from './matter-scenes'

/** Position of an item, in box coordinates. */
const positionOf = (item: ParticleItem) => ({ x: item.x, y: item.y })

/** Radius used for spacing checks: atoms by their r, molecules by a generous bound. */
const radiusOf = (item: ParticleItem) => (item.kind === 'atom' ? (item.r ?? 13) : 22)

describe('scatter', () => {
  it('places the requested number of points inside the rectangle, at least minDist apart', () => {
    const rect = { x0: 0, y0: 0, x1: 200, y1: 150 }
    const points = scatter(9, 30, rect, 25)
    expect(points).toHaveLength(30)
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(rect.x0)
      expect(p.x).toBeLessThanOrEqual(rect.x1)
      expect(p.y).toBeGreaterThanOrEqual(rect.y0)
      expect(p.y).toBeLessThanOrEqual(rect.y1)
    }
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThanOrEqual(25)
      }
    }
  })

  it('is deterministic for a given seed', () => {
    const rect = { x0: 0, y0: 0, x1: 100, y1: 100 }
    expect(scatter(4, 8, rect, 10)).toEqual(scatter(4, 8, rect, 10))
  })

  it('throws when the points cannot fit', () => {
    expect(() => scatter(1, 50, { x0: 0, y0: 0, x1: 10, y1: 10 }, 9)).toThrow(RangeError)
  })
})

describe('everyday steps', () => {
  it('has four Steps, each with a title, caption and description', () => {
    expect(EVERYDAY_STEP_COUNT).toBe(4)
    for (let i = 0; i < EVERYDAY_STEP_COUNT; i++) {
      const text = everydayStepText(i)
      expect(text.title.length).toBeGreaterThan(0)
      expect(text.caption.length).toBeGreaterThan(0)
      expect(text.description.length).toBeGreaterThan(0)
    }
  })

  it('clamps out-of-range and non-finite Step indices', () => {
    expect(clampEverydayStep(-3)).toBe(0)
    expect(clampEverydayStep(99)).toBe(3)
    expect(clampEverydayStep(Number.NaN)).toBe(0)
    expect(clampEverydayStep(2.4)).toBe(2)
  })
})

describe('matter scenes', () => {
  it('has one scene per Step', () => {
    expect(MATTER_SCENES).toHaveLength(MATTER_STEP_COUNT)
    expect(MATTER_STEP_FOCUS).toHaveLength(MATTER_STEP_COUNT)
  })

  it('keeps every particle inside the box interior', () => {
    for (const scene of MATTER_SCENES) {
      for (const item of scene.items) {
        const { x, y } = positionOf(item)
        expect(x - radiusOf(item)).toBeGreaterThanOrEqual(0)
        expect(x + radiusOf(item)).toBeLessThanOrEqual(MATTER_BOX.width)
        expect(y - radiusOf(item)).toBeGreaterThanOrEqual(0)
        expect(y + radiusOf(item)).toBeLessThanOrEqual(MATTER_BOX.height)
      }
    }
  })

  it('shows only the kinds of particle each Step describes', () => {
    const kinds = (i: number) =>
      [...new Set(MATTER_SCENES[i].items.map((item) => (item.kind === 'atom' ? item.element : item.formula)))].sort()
    expect(kinds(0)).toEqual(['H2O', 'Na', 'O2'])
    expect(kinds(1)).toEqual(['Na'])
    expect(kinds(2)).toEqual(['O2'])
    expect(kinds(3)).toEqual(['H2O'])
    expect(kinds(4)).toEqual(['N2', 'O2'])
    expect(kinds(5)).toEqual(['Fe', 'S'])
  })

  it('has about four nitrogen molecules to one oxygen molecule in air, matching roughly 79 % and 21 %', () => {
    const air = MATTER_SCENES[4].items
    const n2 = air.filter((item) => item.kind === 'molecule' && item.formula === 'N2').length
    const o2 = air.filter((item) => item.kind === 'molecule' && item.formula === 'O2').length
    expect(n2 + o2).toBe(19)
    expect(n2 / (n2 + o2)).toBeCloseTo(0.79, 1)
  })
})

describe('matter classification tree', () => {
  it('lists every parent before its children, so the tree can be drawn in one pass', () => {
    MATTER_TREE.forEach((node, i) => {
      if (node.parent >= 0) {
        expect(node.parent).toBeLessThan(i)
        expect(node.depth).toBe(MATTER_TREE[node.parent].depth + 1)
      } else {
        expect(node.depth).toBe(0)
      }
    })
  })

  it('never shows a child before its parent', () => {
    for (const node of MATTER_TREE) {
      if (node.parent >= 0) {
        expect(node.reveal).toBeGreaterThanOrEqual(MATTER_TREE[node.parent].reveal)
      }
    }
  })

  it('shows the focus node of every Step, with its ancestors, by that Step', () => {
    MATTER_STEP_FOCUS.forEach((focus, step) => {
      expect(MATTER_TREE[focus].reveal).toBeLessThanOrEqual(step)
      for (const ancestor of ancestorsOf(focus)) {
        expect(MATTER_TREE[ancestor].reveal).toBeLessThanOrEqual(step)
      }
    })
  })

  it('reveals the whole tree by the last Step', () => {
    const last = clampMatterStep(99)
    expect(last).toBe(MATTER_STEP_COUNT - 1)
    expect(MATTER_TREE.every((node) => node.reveal <= last)).toBe(true)
  })

  it('returns the ancestors of a node, nearest first', () => {
    const atoms = MATTER_TREE.findIndex((node) => node.id === 'atoms')
    expect(ancestorsOf(atoms).map((i) => MATTER_TREE[i].id)).toEqual(['element', 'pure', 'matter'])
  })
})
