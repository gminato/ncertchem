import { describe, expect, it } from 'vitest'
import {
  GAP_STEP_COUNT,
  MEYER_STEP_COUNT,
  OCTAVE_ELEMENTS,
  OCTAVE_STEP_COUNT,
  TRIAD_STEP_COUNT,
  gapStep,
  meyerStep,
  octaveStep,
  triadStep,
  triadStepMean,
} from './history-steps'
import { clampIndex } from './steps'

describe('clampIndex', () => {
  it('clamps to the Step range and maps non-finite input to Step 0', () => {
    expect(clampIndex(-3, 4)).toBe(0)
    expect(clampIndex(9, 4)).toBe(3)
    expect(clampIndex(Number.NaN, 4)).toBe(0)
  })
})

describe('Döbereiner triads', () => {
  it('walks the three triads of Table 3.1 in order', () => {
    expect(TRIAD_STEP_COUNT).toBe(4)
    expect(triadStep(0).triad).toBe(0)
    expect(triadStep(2).triad).toBe(1)
    expect(triadStep(3).triad).toBe(2)
  })

  it('computes the mean of the outer two: Li/K = 23, Ca/Ba = 88.5, Cl/I = 81.25', () => {
    expect(triadStepMean(0)).toBe(23)
    expect(triadStepMean(2)).toBe(88.5)
    expect(triadStepMean(3)).toBe(81.25)
  })

  it('shows the middle element at its own weight only from Step 1', () => {
    expect(triadStep(0).showMiddle).toBe(false)
    expect(triadStep(1).middleAtOwnWeight).toBe(true)
  })
})

describe('Newlands octaves', () => {
  it('lists the sixteen elements of Table 3.2 in order', () => {
    expect(OCTAVE_ELEMENTS).toHaveLength(16)
    expect(OCTAVE_ELEMENTS[0].symbol).toBe('Li')
    expect(OCTAVE_ELEMENTS[7].symbol).toBe('Na')
    expect(OCTAVE_ELEMENTS[15].symbol).toBe('Ca')
  })

  it('echoes the first element at the eighth position', () => {
    expect(OCTAVE_STEP_COUNT).toBe(4)
    expect(octaveStep(2).lit).toEqual([0, 7])
    expect(octaveStep(2).echoArc).toBe(true)
    expect(octaveStep(3).breakMarker).toBe(true)
  })
})

describe("Lothar Meyer's curve", () => {
  it('reveals the alkali metals as the curve builds', () => {
    expect(MEYER_STEP_COUNT).toBe(4)
    expect(meyerStep(0).labelled).toEqual(['Li'])
    expect(meyerStep(1).labelled).toEqual(['Li', 'Na'])
    expect(meyerStep(3).labelled).toEqual(['Li', 'Na', 'K', 'Rb', 'Cs'])
  })

  it('never shows a point beyond its maximum Z', () => {
    for (let i = 0; i < MEYER_STEP_COUNT; i++) {
      const { maxZ, points } = meyerStep(i)
      expect(points.every((p) => p.Z <= maxZ)).toBe(true)
    }
  })
})

describe('Mendeleev gaps', () => {
  it('outlines the gallium and germanium gaps and swaps tellurium and iodine', () => {
    expect(GAP_STEP_COUNT).toBe(4)
    expect(gapStep(1).gapZ).toEqual([31, 32])
    expect(gapStep(2).swapZ).toEqual([52, 53])
    expect(gapStep(3).showPredictions).toBe(true)
  })
})
