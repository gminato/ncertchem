import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { tailFractions } from './MaxwellBoltzmann'
import {
  EnergyProfile,
  MaxwellBoltzmannCurve,
  PlotFrame,
  PlotLine,
  PlotCurve,
  clipSegment,
  erfc,
  fractionAbove,
  makePlotScale,
  maxwellBoltzmann,
  niceTicks,
  thetaFor,
} from './index'

const BOX = { left: 80, top: 20, width: 480, height: 240 }

/** All numbers in a path's d attribute, as pairs. */
function pairsOf(d: string): Array<[number, number]> {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  const out: Array<[number, number]> = []
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i], nums[i + 1]])
  return out
}

function pathWithStroke(markup: string, stroke: string): string {
  const re = new RegExp(`<path d="([^"]+)"[^>]*stroke="${stroke.replace(/[()]/g, '\\$&')}"`)
  const m = re.exec(markup)
  if (!m) throw new Error(`no path with stroke ${stroke}`)
  return m[1]
}

describe('plot scale', () => {
  const scale = makePlotScale({ xMin: 0, xMax: 100, yMin: -2.5, yMax: 0.5 }, BOX)

  it('maps data to pixels and back in both axes', () => {
    expect(scale.x(0)).toBeCloseTo(BOX.left)
    expect(scale.x(100)).toBeCloseTo(BOX.left + BOX.width)
    expect(scale.y(0.5)).toBeCloseTo(BOX.top)
    expect(scale.y(-2.5)).toBeCloseTo(BOX.top + BOX.height)
    for (const v of [0, 13.5, 100]) expect(scale.xInv(scale.x(v))).toBeCloseTo(v)
    for (const v of [-2.5, -1.2, 0, 0.5]) expect(scale.yInv(scale.y(v))).toBeCloseTo(v)
  })

  it('handles negative ranges: y = 0 sits inside the window, x axis at the bottom', () => {
    expect(scale.y(0)).toBeGreaterThan(BOX.top)
    expect(scale.y(0)).toBeLessThan(BOX.top + BOX.height)
    expect(scale.y(-2)).toBeGreaterThan(scale.y(0))
  })

  it('produces nice tick values that cover the range', () => {
    const t = niceTicks(0, 100, 5)
    expect(t[0]).toBe(0)
    expect(t[t.length - 1]).toBe(100)
    expect(niceTicks(-2.5, 0.5, 5)).toEqual([-2, -1, 0])
  })
})

describe('clipping to the frame', () => {
  it('clips a crossing line to the box edges', () => {
    const seg = clipSegment({ x: 0, y: 0 }, { x: 1000, y: 1000 }, BOX)
    expect(seg).not.toBeNull()
    const [p, q] = seg!
    for (const pt of [p, q]) {
      expect(pt.x).toBeGreaterThanOrEqual(BOX.left - 1e-6)
      expect(pt.x).toBeLessThanOrEqual(BOX.left + BOX.width + 1e-6)
      expect(pt.y).toBeGreaterThanOrEqual(BOX.top - 1e-6)
      expect(pt.y).toBeLessThanOrEqual(BOX.top + BOX.height + 1e-6)
    }
  })

  it('returns null for a line that misses the box', () => {
    expect(clipSegment({ x: 0, y: 0 }, { x: 10, y: 0 }, BOX)).toBeNull()
  })

  it('PlotLine is drawn only inside the frame', () => {
    const markup = renderToStaticMarkup(
      <svg>
        <PlotFrame x={BOX.left} y={BOX.top} width={BOX.width} height={BOX.height} domain={{ xMin: 0, xMax: 100, yMin: 0, yMax: 1 }}>
          <PlotLine through={{ x: 40, y: 0.45 }} slope={-0.009} />
        </PlotFrame>
      </svg>
    )
    const d = pathWithStroke(markup, 'var(--fg-muted)')
    for (const [px, py] of pairsOf(d)) {
      expect(px).toBeGreaterThanOrEqual(BOX.left - 0.01)
      expect(px).toBeLessThanOrEqual(BOX.left + BOX.width + 0.01)
      expect(py).toBeGreaterThanOrEqual(BOX.top - 0.01)
      expect(py).toBeLessThanOrEqual(BOX.top + BOX.height + 0.01)
    }
  })

  it('PlotCurve samples a function across the window', () => {
    const markup = renderToStaticMarkup(
      <svg>
        <PlotFrame x={BOX.left} y={BOX.top} width={BOX.width} height={BOX.height} domain={{ xMin: 0, xMax: 10, yMin: 0, yMax: 1 }}>
          <PlotCurve fn={(x) => Math.exp(-x / 5)} from={0} to={10} samples={11} tone="reactant" />
        </PlotFrame>
      </svg>
    )
    expect(markup).toContain('var(--kin-reactant)')
  })
})

describe('EnergyProfile', () => {
  const props = { x: 70, y: 20, width: 470, height: 240, reactant: 0, product: -40, profile: [0, 90, -40], catalysed: [0, 55, -40] }

  it('places the peak at the given height relative to the end levels', () => {
    const markup = renderToStaticMarkup(
      <svg>
        <EnergyProfile {...props} />
      </svg>
    )
    const pts = pairsOf(pathWithStroke(markup, 'var(--accent)'))
    const yReactant = pts[0][1]
    const yProduct = pts[pts.length - 1][1]
    const yPeak = Math.min(...pts.map((p) => p[1]))
    // A linear energy scale: the reactant-to-peak height is 90 units, the reactant-to-product height is 40 units.
    expect((yReactant - yPeak) / (yProduct - yReactant)).toBeCloseTo(90 / 40, 1)
  })

  it('the catalysed path shares both end levels and has a lower peak', () => {
    const markup = renderToStaticMarkup(
      <svg>
        <EnergyProfile {...props} />
      </svg>
    )
    const main = pairsOf(pathWithStroke(markup, 'var(--accent)'))
    const cat = pairsOf(pathWithStroke(markup, 'var(--kin-catalyst)'))
    expect(cat[0][1]).toBeCloseTo(main[0][1], 6)
    expect(cat[cat.length - 1][1]).toBeCloseTo(main[main.length - 1][1], 6)
    expect(Math.min(...cat.map((p) => p[1]))).toBeGreaterThan(Math.min(...main.map((p) => p[1])))
  })
})

describe('Maxwell–Boltzmann curves', () => {
  const T1 = 300
  const T2 = 310
  const th1 = thetaFor(T1, T1, 2)
  const th2 = thetaFor(T2, T1, 2)

  it('each curve has unit area', () => {
    for (const th of [th1, th2]) {
      let area = 0
      const h = 0.001
      for (let E = h / 2; E < 80; E += h) area += maxwellBoltzmann(E, th) * h
      expect(area).toBeCloseTo(1, 3)
    }
  })

  it('the hotter peak is to the right and lower than the cooler peak', () => {
    expect(th2 / 2).toBeGreaterThan(th1 / 2)
    const peak = (th: number) => maxwellBoltzmann(th / 2, th)
    expect(peak(th2)).toBeLessThan(peak(th1))
  })

  it('the tail above Ea grows with temperature and matches a numerical integral', () => {
    const Ea = 2.2
    let tail = 0
    const h = 0.001
    for (let E = Ea; E < 80; E += h) tail += maxwellBoltzmann(E, th2) * h
    expect(fractionAbove(Ea, th2)).toBeCloseTo(tail, 3)
    expect(fractionAbove(Ea, th2)).toBeGreaterThan(fractionAbove(Ea, th1))
  })

  it('erfc and the tail are exact at their limits', () => {
    expect(erfc(0)).toBeCloseTo(1, 6)
    expect(fractionAbove(0, th1)).toBeCloseTo(1, 6)
  })

  it('renders the same markup every time (deterministic)', () => {
    const el = <MaxwellBoltzmannCurve x={84} y={18} width={488} height={250} temperatures={[300, 310]} ea={2.2} labels={['300 K', '310 K']} />
    expect(renderToStaticMarkup(el)).toBe(renderToStaticMarkup(el))
  })

  it('a schematic spread gives a flatter, lower, rightward second curve with a larger tail', () => {
    const [tail1, tail2] = tailFractions([300, 310], 2.2, 300, 2, 1.25)
    expect(tail2).toBeGreaterThan(tail1)
    const th = 2 * 1.25
    expect(maxwellBoltzmann(th / 2, th)).toBeLessThan(maxwellBoltzmann(1, 2))
    let area = 0
    const h = 0.001
    for (let E = h / 2; E < 80; E += h) area += maxwellBoltzmann(E, th) * h
    expect(area).toBeCloseTo(1, 3)
  })
})
