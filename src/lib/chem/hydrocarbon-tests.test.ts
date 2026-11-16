import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import { baeyerTest, bromineTest } from './hydrocarbon-tests'

const g = parseSmiles

describe('bromine test', () => {
  it('is decolourised by an alkene and an alkyne', () => {
    expect(bromineTest(g('C=C')).positive).toBe(true)
    expect(bromineTest(g('C#C')).positive).toBe(true)
  })
  it('is not decolourised by an alkane', () => {
    expect(bromineTest(g('CCCC')).positive).toBe(false)
  })
  it('is not decolourised by benzene, and says why', () => {
    const r = bromineTest(g('C1=CC=CC=C1'))
    expect(r.positive).toBe(false)
    expect(r.reason).toMatch(/delocalised/)
  })
  it('is decolourised by a styrene-type molecule through its side-chain C=C', () => {
    expect(bromineTest(g('C=CC1=CC=CC=C1')).positive).toBe(true)
  })
})

describe('Baeyer test', () => {
  it('is positive for an alkene and gives the brown MnO2 observation', () => {
    const r = baeyerTest(g('CC=C'))
    expect(r.positive).toBe(true)
    expect(r.observation).toMatch(/MnO2/)
  })
  it('is negative for an alkane and for benzene', () => {
    expect(baeyerTest(g('CC')).positive).toBe(false)
    expect(baeyerTest(g('C1=CC=CC=C1')).positive).toBe(false)
  })
})
