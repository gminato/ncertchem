import { describe, expect, it } from 'vitest'
import { buildEmpiricalPipeline } from './empirical-pipeline'
import {
  ANALYSIS_CONDITIONS,
  carbonFromReadings,
  combustionReadings,
  compositionOf,
  dumasReadings,
  elementalSamples,
  empiricalFromPercentages,
  hydrogenFromReadings,
  kjeldahlApplicability,
  kjeldahlApplicabilityOf,
  kjeldahlReadings,
  multiplierN,
  nitrogenDumasFromReadings,
  nitrogenKjeldahlFromReadings,
  oxygenByDifference,
  percentFromPrecipitate,
  precipitateReading,
  sampleFromSmiles,
} from './elemental-analysis'
import { parseSmiles } from './molecule-parse'

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol

describe('sample presets', () => {
  it('names and formulas come from the structures; S and P samples are formula-only', () => {
    const samples = elementalSamples()
    const byId = Object.fromEntries(samples.map((s) => [s.id, s]))
    expect(byId['chloroaniline'].formula).toBe('C6H6ClN')
    expect(byId['nitrobenzene'].formula).toBe('C6H5NO2')
    expect(byId['pyridine'].formula).toBe('C5H5N')
    expect(byId['ethyl-ethanoate'].formula).toBe('C4H8O2')
    expect(byId['dimethyl-sulphoxide'].formula).toBe('C2H6OS')
    expect(byId['dimethyl-sulphoxide'].smiles).toBeUndefined()
    expect(byId['chloroaniline'].name).toBe('4-chloroaniline')
  })

  it('a structure the lib cannot name keeps its formula and has no name', () => {
    const s = sampleFromSmiles('pyridine', 'C1=CC=NC=C1')
    expect(s.name).toBeUndefined()
    expect(s.formula).toBe('C5H5N')
  })
})

describe('Kjeldahl applicability (NCERT 8.10.2 (ii))', () => {
  it('applies to amine nitrogen and fails for nitro and ring nitrogen', () => {
    expect(kjeldahlApplicability(parseSmiles('NC1=CC=C(Cl)C=C1')).applicable).toBe(true)
    const nitro = kjeldahlApplicabilityOf('C1=CC=C(C=C1)[N+](=O)[O-]')
    expect(nitro.applicable).toBe(false)
    expect(nitro.reasons).toContain('a nitro group')
    const pyridine = kjeldahlApplicabilityOf('C1=CC=NC=C1')
    expect(pyridine.applicable).toBe(false)
    expect(pyridine.reasons).toEqual(['a ring'])
  })

  it('a compound with no nitrogen is applicable (nothing to convert)', () => {
    expect(kjeldahlApplicabilityOf('CC(=O)OCC').applicable).toBe(true)
  })
})

describe('readings round-trip through the NCERT formulas', () => {
  const samples = elementalSamples().filter((s) => s.smiles !== undefined && s.id !== 'pyridine')

  it('Liebig: %C and %H recovered from CO₂ and H₂O within 0.01 percentage points', () => {
    for (const s of samples) {
      const comp = compositionOf(s.formula)
      const r = combustionReadings(comp, 0.25)
      expect(near(carbonFromReadings(r), comp.percent.C, 0.01), s.id).toBe(true)
      expect(near(hydrogenFromReadings(r), comp.percent.H, 0.01), s.id).toBe(true)
    }
  })

  it('Dumas: %N recovered from the nitrometer volume within 0.02 percentage points', () => {
    for (const s of samples.filter((x) => x.formula.includes('N'))) {
      const comp = compositionOf(s.formula)
      const r = dumasReadings(comp, 0.25)
      expect(near(nitrogenDumasFromReadings(r), comp.percent.N, 0.02), s.id).toBe(true)
    }
  })

  it('Kjeldahl: %N recovered from the titre within 0.02 percentage points for an applicable amine', () => {
    const comp = compositionOf('C6H6ClN')
    const r = kjeldahlReadings(comp, 0.25)
    expect(r.alkaliMl).toBeGreaterThan(0)
    expect(r.alkaliMl).toBeLessThanOrEqual(2 * ANALYSIS_CONDITIONS.kjeldahlAcidMl)
    expect(near(nitrogenKjeldahlFromReadings(r), comp.percent.N, 0.02)).toBe(true)
  })

  it('Carius: %Cl and %S recovered from the precipitate', () => {
    const cl = compositionOf('C6H6ClN')
    const rCl = precipitateReading(cl, 0.25, 'halogen', 'Cl')
    expect(rCl.mass).toBeCloseTo(0.2811, 3)
    expect(near(percentFromPrecipitate(rCl), cl.percent.Cl, 0.01)).toBe(true)

    const s = compositionOf('C2H6OS')
    const rS = precipitateReading(s, 0.2, 'sulphur', 'S')
    expect(near(percentFromPrecipitate(rS), s.percent.S, 0.01)).toBe(true)
  })

  it('phosphorus as ammonium phosphomolybdate and as Mg2P2O7 recovers %P', () => {
    const p = compositionOf('C6H15O4P')
    const molyb = precipitateReading(p, 0.3, 'phosphorus-molybdate', 'P')
    const pyro = precipitateReading(p, 0.3, 'phosphorus-pyrophosphate', 'P')
    expect(near(percentFromPrecipitate(molyb), p.percent.P, 0.01)).toBe(true)
    expect(near(percentFromPrecipitate(pyro), p.percent.P, 0.01)).toBe(true)
  })

  it('a measurement hook changes the reading; identity leaves it alone', () => {
    const comp = compositionOf('C6H6ClN')
    const base = combustionReadings(comp, 0.25)
    const shifted = combustionReadings(comp, 0.25, (v) => v * 1.01)
    expect(shifted.massCO2).toBeCloseTo(base.massCO2 * 1.01, 3)
  })
})

describe('empirical formula from the learner percentages', () => {
  it('reproduces the empirical formula the lib derives from the true composition', () => {
    for (const s of elementalSamples()) {
      const comp = compositionOf(s.formula)
      const rounded: Record<string, number> = {}
      for (const [sym, v] of Object.entries(comp.percent)) rounded[sym] = Math.round(v * 100) / 100
      const truth = buildEmpiricalPipeline(s.formula)
      const fromLearner = empiricalFromPercentages(rounded)
      expect(fromLearner.label, s.id).toBe(truth.empiricalLabel)
      expect(multiplierN(comp.molarMass, fromLearner.counts), s.id).toBe(truth.n)
    }
  })

  it('ethyl ethanoate: empirical C2H4O, n = 2', () => {
    const comp = compositionOf('C4H8O2')
    const e = empiricalFromPercentages(comp.percent)
    expect(e.label).toBe('C2H4O')
    expect(multiplierN(comp.molarMass, e.counts)).toBe(2)
  })

  it('oxygen by difference equals the true oxygen percentage', () => {
    const comp = compositionOf('C4H8O2')
    const others = { ...comp.percent }
    delete others.O
    expect(near(oxygenByDifference(others), comp.percent.O, 1e-9)).toBe(true)
  })
})

describe('the precipitate and gas readings are physical', () => {
  it('a halogen sample weighs more than zero, and so does a sulphur sample', () => {
    const cl = compositionOf('C6H6ClN')
    expect(precipitateReading(cl, 0.25, 'halogen', 'Cl').mass).toBeGreaterThan(0)
    expect(compositionOf('C2H6OS').percent.S).toBeGreaterThan(0)
  })
})
