import { describe, expect, it } from 'vitest'
import { elutionOrder, paperSpots, sceneBands, sceneSpots, sceneSteps } from './chromatography-steps'

describe('scene Steps (Section 8.8.5)', () => {
  const steps = sceneSteps()

  it('has six Steps: column, column fractions, plate spotted, plate developed, iodine, paper', () => {
    expect(steps.map((s) => s.view)).toEqual(['column', 'column', 'tlc', 'tlc', 'tlc', 'paper'])
  })

  it('every progress value lies between 0 and 1', () => {
    for (const s of steps) {
      expect(s.progress).toBeGreaterThanOrEqual(0)
      expect(s.progress).toBeLessThanOrEqual(1)
    }
  })

  it('the spotted plate starts at the origin (progress 0)', () => {
    expect(steps[2].progress).toBe(0)
  })

  it('the fractions Step names F1 to F3 in elution order', () => {
    expect(steps[1].title).toBe('Fractions collected: F1 = R, F2 = B, F3 = G')
  })

  it('iodine is used only on the plate, after the developed Step', () => {
    expect(steps.filter((s) => s.visualise !== 'none').map((s) => s.view)).toEqual(['tlc'])
    expect(steps[4].visualise).toBe('iodine')
  })

  it('no Step draws the measuring overlay, so the Rf values are read from the key and the Prose', () => {
    expect(steps.some((s) => s.measure)).toBe(false)
  })

  it('the developed plate is at 0.8 of the run, the same progress as the paper strip', () => {
    expect(steps[3].progress).toBe(0.8)
    expect(steps[5].progress).toBe(0.8)
  })
})

describe('scene spots and bands', () => {
  it('the colourless spot C is marked colourless and has no colour of its own', () => {
    const c = sceneSpots().find((s) => s.id === 'C')!
    expect(c.colourless).toBe(true)
    expect(c.color).toBeUndefined()
  })

  it('the Rf values of the scene are the default-solvent values (R 0.58, B 0.37, G 0.26, C 0.45)', () => {
    const rfs = Object.fromEntries(sceneSpots().map((s) => [s.id, Number(s.rf.toFixed(2))]))
    expect(rfs).toEqual({ R: 0.58, B: 0.37, G: 0.26, C: 0.45 })
  })

  it('the red dye (weakest adsorption) reaches the bottom of the column first', () => {
    expect(elutionOrder().map((b) => b.id)).toEqual(['R', 'B', 'G'])
  })

  it('the column shows three coloured bands, and the paper strip two', () => {
    expect(sceneBands()).toHaveLength(3)
    expect(paperSpots().map((s) => s.id)).toEqual(['R', 'G'])
  })
})
