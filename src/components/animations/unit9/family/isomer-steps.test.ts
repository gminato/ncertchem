import { describe, expect, it } from 'vitest'
import { ISOMER_STEP_COUNT, isomerViews } from './isomer-steps'

describe('alkane-isomers steps', () => {
  const views = isomerViews()

  it('has three isomer steps and a summary step', () => {
    expect(ISOMER_STEP_COUNT).toBe(4)
    expect(views.map((v) => v.name)).toEqual(['pentane', '2-methylbutane', '2,2-dimethylpropane'])
  })

  it('shares the formula C5H12 across the three isomers', () => {
    expect(new Set(views.map((v) => v.formula))).toEqual(new Set(['C5H12']))
  })

  it('counts the carbon classes: 2 and 3 for pentane, 3, 1 and 1 for 2-methylbutane, 4 and 1 for neopentane', () => {
    expect(views[0].counts).toEqual({ '1°': 2, '2°': 3, '3°': 0, '4°': 0 })
    expect(views[1].counts).toEqual({ '1°': 3, '2°': 1, '3°': 1, '4°': 0 })
    expect(views[2].counts).toEqual({ '1°': 4, '2°': 0, '3°': 0, '4°': 1 })
  })

  it('takes boiling points from Table 9.2 and they fall with branching', () => {
    expect(views.map((v) => v.boilingK)).toEqual([309.1, 300.9, 282.5])
  })
})
