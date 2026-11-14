import { describe, expect, it } from 'vitest'
import { MOLECULE_LAYOUTS } from '@/components/vocab/molecules'
import { atomRadius } from '@/components/vocab/atom'
import {
  MAX_EVENTS,
  MAX_MOLECULES,
  REACTION_OPTIONS,
  REACTOR_MOLECULE_SCALE,
  RESERVOIR,
  SITE,
  buildReactorPlan,
  clampCount,
  formulaLabel,
  frameAt,
  groupOffsets,
  optionById,
  placeInBand,
  summaryText,
  type ReactorPlan,
} from './limiting-reagent-plan'

const h2o = optionById('h2-o2')
const ch4 = optionById('ch4-o2')

function countsOf(plan: ReactorPlan, formula: string) {
  return plan.molecules.filter((m) => m.role === 'reactant' && m.species === formula).length
}

describe('buildReactorPlan', () => {
  it('draws every supplied reactant molecule exactly once', () => {
    const counts = { H2: 7, O2: 4 }
    const plan = buildReactorPlan(h2o, counts)
    expect(countsOf(plan, 'H2')).toBe(7)
    expect(countsOf(plan, 'O2')).toBe(4)
  })

  it('makes one product molecule per coefficient per whole event', () => {
    const plan = buildReactorPlan(h2o, { H2: 7, O2: 4 })
    // Limiting H2 (7 / 2 = 3.5), so 3 events: 6 H2O.
    expect(plan.outcome.events).toBe(3)
    const products = plan.molecules.filter((m) => m.role === 'product')
    expect(products).toHaveLength(6)
    expect(products.every((m) => m.formula === 'H2O')).toBe(true)
  })

  it('marks consumed reactants with an event and leaves the rest unreacted', () => {
    const plan = buildReactorPlan(h2o, { H2: 7, O2: 4 })
    const consumed = plan.molecules.filter((m) => m.role === 'reactant' && m.consumed)
    const left = plan.molecules.filter((m) => m.role === 'reactant' && !m.consumed)
    expect(consumed).toHaveLength(6 + 3)
    expect(left).toHaveLength(1 + 1)
    expect(consumed.every((m) => m.event !== undefined && m.gather !== undefined)).toBe(true)
    expect(left.every((m) => m.event === undefined)).toBe(true)
  })

  it('keeps the events inside the reaction-site grid', () => {
    const plan = buildReactorPlan(optionById('h2-o2'), { H2: 12, O2: 12 })
    expect(plan.outcome.events).toBe(6)
    expect(plan.cells).toHaveLength(MAX_EVENTS)
    for (const c of plan.cells) {
      expect(c.x).toBeGreaterThan(SITE.left)
      expect(c.x).toBeLessThan(600)
    }
  })

  it('is deterministic: the same inputs give identical positions', () => {
    const a = buildReactorPlan(ch4, { CH4: 5, O2: 9 })
    const b = buildReactorPlan(ch4, { CH4: 5, O2: 9 })
    expect(a.molecules).toEqual(b.molecules)
  })

  it('keeps earlier molecules in place when a count goes up', () => {
    const small = buildReactorPlan(h2o, { H2: 4, O2: 3 })
    const large = buildReactorPlan(h2o, { H2: 5, O2: 3 })
    const restOf = (plan: ReactorPlan) =>
      plan.molecules.filter((m) => m.role === 'reactant' && m.species === 'O2').map((m) => m.start)
    expect(restOf(large)).toEqual(restOf(small))
  })

  it('keeps reservoir molecules inside their band', () => {
    const plan = buildReactorPlan(optionById('n2-h2'), { N2: 12, H2: 12 })
    for (const m of plan.molecules) {
      if (m.role !== 'reactant' || m.consumed) continue
      const band = m.species === 'N2' ? 0 : 1
      const top = RESERVOIR.bandTop[band]
      expect(m.start.y).toBeGreaterThanOrEqual(top)
      expect(m.start.y).toBeLessThanOrEqual(top + RESERVOIR.bandHeight)
      expect(m.start.x).toBeGreaterThanOrEqual(RESERVOIR.left)
      expect(m.start.x).toBeLessThanOrEqual(RESERVOIR.right)
    }
  })
})

describe('frameAt', () => {
  it('starts with every molecule at its resting place and none glowing', () => {
    const plan = buildReactorPlan(ch4, { CH4: 4, O2: 7 })
    const frames = frameAt(plan, 0)
    expect(frames.every((f) => f.opacity === 1 || f.opacity === 0)).toBe(true)
    expect(frames.some((f) => f.glow)).toBe(false)
    const products = frames.filter((f) => f.opacity === 0)
    expect(products.length).toBe(plan.molecules.filter((m) => m.role === 'product').length)
  })

  it('ends with products shown, consumed reactants gone, and leftovers glowing', () => {
    const plan = buildReactorPlan(ch4, { CH4: 4, O2: 7 })
    const frames = frameAt(plan, 1)
    const byId = new Map(frames.map((f) => [f.id, f]))
    for (const m of plan.molecules) {
      const f = byId.get(m.id)!
      if (m.role === 'reactant' && m.consumed) expect(f.opacity).toBe(0)
      if (m.role === 'product') {
        expect(f.opacity).toBe(1)
        expect(f.x).toBeCloseTo(m.dest.x, 6)
        expect(f.y).toBeCloseTo(m.dest.y, 6)
      }
      if (m.role === 'reactant' && !m.consumed) expect(f.glow).toBe(true)
    }
  })

  it('clamps t outside 0 to 1', () => {
    const plan = buildReactorPlan(ch4, { CH4: 2, O2: 4 })
    expect(frameAt(plan, -1)).toEqual(frameAt(plan, 0))
    expect(frameAt(plan, 5)).toEqual(frameAt(plan, 1))
  })
})

describe('layout helpers', () => {
  it('places points inside the rectangle and deterministically', () => {
    const rect = { left: 0, right: 250, top: 0, bottom: 120 }
    const pts = placeInBand(7, 10, rect)
    expect(pts).toEqual(placeInBand(7, 10, rect))
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(250)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(120)
    }
  })

  it('centres group offsets on zero', () => {
    const offs = groupOffsets(3)
    expect(offs.reduce((s, o) => s + o.x, 0)).toBeCloseTo(0, 9)
  })

  it('keeps every pair of molecules in a cell clearly apart', () => {
    // Footprint of a molecule is about 50 by 20 units; a gap needs centres 64 apart in a row or 38 apart in a column.
    for (const n of [1, 2, 3, 4]) {
      const pts = groupOffsets(n)
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = Math.abs(pts[i].x - pts[j].x)
          const dy = Math.abs(pts[i].y - pts[j].y)
          const separated = dx >= 64 || dy >= 38
          expect(separated, `n=${n} slots ${i},${j}`).toBe(true)
        }
      }
      for (const p of pts) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(40)
        expect(Math.abs(p.y)).toBeLessThanOrEqual(30)
      }
    }
  })

  it('keeps reservoir molecules apart at the 12-molecule maximum', () => {
    // Footprint radius of a molecule as drawn: its farthest atom from the centre, plus that atom's radius.
    const radiusOf = (formula: string) => {
      const layout = MOLECULE_LAYOUTS[formula]
      const r = Math.max(
        ...layout.atoms.map((a) => Math.hypot(a.x, a.y) + atomRadius(a.element) * 0.5)
      )
      return r * REACTOR_MOLECULE_SCALE
    }
    for (const option of REACTION_OPTIONS) {
      const max = Object.fromEntries(option.reaction.reactants.map((r) => [r.formula, MAX_MOLECULES]))
      const plan = buildReactorPlan(option, max)
      for (const formula of option.reaction.reactants.map((r) => r.formula)) {
        const pts = plan.molecules.filter((m) => m.role === 'reactant' && m.species === formula).map((m) => m.start)
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
            const need = 2 * radiusOf(formula) + 4
            expect(d, `${option.id} ${formula} ${i},${j}`).toBeGreaterThanOrEqual(need)
          }
        }
      }
    }
  })

  it('clamps slider values to whole numbers from 0 to 12', () => {
    expect(clampCount(-3)).toBe(0)
    expect(clampCount(20)).toBe(12)
    expect(clampCount(4.6)).toBe(5)
    expect(clampCount(Number.NaN)).toBe(0)
  })

  it('writes formulas with subscripts', () => {
    expect(formulaLabel('CH4')).toBe('CH₄')
    expect(formulaLabel('H2O')).toBe('H₂O')
  })

  it('has three reactions, each with two reactants and a limiting default', () => {
    expect(REACTION_OPTIONS).toHaveLength(3)
    for (const option of REACTION_OPTIONS) {
      expect(option.reaction.reactants).toHaveLength(2)
      const plan = buildReactorPlan(option, option.defaults)
      expect(plan.outcome.events).toBeGreaterThan(0)
      expect(plan.outcome.limiting).toBeTruthy()
    }
  })

  it('reports the limiting reagent and leftovers in the summary', () => {
    const plan = buildReactorPlan(h2o, { H2: 7, O2: 4 })
    expect(summaryText(plan, false)).toContain('Limiting reagent: H₂')
    expect(summaryText(plan, true)).toContain('Left over: 1 H₂, 1 O₂')
  })
})
