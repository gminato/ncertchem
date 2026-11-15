import { describe, expect, it } from 'vitest'
import { BUFFER_PAIRS, SALT_CASES, designBuffer, saltPH } from './buffer-designer-model'

const r2 = (x: number) => Math.round(x * 100) / 100
const acetic = BUFFER_PAIRS[0]

describe('buffer designer model', () => {
  it('gives pKa 4.76 for acetic acid and 9.25 for NH4+ (NCERT Tables 6.6 and 6.7)', () => {
    expect(r2(acetic.pKa)).toBe(4.76)
    expect(r2(BUFFER_PAIRS[2].pKa)).toBe(9.25)
    expect(r2(BUFFER_PAIRS[1].pKa)).toBe(7.52)
  })

  it('reproduces the 1:1 acetate buffer as pH = pKa', () => {
    const d = designBuffer({ pair: acetic, baseShare: 0.5, totalConc: 0.1, addedMmol: 0 })
    expect(d.pHStart).toBeCloseTo(acetic.pKa, 12)
    expect(d.acidConc).toBeCloseTo(0.05, 12)
  })

  it('gives pH 5.06 for twice as much salt as acid', () => {
    const d = designBuffer({ pair: acetic, baseShare: 2 / 3, totalConc: 0.3, addedMmol: 0 })
    expect(r2(d.pHStart)).toBe(5.06)
  })

  it('takes the basic buffer pH from the base share (ammonia, 2:1 base to acid gives 9.55)', () => {
    const d = designBuffer({ pair: BUFFER_PAIRS[2], baseShare: 2 / 3, totalConc: 0.3, addedMmol: 0 })
    expect(r2(d.pHStart)).toBe(9.55)
  })

  it('moves the pH of a 10 mmol / 10 mmol acetate buffer after 0.5 mmol HCl (total 0.20 M in 100 mL)', () => {
    const d = designBuffer({ pair: acetic, baseShare: 0.5, totalConc: 0.2, addedMmol: 0.5 })
    expect(r2(d.pHBuffer)).toBe(4.72)
    expect(r2(d.pHWater)).toBe(2.3)
    expect(d.acidMmol).toBeCloseTo(10.5, 12)
    expect(d.baseMmol).toBeCloseTo(9.5, 12)
    expect(d.exceedsCapacity).toBe(false)
  })

  it('flags an addition beyond the buffer capacity', () => {
    const d = designBuffer({ pair: acetic, baseShare: 0.5, totalConc: 0.1, addedMmol: 12 })
    expect(d.exceedsCapacity).toBe(true)
    const base = designBuffer({ pair: acetic, baseShare: 0.5, totalConc: 0.1, addedMmol: -12 })
    expect(base.exceedsCapacity).toBe(true)
  })

  it('uses the water pH for pure water when nothing is added', () => {
    const d = designBuffer({ pair: acetic, baseShare: 0.5, totalConc: 0.1, addedMmol: 0 })
    expect(r2(d.pHWater)).toBe(7)
  })

  it('rejects a base share at the ends or a non-positive concentration', () => {
    expect(() => designBuffer({ pair: acetic, baseShare: 0, totalConc: 0.1, addedMmol: 0 })).toThrow(RangeError)
    expect(() => designBuffer({ pair: acetic, baseShare: 0.5, totalConc: 0, addedMmol: 0 })).toThrow(RangeError)
  })

  it('gives the four salt types their NCERT pH formulas', () => {
    const [nacl, naac, nh4cl, nh4hcoo] = SALT_CASES
    expect(saltPH(nacl, 0.1)).toMatchObject({ pH: 7, nature: 'neutral' })
    expect(r2(saltPH(naac, 0.1).pH)).toBe(8.88)
    expect(saltPH(naac, 0.1).nature).toBe('alkaline')
    expect(r2(saltPH(nh4cl, 0.1).pH)).toBe(5.12)
    expect(saltPH(nh4cl, 0.1).nature).toBe('acidic')
    expect(r2(saltPH(nh4hcoo, 0.1).pH)).toBe(6.5)
    expect(r2(saltPH(nh4hcoo, 0.01).pH)).toBe(6.5)
  })
})
