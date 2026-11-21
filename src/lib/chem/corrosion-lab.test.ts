import { describe, expect, it } from 'vitest'
import {
  ENVIRONMENTS,
  RATE_LABELS,
  anodeE0,
  cathodeE0,
  corrosionState,
  environmentRate,
  rustFraction,
  standardPotential,
} from './corrosion-lab'

describe('corrosion-lab model', () => {
  it('bare iron rusts only where water and air are both present', () => {
    expect(corrosionState({ env: 'dry-air', protection: 'none', scratched: false }).anode).toBeNull()
    expect(corrosionState({ env: 'water-no-air', protection: 'none', scratched: false }).anode).toBeNull()
    const s = corrosionState({ env: 'water-air', protection: 'none', scratched: false })
    expect(s.anode).toBe('iron')
    expect(s.cathode).toBe('iron')
    expect(s.ironRate).toBe(environmentRate('water-air'))
  })

  it('salt water and acid corrode faster than water and air', () => {
    expect(environmentRate('salt-water')).toBeGreaterThan(environmentRate('water-air'))
    expect(environmentRate('acid')).toBeGreaterThan(environmentRate('salt-water'))
  })

  it('paint stops corrosion', () => {
    const s = corrosionState({ env: 'acid', protection: 'paint', scratched: false })
    expect(s.anode).toBeNull()
    expect(s.ironRate).toBe(0)
  })

  it('zinc corrodes instead of iron, even when scratched', () => {
    for (const scratched of [false, true]) {
      const s = corrosionState({ env: 'water-air', protection: 'zinc', scratched })
      expect(s.anode).toBe('zinc')
      expect(s.cathode).toBe('iron')
      expect(s.ironRate).toBe(0)
      expect(s.sacrificialRate).toBeGreaterThan(0)
    }
  })

  it('magnesium block is the anode and spares the iron', () => {
    const s = corrosionState({ env: 'salt-water', protection: 'magnesium', scratched: false })
    expect(s.anode).toBe('magnesium')
    expect(s.ironRate).toBe(0)
  })

  it('an intact tin coat protects, but a scratched one makes iron the anode and faster to rust', () => {
    expect(corrosionState({ env: 'water-air', protection: 'tin', scratched: false }).anode).toBeNull()
    const scratched = corrosionState({ env: 'water-air', protection: 'tin', scratched: true })
    expect(scratched.anode).toBe('iron')
    expect(scratched.cathode).toBe('tin')
    expect(scratched.ironRate).toBeGreaterThan(environmentRate('water-air'))
  })

  it('no rust without an electrolyte or oxygen, even with a scratched tin coat', () => {
    expect(corrosionState({ env: 'water-no-air', protection: 'tin', scratched: true }).anode).toBeNull()
    expect(corrosionState({ env: 'dry-air', protection: 'tin', scratched: true }).anode).toBeNull()
  })

  it('keeps every simulated comparison strictly ordered where an electrolyte and oxygen are present', () => {
    // Dry air and water without air give no rust for any protection, so they cannot be ordered.
    const wet = ENVIRONMENTS.filter((e) => e.hasWater && e.hasAir)
    expect(wet.map((e) => e.id)).toEqual(['water-air', 'salt-water', 'acid'])
    for (const { id } of wet) {
      const bare = corrosionState({ env: id, protection: 'none', scratched: false }).ironRate
      const tin = corrosionState({ env: id, protection: 'tin', scratched: true }).ironRate
      const zinc = corrosionState({ env: id, protection: 'zinc', scratched: true }).ironRate
      expect(bare, id).toBeGreaterThan(0)
      expect(tin, `scratched tin vs bare iron in ${id}`).toBeGreaterThan(bare)
      expect(zinc, `scratched zinc vs bare iron in ${id}`).toBeLessThan(bare)
    }
  })

  it('scale runs 0 to 5 with a label for every level, so scratched tin in acid stays above bare iron', () => {
    expect(RATE_LABELS).toHaveLength(6)
    expect(corrosionState({ env: 'acid', protection: 'none', scratched: false }).ironRate).toBe(4)
    expect(corrosionState({ env: 'acid', protection: 'tin', scratched: true }).ironRate).toBe(5)
  })

  it('rust fraction grows with time, is capped at 1 and is zero at rate 0', () => {
    expect(rustFraction(0, 52)).toBe(0)
    expect(rustFraction(2, 0)).toBe(0)
    expect(rustFraction(2, 10)).toBeLessThan(rustFraction(2, 20))
    expect(rustFraction(4, 52)).toBe(1)
  })

  it('standard potentials come from the NCERT table', () => {
    expect(standardPotential('iron')).toBe(-0.44)
    expect(anodeE0('zinc')).toBe(-0.76)
    expect(anodeE0('magnesium')).toBe(-2.36)
    expect(anodeE0('tin')).toBe(-0.14)
    expect(cathodeE0()).toBe(1.23)
  })
})
