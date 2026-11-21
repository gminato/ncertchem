import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Beaker,
  beakerGeometry,
  Electrode,
  SaltBridge,
  Voltmeter,
  Galvanometer,
  Wire,
  GasBubbles,
  Ion,
  BatteryCutaway,
  needleAngle,
  flowFractions,
  pointAlong,
  bridgeCurve,
  conventionalSign,
  superscriptCharge,
  formulaRuns,
} from './index'

const angleOf = (html: string) => Number(/data-needle-angle="(-?[\d.]+)"/.exec(html)?.[1])

describe('needleAngle', () => {
  it('maps the range onto a symmetric sweep and clamps outside it', () => {
    expect(needleAngle(0, [0, 3], 240)).toBeCloseTo(-120)
    expect(needleAngle(3, [0, 3], 240)).toBeCloseTo(120)
    expect(needleAngle(1.5, [0, 3], 240)).toBeCloseTo(0)
    expect(needleAngle(9, [0, 3], 240)).toBeCloseTo(120)
    expect(needleAngle(-1, [0, 3], 240)).toBeCloseTo(-120)
  })

  it('lets a galvanometer swing either way from zero', () => {
    expect(needleAngle(0, [-1, 1], 110)).toBeCloseTo(0)
    expect(needleAngle(1, [-1, 1], 110)).toBeCloseTo(55)
    expect(needleAngle(-1, [-1, 1], 110)).toBeCloseTo(-55)
  })
})

describe('meters', () => {
  it('sets the needle for a value on the voltmeter', () => {
    expect(angleOf(renderToStaticMarkup(<Voltmeter value={1.1} range={[0, 3]} />))).toBeCloseTo(-120 + (1.1 / 3) * 240, 1)
    expect(angleOf(renderToStaticMarkup(<Voltmeter value={3} range={[0, 3]} />))).toBeCloseTo(120, 1)
  })

  it('swings the galvanometer needle negative for a negative value', () => {
    const html = renderToStaticMarkup(<Galvanometer value={-0.5} range={[-1, 1]} />)
    expect(angleOf(html)).toBeLessThan(0)
    expect(html).toContain('0')
  })

  it('shows the digital readout only when asked', () => {
    expect(renderToStaticMarkup(<Voltmeter value={1.1} digital />)).toContain('1.10 V')
    expect(renderToStaticMarkup(<Galvanometer value={0.25} digital={false} />)).not.toContain('0.250')
  })
})

describe('Electrode', () => {
  it('thins the lower part only when thinning is set', () => {
    const plain = renderToStaticMarkup(<Electrode material="zn" thinning={0} />)
    const eaten = renderToStaticMarkup(<Electrode material="zn" thinning={0.8} />)
    expect(eaten).not.toBe(plain)
  })

  it('adds a deposit layer only when plating is set', () => {
    expect(renderToStaticMarkup(<Electrode material="cu" plating={0} />)).not.toContain('<rect')
    const plated = renderToStaticMarkup(<Electrode material="pt" plating={0.5} depositMaterial="cu" />)
    expect(plated).toContain('<rect')
    expect(plated).toContain('var(--metal-cu)')
  })

  it('shows the polarity badge and the role tag', () => {
    const html = renderToStaticMarkup(<Electrode material="zn" polarity={'−'} role="anode" />)
    expect(html).toContain('−')
    expect(html).toContain('Anode')
  })
})

describe('electron flow', () => {
  it('moves the forward dots from the first point to the last', () => {
    expect(flowFractions(3, 0, 'forward')).toEqual([0, 1 / 3, 2 / 3])
    const p = pointAlong([{ x: 0, y: 0 }, { x: 100, y: 0 }], 0.1)
    expect(p.x).toBeCloseTo(10)
  })

  it('reverses the dots when the direction is reverse', () => {
    const p = pointAlong([{ x: 0, y: 0 }, { x: 100, y: 0 }], 1 - 0.1)
    expect(p.x).toBeCloseTo(90)
    expect(flowFractions(1, 0.1, 'reverse')[0]).toBeCloseTo(0.9)
  })

  it('points the conventional current opposite to the electrons', () => {
    expect(conventionalSign('forward')).toBe(-1)
    expect(conventionalSign('reverse')).toBe(1)
  })
})

describe('deterministic output', () => {
  it('renders the same markup for the same props', () => {
    const a = renderToStaticMarkup(<GasBubbles x={10} y={100} t={0.37} count={5} formula="H2" />)
    const b = renderToStaticMarkup(<GasBubbles x={10} y={100} t={0.37} count={5} formula="H2" />)
    expect(a).toBe(b)
    const w1 = renderToStaticMarkup(<Wire corners={[{ x: 0, y: 0 }, { x: 80, y: 0 }]} t={0.4} />)
    const w2 = renderToStaticMarkup(<Wire corners={[{ x: 0, y: 0 }, { x: 80, y: 0 }]} t={0.4} />)
    expect(w1).toBe(w2)
  })

  it('draws the bridge ions in the same place for the same t', () => {
    const props = { start: { x: 0, y: 60 }, finish: { x: 200, y: 60 }, apex: 0 }
    expect(renderToStaticMarkup(<SaltBridge {...props} t={0.2} />)).toBe(renderToStaticMarkup(<SaltBridge {...props} t={0.2} />))
  })
})

describe('geometry helpers', () => {
  it('lifts the salt bridge to the requested apex', () => {
    const { points } = bridgeCurve({ x: 0, y: 100 }, { x: 200, y: 100 }, 20)
    const top = Math.min(...points.map((p) => p.y))
    expect(top).toBeGreaterThan(19)
    expect(top).toBeLessThan(22)
  })

  it('fills the beaker to the level it is given', () => {
    const empty = beakerGeometry({ y: 0, height: 100, level: 0 })
    const full = beakerGeometry({ y: 0, height: 100, level: 1 })
    expect(full.liquidTop).toBeLessThan(empty.liquidTop)
  })

  it('writes charges and subscripts as Unicode and tspan runs', () => {
    expect(superscriptCharge('2+')).toBe('²⁺')
    expect(superscriptCharge('2−')).toBe('²⁻')
    expect(formulaRuns('SO4')).toEqual([
      { text: 'SO', sub: false },
      { text: '4', sub: true },
    ])
  })

  it('renders an ion with its formula and charge', () => {
    const html = renderToStaticMarkup(<Ion formula="Zn" charge="2+" />)
    expect(html).toContain('Zn')
    expect(html).toContain('²⁺')
  })
})

describe('shapes', () => {
  it('renders a beaker, a battery case and its clipped children', () => {
    expect(renderToStaticMarkup(<Beaker x={0} y={0} level={0.5} tint="blue" label="CuSO₄(aq)" />)).toContain('CuSO₄(aq)')
    const html = renderToStaticMarkup(
      <BatteryCutaway x={0} y={0} width={100} height={160} shape="can">
        <circle cx={50} cy={80} r={4} />
      </BatteryCutaway>
    )
    expect(html).toContain('clip-path')
    expect(html).toContain('<circle')
  })

  it('renders a wire with its conventional-current arrow', () => {
    const html = renderToStaticMarkup(<Wire corners={[{ x: 0, y: 0 }, { x: 100, y: 0 }]} currentArrow currentLabel="I" />)
    expect(html).toContain('var(--current)')
  })
})
