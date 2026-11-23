import { describe, expect, it } from 'vitest'
import { ALCOHOL_PHENOL_STEP_COUNT, getAlcoholPhenolSteps } from './steps'

describe('alcohol-phenol-naming steps', () => {
  it('provides 6 steps matching the MDX scrolly walkthrough', () => {
    const steps = getAlcoholPhenolSteps()
    expect(steps).toHaveLength(ALCOHOL_PHENOL_STEP_COUNT)
    expect(steps[0].entries.map((e) => e.iupacName)).toEqual(['Methanol', 'Propan-2-ol'])
    expect(steps[1].entries.map((e) => e.iupacName)).toEqual(['2-Methylpropan-1-ol'])
    expect(steps[2].entries.map((e) => e.iupacName)).toEqual(['Ethane-1,2-diol', 'Propane-1,2,3-triol'])
    expect(steps[3].entries.map((e) => e.iupacName)).toEqual(['Cyclohexanol', '2-Methylcyclopentanol'])
    expect(steps[4].entries.map((e) => e.iupacName)).toEqual([
      'Phenol',
      '2-Methylphenol',
      '3-Methylphenol',
      '4-Methylphenol',
    ])
    expect(steps[5].entries.map((e) => e.iupacName)).toEqual([
      'Benzene-1,2-diol',
      'Benzene-1,3-diol',
      'Benzene-1,4-diol',
    ])
  })
})
