import { describe, expect, it } from 'vitest'
import { ETHER_STEP_COUNT, getEtherSteps } from './steps'

describe('ether-naming steps', () => {
  it('provides 5 steps covering all Table 7.2 ether rules', () => {
    const steps = getEtherSteps()
    expect(steps).toHaveLength(ETHER_STEP_COUNT)
    expect(steps[0].entries.map((e) => e.commonName)).toEqual([
      'Dimethyl ether',
      'Diethyl ether',
      'Methyl n-propyl ether',
      'Methyl isopropyl ether',
    ])
    expect(steps[1].entries.map((e) => e.iupacName)).toEqual(['1-Methoxypropane', '2-Methoxypropane'])
    expect(steps[2].entries.map((e) => e.iupacName)).toEqual(['Methoxybenzene', 'Ethoxybenzene'])
    expect(steps[3].entries.map((e) => e.iupacName)).toEqual(['3-Methylbutoxybenzene', '1-Phenoxyheptane'])
    expect(steps[4].entries.map((e) => e.iupacName)).toEqual([
      '1,2-Dimethoxyethane',
      '2-Ethoxy-1,1-dimethylcyclohexane',
    ])
  })
})
