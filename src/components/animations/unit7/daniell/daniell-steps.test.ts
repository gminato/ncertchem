import { describe, expect, it } from 'vitest'
import { DANIELL_STEP_COUNT, daniellStep } from './daniell-steps'
import { cellEmf, lookupPotential } from '@/lib/chem/electrode-potentials'

describe('daniellStep', () => {
  it('has exactly 6 steps', () => {
    expect(DANIELL_STEP_COUNT).toBe(6)
  })

  it('clamps indices outside [0, 5]', () => {
    expect(daniellStep(-1).step).toBe(0)
    expect(daniellStep(10).step).toBe(5)
  })

  it('computes library-backed standard potentials', () => {
    const s0 = daniellStep(0)
    expect(s0.e0Cathode).toBeCloseTo(0.34, 2)
    expect(s0.e0Anode).toBeCloseTo(-0.76, 2)
    expect(s0.e0Cell).toBeCloseTo(1.10, 2)
    expect(s0.e0Cell).toBe(cellEmf('Cu2+/Cu', 'Zn2+/Zn'))
    expect(s0.e0Cathode).toBe(lookupPotential('Cu2+/Cu'))
    expect(s0.e0Anode).toBe(lookupPotential('Zn2+/Zn'))
  })

  it('progression steps have correct circuit and bridge states', () => {
    // Step 0: direct reaction, single beaker
    const step0 = daniellStep(0)
    expect(step0.mode).toBe('single-beaker')
    expect(step0.hasBridge).toBe(false)
    expect(step0.hasWire).toBe(false)
    expect(step0.voltage).toBe('0.00 V')

    // Step 1: separated beakers
    const step1 = daniellStep(1)
    expect(step1.mode).toBe('separated')
    expect(step1.hasBridge).toBe(false)
    expect(step1.hasWire).toBe(false)

    // Step 2: wire only (no bridge, open circuit effect)
    const step2 = daniellStep(2)
    expect(step2.mode).toBe('wire-only')
    expect(step2.hasBridge).toBe(false)
    expect(step2.hasWire).toBe(true)
    expect(step2.voltage).toBe('0.00 V')

    // Step 3: bridge inserted
    const step3 = daniellStep(3)
    expect(step3.mode).toBe('bridge-inserted')
    expect(step3.hasBridge).toBe(true)
    expect(step3.hasWire).toBe(true)
    expect(step3.switchOn).toBe(false)

    // Step 4: active flow
    const step4 = daniellStep(4)
    expect(step4.mode).toBe('active-flow')
    expect(step4.hasBridge).toBe(true)
    expect(step4.hasWire).toBe(true)
    expect(step4.switchOn).toBe(true)
    expect(step4.voltage).toBe('1.10 V')

    // Step 5: full cell potential
    const step5 = daniellStep(5)
    expect(step5.mode).toBe('full-potential')
    expect(step5.hasBridge).toBe(true)
    expect(step5.hasWire).toBe(true)
    expect(step5.switchOn).toBe(true)
    expect(step5.voltage).toBe('1.10 V')
    expect(step5.working).toContain('1.10 V')
  })
})
