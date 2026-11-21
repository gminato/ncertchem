import { describe, expect, it } from 'vitest'
import {
  DANIELL_EMF_V,
  electrodeMassChangeG,
  opposingMode,
  schematicCurrentMilliAmp,
} from './opposing-voltage'

describe('opposing voltage model', () => {
  it('Daniell EMF at unit concentration is 1.10 V (Cu2+/Cu 0.34 V minus Zn2+/Zn −0.76 V)', () => {
    expect(DANIELL_EMF_V).toBe(1.1)
  })

  it('classifies galvanic, balanced and electrolytic regimes', () => {
    expect(opposingMode(0)).toBe('galvanic')
    expect(opposingMode(1.0)).toBe('galvanic')
    expect(opposingMode(1.1)).toBe('balanced')
    expect(opposingMode(1.15)).toBe('electrolytic')
    expect(opposingMode(2.0)).toBe('electrolytic')
  })

  it('schematic current is positive below 1.1 V, zero at 1.1 V and negative above', () => {
    expect(schematicCurrentMilliAmp(0)).toBe(110)
    expect(schematicCurrentMilliAmp(0.5)).toBe(60)
    expect(schematicCurrentMilliAmp(1.1)).toBe(0)
    expect(schematicCurrentMilliAmp(1.5)).toBe(-40)
  })

  it('galvanic mode: zinc loses mass and copper gains it, in proportion to charge', () => {
    // 110 mA for 10 min = 66 C = 6.84e-4 mol e-; Zn: ×65.38/2, Cu: ×63.55/2
    const m = electrodeMassChangeG(0, 10)
    expect(m.zn).toBeCloseTo(-0.02236, 4)
    expect(m.cu).toBeCloseTo(0.02174, 4)
  })

  it('electrolytic mode reverses the mass changes', () => {
    const m = electrodeMassChangeG(2.0, 10)
    expect(m.zn).toBeGreaterThan(0)
    expect(m.cu).toBeLessThan(0)
  })

  it('balanced mode gives no mass change', () => {
    expect(electrodeMassChangeG(1.1, 30)).toEqual({ zn: 0, cu: 0 })
  })
})
