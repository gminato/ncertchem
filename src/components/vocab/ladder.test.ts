import { describe, it, expect } from 'vitest'
import { ladderY, joulesToEv } from './ladder'
import { energyLevel } from '@/lib/chem/bohr'

describe('ladderY', () => {
  const options = {
    top: -50,
    bottom: 50,
    eMin: -13.6,
    eMax: -0.85,
  }

  it('maps endpoints exactly', () => {
    // eMin must map exactly to bottom
    expect(ladderY(options.eMin, options)).toBe(options.bottom)

    // eMax must map exactly to top
    expect(ladderY(options.eMax, options)).toBe(options.top)
  })

  it('maps linearly and monotonically with energy', () => {
    const energies = [-13.6, -10.0, -5.0, -3.4, -1.51, -0.85]
    const yValues = energies.map((e) => ladderY(e, options))

    // In SVG space where top < bottom, as energy increases, y strictly decreases
    for (let i = 0; i < yValues.length - 1; i++) {
      expect(yValues[i]).toBeGreaterThan(yValues[i + 1])
    }

    // Exact midpoint mapping
    const midEnergy = (options.eMin + options.eMax) / 2
    const midY = (options.top + options.bottom) / 2
    expect(ladderY(midEnergy, options)).toBeCloseTo(midY, 6)
  })

  it('renders physically proportional hydrogen energy levels (n = 1..4)', () => {
    const e1 = joulesToEv(energyLevel(1))
    const e2 = joulesToEv(energyLevel(2))
    const e3 = joulesToEv(energyLevel(3))
    const e4 = joulesToEv(energyLevel(4))

    const hydrogenOptions = {
      top: -46,
      bottom: 46,
      eMin: e1,
      eMax: e4,
    }

    const y1 = ladderY(e1, hydrogenOptions)
    const y2 = ladderY(e2, hydrogenOptions)
    const y3 = ladderY(e3, hydrogenOptions)
    const y4 = ladderY(e4, hydrogenOptions)

    // Endpoints map exactly
    expect(y1).toBe(46)
    expect(y4).toBe(-46)

    // Monotonic ordering
    expect(y1).toBeGreaterThan(y2)
    expect(y2).toBeGreaterThan(y3)
    expect(y3).toBeGreaterThan(y4)

    // n = 1 sits far below the cluster of n = 2, 3, 4
    const gap12 = y1 - y2
    const gap23 = y2 - y3
    const gap34 = y3 - y4

    expect(gap12).toBeGreaterThan(gap23 * 4)
    expect(gap23).toBeGreaterThan(gap34 * 2)
  })

  it('handles edge case when eMin equals eMax without division by zero', () => {
    expect(ladderY(-13.6, { top: -50, bottom: 50, eMin: -13.6, eMax: -13.6 })).toBe(50)
  })
})

describe('joulesToEv', () => {
  it('converts Joules to eV using 1 eV = 1.602e-19 J', () => {
    expect(joulesToEv(1.602e-19)).toBeCloseTo(1.0, 5)
    expect(joulesToEv(-2.18e-18)).toBeCloseTo(-13.608, 2)
  })
})
