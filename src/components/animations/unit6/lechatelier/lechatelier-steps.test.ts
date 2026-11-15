import { describe, expect, it } from 'vitest'
import { reactionQuotient } from '@/lib/chem/equilibrium'
import { labSystem } from '@/lib/chem/le-chatelier-lab'
import { concentrationAxisMax, stressSteps } from './lechatelier-steps'

describe('Le Chatelier Scrolly steps', () => {
  const steps = stressSteps()

  it('has six Steps: a baseline, then concentration, volume, inert gas, temperature and catalyst', () => {
    expect(steps.map((s) => s.stress)).toEqual(['none', 'add-reactant', 'compress', 'none', 'heat', 'none'])
    expect(steps).toHaveLength(6)
  })

  it('gives the baseline Q = K and no stress', () => {
    const base = steps[0]
    expect(base.perturbAt).toBeNull()
    expect(base.immediateQ).toBeNull()
    expect(base.kBefore).toBeCloseTo(62.15, 1)
  })

  it('gives Q = 17.6 after adding N₂, below K', () => {
    const add = steps[1]
    expect(add.immediateQ).toBeCloseTo(17.62, 1)
    expect(add.immediateQ!).toBeLessThan(add.kBefore)
    expect(add.shift).toBe('products')
  })

  it('gives Q = K/4 after compressing to half the volume', () => {
    const squeeze = steps[2]
    expect(squeeze.immediateQ).toBeCloseTo(squeeze.kBefore / 4, 9)
    expect(squeeze.volume).toBe(0.5)
  })

  it('leaves K and the composition unchanged for argon at constant volume', () => {
    const argon = steps[3]
    expect(argon.immediateQ).toBeCloseTo(argon.kBefore, 9)
    expect(argon.kAfter).toBe(argon.kBefore)
    expect(argon.argonMol).toBeGreaterThan(0)
  })

  it('lowers K on heating and gives the reverse shift', () => {
    const heat = steps[4]
    expect(heat.temperatureK).toBe(550)
    expect(heat.kAfter).toBeLessThan(heat.kBefore)
    expect(heat.kAfter).toBeCloseTo(8.27, 1)
    expect(heat.shift).toBe('reactants')
  })

  it('keeps K for the catalyst Step and shows two approaches', () => {
    const cat = steps[5]
    expect(cat.kAfter).toBe(cat.kBefore)
    expect(cat.series.map((s) => s.id)).toEqual(['NH3-plain', 'NH3-catalysed'])
  })

  it('ends every curve at the settled amount of its species', () => {
    for (const step of steps.slice(0, 5)) {
      for (const series of step.series) {
        const last = series.points[series.points.length - 1][1]
        expect(last).toBeCloseTo(step.settled[series.id], 4)
      }
    }
  })

  it('keeps Q = K at the settled state of every Step', () => {
    const reaction = labSystem('haber').reaction
    for (const step of steps) {
      expect(reactionQuotient(reaction, step.settled)).toBeCloseTo(step.kAfter, 4)
    }
  })

  it('puts the stress marker at the same lab time for every stressed Step', () => {
    for (const step of steps.filter((s) => s.perturbAt !== null)) {
      expect(step.perturbAt).toBe(2)
      expect(step.timeMax).toBe(12)
    }
  })
})

describe('concentrationAxisMax', () => {
  it('rounds the top of the axis up to a tidy step above the largest value', () => {
    const top = concentrationAxisMax([1.604])
    expect(top).toBeGreaterThanOrEqual(1.604)
    expect(top / 0.5).toBeCloseTo(Math.round(top / 0.5), 9)
  })

  it('works for small concentrations, as in the aqueous mixture', () => {
    const top = concentrationAxisMax([0.166])
    expect(top).toBeGreaterThanOrEqual(0.166)
    expect(top).toBeLessThan(0.3)
  })
})
