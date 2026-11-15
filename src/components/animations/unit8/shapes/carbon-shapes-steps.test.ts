import { describe, expect, it } from 'vitest'
import { angleDeg, ethyleneScene, methaneScene, scenePosition } from '@/lib/chem/carbon-shapes'
import { SHAPE_STEP_COUNT, degreeText, piTurnDegrees, shapeStep } from './carbon-shapes-steps'

describe('carbon-shapes Scrolly steps', () => {
  it('has four Steps: methane, ethene, ethyne and the π bond', () => {
    expect(SHAPE_STEP_COUNT).toBe(4)
    expect(shapeStep(0).kind).toBe('methane')
    expect(shapeStep(1).kind).toBe('ethene')
    expect(shapeStep(2).kind).toBe('ethyne')
    expect(shapeStep(3).kind).toBe('pi')
  })

  it('clamps out-of-range indices', () => {
    expect(shapeStep(-3).kind).toBe('methane')
    expect(shapeStep(99).kind).toBe('pi')
  })

  it('quotes the lib numbers in each working line', () => {
    expect(shapeStep(0).working).toContain('109.5°')
    expect(shapeStep(0).working).toContain('25%')
    expect(shapeStep(1).working).toContain('120°')
    expect(shapeStep(1).working).toContain('134 pm')
    expect(shapeStep(2).working).toContain('180°')
    expect(shapeStep(2).working).toContain('120 pm')
  })

  it('formats whole and fractional degrees', () => {
    expect(degreeText(120)).toBe('120°')
    expect(degreeText(109.5)).toBe('109.5°')
  })

  it('turns the π Step to 90 degrees and leaves the others at 0', () => {
    expect([0, 1, 2].map(piTurnDegrees)).toEqual([0, 0, 0])
    expect(piTurnDegrees(3)).toBe(90)
  })

  it('draws the scenes that the Steps show with the angles quoted', () => {
    const m = methaneScene()
    const hch = angleDeg(scenePosition(m, 'H1'), scenePosition(m, 'C'), scenePosition(m, 'H2'))
    expect(degreeText(Math.round(hch * 10) / 10)).toBe('109.5°')
    const e = ethyleneScene()
    const hcc = angleDeg(scenePosition(e, 'H1'), scenePosition(e, 'C1'), scenePosition(e, 'C2'))
    expect(Math.round(hcc)).toBe(120)
  })
})
