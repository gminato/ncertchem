import { describe, it, expect } from 'vitest'
import {
  clamp01,
  crossoverTemperature,
  enthalpyLevelLayout,
  enthalpyY,
  gibbsCase,
  gibbsEnergy,
  isothermPoints,
  isothermPressure,
  latmToKilojoules,
  latticeField,
  manyStepPoints,
  mulberry32,
  oneStepPoints,
  pathWork,
  pistonGasFraction,
  scatterField,
  spacedScatter,
  spontaneousIntervals,
  temperatureLevel,
  thermometerLevel,
  workAreaPolygon,
} from './geometry'

const NRT = 24.6 // 1 mol at 300 K, L atm

describe('isotherm', () => {
  it('follows p = nRT / V at every sample', () => {
    const pts = isothermPoints(NRT, 2, 10, 32)
    expect(pts).toHaveLength(33)
    expect(pts[0].v).toBeCloseTo(2, 9)
    expect(pts[pts.length - 1].v).toBeCloseTo(10, 9)
    for (const pt of pts) {
      expect(pt.p).toBeCloseTo(NRT / pt.v, 9)
    }
  })

  it('halves the pressure when the volume doubles', () => {
    expect(isothermPressure(NRT, 4) * 2).toBeCloseTo(isothermPressure(NRT, 2), 9)
  })
})

describe('signed work', () => {
  it('gives the reversible work -nRT ln(V2/V1) for an isotherm', () => {
    const w = pathWork(isothermPoints(NRT, 2, 10, 400))
    expect(w).toBeCloseTo(-NRT * Math.log(5), 2)
    expect(w).toBeLessThan(0)
  })

  it('gives the one-step irreversible work -p_ext ΔV', () => {
    const pExt = NRT / 10
    const w = pathWork(oneStepPoints(NRT / 2, 2, 10, pExt))
    expect(w).toBeCloseTo(-pExt * 8, 9)
  })

  it('is positive for a compression', () => {
    const w = pathWork(oneStepPoints(NRT / 10, 10, 2, NRT / 2))
    expect(w).toBeGreaterThan(0)
    expect(w).toBeCloseTo(NRT / 2 * 8, 9)
  })

  it('moves towards the reversible value as the number of steps grows', () => {
    const reversible = -NRT * Math.log(5)
    const oneStep = pathWork(oneStepPoints(NRT / 2, 2, 10, NRT / 10))
    const four = pathWork(manyStepPoints(NRT, 2, 10, 4))
    const sixteen = pathWork(manyStepPoints(NRT, 2, 10, 16))

    expect(Math.abs(oneStep)).toBeLessThan(Math.abs(four))
    expect(Math.abs(four)).toBeLessThan(Math.abs(sixteen))
    expect(Math.abs(sixteen)).toBeLessThan(Math.abs(reversible))
    expect(Math.abs(reversible - sixteen)).toBeLessThan(Math.abs(reversible - four))
  })

  it('closes the work-area polygon back along the volume axis', () => {
    const path = oneStepPoints(NRT / 2, 2, 10, NRT / 10)
    const poly = workAreaPolygon(path)
    expect(poly).toHaveLength(path.length + 2)
    expect(poly[poly.length - 2]).toEqual({ v: 10, p: 0 })
    expect(poly[poly.length - 1]).toEqual({ v: 2, p: 0 })
  })

  it('converts L atm to kJ', () => {
    expect(latmToKilojoules(1)).toBeCloseTo(0.101325, 6)
  })
})

describe('many-step path', () => {
  it('starts and ends on the isotherm and uses constant-pressure runs', () => {
    const pts = manyStepPoints(NRT, 2, 10, 4)
    expect(pts[0]).toEqual({ v: 2, p: NRT / 2 })
    const end = pts[pts.length - 1]
    expect(end.v).toBeCloseTo(10, 9)
    expect(end.p).toBeCloseTo(NRT / 10, 9)
    // Each horizontal run has one pressure at both of its ends.
    for (let i = 1; i < pts.length - 1; i += 2) {
      expect(pts[i].p).toBeCloseTo(pts[i + 1].p, 9)
      expect(pts[i].v).toBeCloseTo(pts[i - 1].v, 9)
    }
  })
})

describe('piston and temperature scales', () => {
  it('keeps a visible gas column at zero volume', () => {
    expect(pistonGasFraction(0)).toBeCloseTo(0.2, 9)
    expect(pistonGasFraction(1)).toBeCloseTo(1, 9)
    expect(pistonGasFraction(2)).toBeCloseTo(1, 9)
  })

  it('maps temperature onto 0 to 1 and clamps outside it', () => {
    expect(temperatureLevel(250)).toBe(0)
    expect(temperatureLevel(600)).toBe(1)
    expect(temperatureLevel(100)).toBe(0)
    expect(temperatureLevel(900)).toBe(1)
    expect(temperatureLevel(425)).toBeCloseTo(0.5, 9)
  })

  it('maps a temperature rise onto the thermometer scale', () => {
    expect(thermometerLevel(2.5, 10)).toBeCloseTo(0.25, 9)
    expect(thermometerLevel(20, 10)).toBe(1)
    expect(thermometerLevel(-1, 10)).toBe(0)
    expect(thermometerLevel(1, 0)).toBe(0)
    expect(clamp01(1.4)).toBe(1)
  })
})

describe('enthalpy level layout', () => {
  const scale = { top: 20, bottom: 220, hMin: -400, hMax: 0 }

  it('puts higher enthalpy higher on the page', () => {
    expect(enthalpyY(0, scale)).toBeCloseTo(20, 9)
    expect(enthalpyY(-400, scale)).toBeCloseTo(220, 9)
    expect(enthalpyY(-110.5, scale)).toBeLessThan(enthalpyY(-393.5, scale))
  })

  it('keeps labels apart while staying in input order', () => {
    const levels = [0, -1, -2, -200]
    const { rungY, labels } = enthalpyLevelLayout(levels, scale, 14)
    expect(rungY).toHaveLength(4)
    const sorted = labels.map((l) => l.labelY).sort((a, b) => a - b)
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i + 1] - sorted[i]).toBeGreaterThanOrEqual(14 - 1e-3)
    }
    expect(labels[3].nudged).toBe(false)
    expect(labels[0].rungY).toBeCloseTo(rungY[0], 9)
  })
})

describe('deterministic particle positions', () => {
  const box = { x0: 0, y0: 0, x1: 200, y1: 160 }

  it('mulberry32 repeats for the same seed and differs between seeds', () => {
    const a = mulberry32(7)
    const b = mulberry32(7)
    const c = mulberry32(8)
    const seqA = [a(), a(), a()]
    expect([b(), b(), b()]).toEqual(seqA)
    expect(c()).not.toBe(seqA[0])
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('scatters points inside the box, identically for the same seed', () => {
    const first = scatterField(30, box, 42)
    expect(scatterField(30, box, 42)).toEqual(first)
    for (const p of first) {
      expect(p.x).toBeGreaterThanOrEqual(box.x0)
      expect(p.x).toBeLessThan(box.x1)
      expect(p.y).toBeGreaterThanOrEqual(box.y0)
      expect(p.y).toBeLessThan(box.y1)
    }
  })

  it('spaces scattered points apart and stays deterministic', () => {
    const pts = spacedScatter(24, box, 9, 26)
    expect(pts).toHaveLength(24)
    expect(spacedScatter(24, box, 9, 26)).toEqual(pts)
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)).toBeGreaterThanOrEqual(26 - 1e-9)
      }
    }
  })

  it('still returns the full count when the spacing cannot be met', () => {
    const pts = spacedScatter(40, { x0: 0, y0: 0, x1: 20, y1: 20 }, 3, 50)
    expect(pts).toHaveLength(40)
  })

  it('places a lattice on its sites when jitter is zero', () => {
    const pts = latticeField(4, 2, box, 0, 1)
    expect(pts).toHaveLength(8)
    expect(pts[0]).toEqual({ x: 25, y: 40 })
    expect(pts[7]).toEqual({ x: 175, y: 120 })
  })

  it('keeps jittered lattice points within their cells', () => {
    const cols = 5
    const rows = 4
    const pts = latticeField(cols, rows, box, 0.3, 9)
    expect(latticeField(cols, rows, box, 0.3, 9)).toEqual(pts)
    const cellW = 200 / cols
    const cellH = 160 / rows
    pts.forEach((p, i) => {
      const c = i % cols
      const r = Math.floor(i / cols)
      expect(Math.abs(p.x - (c + 0.5) * cellW)).toBeLessThanOrEqual(0.3 * cellW + 1e-9)
      expect(Math.abs(p.y - (r + 0.5) * cellH)).toBeLessThanOrEqual(0.3 * cellH + 1e-9)
    })
  })
})

describe('Gibbs energy cases', () => {
  it('computes ΔG = ΔH − TΔS in kJ mol⁻¹', () => {
    expect(gibbsEnergy(-92.2, -198.8, 300)).toBeCloseTo(-92.2 + 59.64, 6)
    expect(gibbsEnergy(178.3, 160.6, 1000)).toBeCloseTo(-(160.6) + 178.3, 6)
  })

  it('classifies the four sign cases', () => {
    expect(gibbsCase(-196, 125.8)).toBe('always')
    expect(gibbsCase(196, -125.8)).toBe('never')
    expect(gibbsCase(-92.2, -198.8)).toBe('low-T')
    expect(gibbsCase(178.3, 160.6)).toBe('high-T')
  })

  it('finds the crossover only when it is a positive temperature', () => {
    expect(crossoverTemperature(-92.2, -198.8)).toBeCloseTo(463.8, 0)
    expect(crossoverTemperature(178.3, 160.6)).toBeCloseTo(1110.2, 0)
    expect(crossoverTemperature(-196, 125.8)).toBeNull()
    expect(crossoverTemperature(10, 0)).toBeNull()
  })

  it('reports the spontaneous interval for each case', () => {
    expect(spontaneousIntervals(-196, 125.8, 200, 1000)).toEqual([[200, 1000]])
    expect(spontaneousIntervals(196, -125.8, 200, 1000)).toEqual([])

    const low = spontaneousIntervals(-92.2, -198.8, 200, 1000)
    expect(low).toHaveLength(1)
    expect(low[0][0]).toBe(200)
    expect(low[0][1]).toBeCloseTo(463.8, 0)

    const high = spontaneousIntervals(178.3, 160.6, 200, 1500)
    expect(high).toHaveLength(1)
    expect(high[0][0]).toBeCloseTo(1110.2, 0)
    expect(high[0][1]).toBe(1500)
  })
})
