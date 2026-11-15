import { describe, expect, it } from 'vitest'
import {
  convertEquilibriumConstant,
  equationCe,
  expressionLatex,
  inspectEquation,
  parseEquation,
} from './kp-kc'
import { kcFromConcentrations, kpFromKc } from './equilibrium'

describe('parseEquation (Section 6.4.1 and 6.5 notation)', () => {
  it('reads coefficients, species and phases on both sides', () => {
    const r = parseEquation('N2(g) + 3H2(g) <=> 2NH3(g)')
    expect(r.reactants).toEqual([
      { species: 'N2', coefficient: 1, phase: 'g' },
      { species: 'H2', coefficient: 3, phase: 'g' },
    ])
    expect(r.products).toEqual([{ species: 'NH3', coefficient: 2, phase: 'g' }])
  })

  it('accepts the equilibrium arrow ⇌ and keeps charges and parentheses in formulas', () => {
    const r = parseEquation('Ni(s) + 4CO(g) ⇌ Ni(CO)4(g)')
    expect(r.products[0].species).toBe('Ni(CO)4')
    expect(r.reactants[1]).toEqual({ species: 'CO', coefficient: 4, phase: 'g' })
    const ion = parseEquation('Fe3+(aq) + SCN-(aq) <=> Fe(SCN)2+(aq)')
    expect(ion.reactants[0].species).toBe('Fe3+')
    expect(ion.products[0].species).toBe('Fe(SCN)2+')
  })

  it('reads a water equilibrium with a liquid', () => {
    const r = parseEquation('H2O(l) <=> H2O(g)')
    expect(r.reactants[0].phase).toBe('l')
  })

  it('throws a RangeError for a missing arrow, a missing phase or a bad coefficient', () => {
    expect(() => parseEquation('H2(g) + I2(g)')).toThrow(RangeError)
    expect(() => parseEquation('H2 + I2 <=> 2HI(g)')).toThrow(/phase/)
    expect(() => parseEquation('H2(g) + I2(g) <=> 0HI(g)')).toThrow(RangeError)
    expect(() => parseEquation('H2(g) <=> ')).toThrow(RangeError)
  })
})

describe('inspectEquation', () => {
  it('counts Δn over gaseous species only (+1 for 2NOCl ⇌ 2NO + Cl2)', () => {
    const r = parseEquation('2NOCl(g) <=> 2NO(g) + Cl2(g)')
    const i = inspectEquation(r)
    expect(i.gasReactants).toBe(2)
    expect(i.gasProducts).toBe(3)
    expect(i.deltaN).toBe(1)
  })

  it('gives Δn = −2 for N2 + 3H2 ⇌ 2NH3 and Δn = 0 for H2 + I2 ⇌ 2HI', () => {
    expect(inspectEquation(parseEquation('N2(g) + 3H2(g) <=> 2NH3(g)')).deltaN).toBe(-2)
    expect(inspectEquation(parseEquation('H2(g) + I2(g) <=> 2HI(g)')).deltaN).toBe(0)
  })

  it('leaves solids and liquids out of the expression and counts Δn for CaCO3 as +1', () => {
    const i = inspectEquation(parseEquation('CaCO3(s) <=> CaO(s) + CO2(g)'))
    expect(i.deltaN).toBe(1)
    expect(i.excluded.map((t) => t.species)).toEqual(['CaCO3', 'CaO'])
    expect(i.included.map((t) => t.species)).toEqual(['CO2'])
  })

  it('reports no gas for an aqueous-only equation, so Kp is undefined', () => {
    const i = inspectEquation(parseEquation('Ag2O(s) + 2HNO3(aq) <=> 2AgNO3(aq) + H2O(l)'))
    expect(i.hasGas).toBe(false)
  })
})

describe('convertEquilibriumConstant', () => {
  it('gives Kp = Kc when Δn = 0 (the RT factors cancel)', () => {
    const r = parseEquation('H2(g) + I2(g) <=> 2HI(g)')
    const c = convertEquilibriumConstant(r, 64, 'Kc', 700)
    expect(c.factor).toBeCloseTo(1, 12)
    expect(c.output).toBeCloseTo(64, 9)
  })

  it('multiplies by (RT)^Δn with R = 0.0831 bar L mol⁻¹ K⁻¹ for Δn = +1', () => {
    const r = parseEquation('2NOCl(g) <=> 2NO(g) + Cl2(g)')
    const c = convertEquilibriumConstant(r, 0.025, 'Kc', 400)
    expect(c.rt).toBeCloseTo(33.24, 9)
    expect(c.factor).toBeCloseTo(33.24, 9)
    expect(c.output).toBeCloseTo(0.025 * 33.24, 9)
    expect(c.to).toBe('Kp')
  })

  it('divides by (RT)^Δn for Δn = −2, so Kc = Kp (RT)^2', () => {
    const r = parseEquation('N2(g) + 3H2(g) <=> 2NH3(g)')
    const toKp = convertEquilibriumConstant(r, 2, 'Kc', 500)
    const back = convertEquilibriumConstant(r, toKp.output, 'Kp', 500)
    expect(back.output).toBeCloseTo(2, 9)
    expect(back.to).toBe('Kc')
    expect(toKp.output).toBeCloseTo(2 * (0.0831 * 500) ** -2, 12)
  })

  it('agrees with kpFromKc in equilibrium.ts', () => {
    const r = parseEquation('N2O4(g) <=> 2NO2(g)')
    const c = convertEquilibriumConstant(r, 0.1, 'Kc', 298)
    expect(c.output).toBeCloseTo(kpFromKc(0.1, 1, 298), 12)
  })

  it('throws when the equation has no gas', () => {
    const r = parseEquation('Ag2O(s) + 2HNO3(aq) <=> 2AgNO3(aq) + H2O(l)')
    expect(() => convertEquilibriumConstant(r, 1, 'Kc', 298)).toThrow(/gas/)
  })

  it('rejects a non-positive constant or temperature', () => {
    const r = parseEquation('H2(g) + I2(g) <=> 2HI(g)')
    expect(() => convertEquilibriumConstant(r, 0, 'Kc', 298)).toThrow(RangeError)
    expect(() => convertEquilibriumConstant(r, 1, 'Kc', -5)).toThrow(RangeError)
  })
})

describe('equation and expression text', () => {
  it('writes mhchem for the equation, dropping a coefficient of one', () => {
    expect(equationCe(parseEquation('N2(g) + 3H2(g) <=> 2NH3(g)'))).toBe('N2(g) + 3H2(g) <=> 2NH3(g)')
    expect(equationCe(parseEquation('CaCO3(s) <=> CaO(s) + CO2(g)'))).toBe('CaCO3(s) <=> CaO(s) + CO2(g)')
  })

  it('leaves solids and liquids out of the LaTeX expression', () => {
    expect(expressionLatex(parseEquation('CaCO3(s) <=> CaO(s) + CO2(g)'), 'K_{c}')).toBe('K_{c} = [\\ce{CO2}]')
    expect(expressionLatex(parseEquation('CaCO3(s) <=> CaO(s) + CO2(g)'), 'K_{p}')).toBe('K_{p} = p_{\\ce{CO2}}')
    expect(expressionLatex(parseEquation('N2(g) + 3H2(g) <=> 2NH3(g)'), 'K_{p}')).toBe(
      'K_{p} = \\frac{(p_{\\ce{NH3}})^{2}}{p_{\\ce{N2}} (p_{\\ce{H2}})^{3}}',
    )
    expect(expressionLatex(parseEquation('N2(g) + 3H2(g) <=> 2NH3(g)'), 'K_{c}')).toBe(
      'K_{c} = \\frac{[\\ce{NH3}]^{2}}{[\\ce{N2}] [\\ce{H2}]^{3}}'
    )
  })

  it('matches the concentration Kc for the same equation', () => {
    const r = parseEquation('2NOCl(g) <=> 2NO(g) + Cl2(g)')
    const kc = kcFromConcentrations(r, { NOCl: 0.4, NO: 0.2, Cl2: 0.1 })
    expect(kc).toBeCloseTo(0.025, 12)
  })
})
