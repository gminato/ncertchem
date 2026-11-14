import { describe, expect, it } from 'vitest'
import { AVOGADRO } from './constants'
import {
  bridgeMolarMass,
  formatQuantity,
  formatScientific,
  gramsFromMoles,
  massToMolesLine,
  molesFromGrams,
  molesFromParticles,
  molesToMassLine,
  molesToParticlesLine,
  particlesToMolesLine,
  resolveSubstance,
  sampleFromMoles,
  superscript,
} from './mole-bridge'

describe('resolveSubstance', () => {
  it('reads a valid formula and its molar mass', () => {
    const result = resolveSubstance(' H2O ')
    expect(result).toEqual({ ok: true, formula: 'H2O', molarMass: 18.02 })
  })

  it('returns a message, not an exception, for invalid input', () => {
    expect(resolveSubstance('   ').ok).toBe(false)
    const lowercase = resolveSubstance('nacl')
    expect(lowercase.ok).toBe(false)
    if (!lowercase.ok) expect(lowercase.message).toContain('nacl')
    expect(resolveSubstance('Xx2').ok).toBe(false)
    expect(resolveSubstance('C6H12O6(').ok).toBe(false)
  })
})

describe('bridge molar masses', () => {
  it('rounds to two decimals, as NCERT quotes them', () => {
    expect(bridgeMolarMass('H2O')).toBe(18.02)
    expect(bridgeMolarMass('CO2')).toBe(44.01)
    expect(bridgeMolarMass('NaCl')).toBe(58.5)
    expect(bridgeMolarMass('C6H12O6')).toBe(180.16)
  })
})

describe('scientific formatting', () => {
  it('formats Avogadro-size numbers with superscript exponents', () => {
    expect(formatScientific(6.02214076e23)).toBe('6.022 × 10²³')
    expect(formatScientific(1.2047e24)).toBe('1.205 × 10²⁴')
  })

  it('uses a superscript minus for negative exponents', () => {
    expect(superscript(-3)).toBe('⁻³')
    expect(formatScientific(2.5e-3, 2)).toBe('2.5 × 10⁻³')
  })

  it('writes ordinary sizes in plain digits', () => {
    expect(formatQuantity(2.00044)).toBe('2.000')
    expect(formatQuantity(36.04)).toBe('36.04')
    expect(formatQuantity(1.5e8)).toBe('1.500 × 10⁸')
  })
})

describe('worked lines', () => {
  it('reproduces the water example: 36.04 g ÷ 18.02 g mol⁻¹ = 2.000 mol', () => {
    const moles = molesFromGrams('H2O', 36.04)
    expect(moles).toBeCloseTo(2, 9)
    expect(massToMolesLine(36.04, moles, 'H2O')).toBe('36.04 g ÷ 18.02 g mol⁻¹ = 2.000 mol')
  })

  it('writes amount to mass and amount to particles lines', () => {
    const sample = sampleFromMoles('H2O', 2)
    expect(sample.grams).toBeCloseTo(36.04, 9)
    expect(molesToMassLine(2, sample.grams, 'H2O')).toBe('2.000 mol × 18.02 g mol⁻¹ = 36.04 g')
    expect(molesToParticlesLine(2, sample.particles)).toBe(
      '2.000 mol × 6.022 × 10²³ mol⁻¹ = 1.204 × 10²⁴'
    )
    expect(particlesToMolesLine(sample.particles, 2)).toBe(
      '1.204 × 10²⁴ ÷ 6.022 × 10²³ mol⁻¹ = 2.000 mol'
    )
  })
})

describe('sample conversions', () => {
  it('particles and moles are inverses', () => {
    expect(molesFromParticles(AVOGADRO * 0.5)).toBeCloseTo(0.5, 9)
    expect(gramsFromMoles('CO2', 0.5)).toBeCloseTo(22.005, 6)
  })

  it('one mole of carbon weighs 12.01 g (two decimals) and holds Avogadro-many atoms', () => {
    const sample = sampleFromMoles('C', 1)
    expect(sample.grams).toBeCloseTo(12.01, 6)
    expect(sample.particles).toBe(AVOGADRO)
  })
})
