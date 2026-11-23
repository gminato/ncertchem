import { describe, expect, it } from 'vitest'
import {
  COORDINATION_APP_STEPS,
  FIELD_STRIP,
  analyticalReagentsCount,
  applicationById,
  clampStep,
} from './applications-steps'

describe('Section 5.7 Coordination Applications Scrolly Steps', () => {
  it('defines six Steps covering all five NCERT application fields', () => {
    expect(COORDINATION_APP_STEPS).toHaveLength(6)
    const fields = new Set(COORDINATION_APP_STEPS.map((s) => s.field))
    expect([...fields].sort()).toEqual(FIELD_STRIP.map((f) => f.id).sort())
  })

  it('references valid NCERT_APPLICATIONS ids in every Step', () => {
    for (const step of COORDINATION_APP_STEPS) {
      expect(step.applicationIds.length).toBeGreaterThan(0)
      for (const id of step.applicationIds) {
        const app = applicationById(id)
        expect(app.field).toBe(step.field)
      }
    }
  })

  it('matches NCERT oxidation states and coordination numbers for metallurgy and photography', () => {
    expect(applicationById('gold').oxidationState).toBe(1)
    expect(applicationById('gold').coordinationNumber).toBe(2)
    expect(applicationById('nickel').oxidationState).toBe(0)
    expect(applicationById('nickel').coordinationNumber).toBe(4)
    expect(applicationById('hypo').oxidationState).toBe(1)
    expect(applicationById('hypo').coordinationNumber).toBe(2)
  })

  it('clamps step indices safely and counts analytical reagents', () => {
    expect(clampStep(-2)).toBe(0)
    expect(clampStep(3)).toBe(3)
    expect(clampStep(99)).toBe(5)
    expect(analyticalReagentsCount()).toBe(4)
  })

  it('contains no em or en dashes in step labels or captions', () => {
    expect(JSON.stringify(COORDINATION_APP_STEPS)).not.toMatch(/[\u2013\u2014]/)
  })
})
