import { describe, expect, it } from 'vitest'
import {
  ELECTRON_CHARGE_TO_MASS,
  ELECTRON_MASS_KG,
  ELEMENTARY_CHARGE_C,
  EV_JOULES,
  NEUTRON_MASS_KG,
  PLANCK,
  PROTON_MASS_KG,
  SPEED_OF_LIGHT,
} from './constants'

// NCERT Class 11, Unit 2, equation 2.1: e/m_e = 1.758820 × 10¹¹ C kg⁻¹
// Section 2.1.3 with Millikan's e = 1.602176 × 10⁻¹⁹ C gives m_e = 9.1094 × 10⁻³¹ kg (equation 2.2)
describe('electron constants (NCERT section 2.1)', () => {
  it('e/m_e equals 1.758820 × 10^11 C/kg', () => {
    expect(ELECTRON_CHARGE_TO_MASS).toBe(1.75882e11)
  })
  it('m_e = e / (e/m_e) = 9.1094 × 10^-31 kg', () => {
    const derived = ELEMENTARY_CHARGE_C / ELECTRON_CHARGE_TO_MASS
    expect(derived / 1e-31).toBeCloseTo(9.1094, 3)
    expect(ELECTRON_MASS_KG).toBe(9.1094e-31)
  })
})

// NCERT Table 2.1
describe('nucleon masses (NCERT Table 2.1)', () => {
  it('proton mass is 1.6726216 × 10^-27 kg', () => {
    expect(PROTON_MASS_KG).toBe(1.6726216e-27)
  })
  it('neutron mass is 1.674927 × 10^-27 kg', () => {
    expect(NEUTRON_MASS_KG).toBe(1.674927e-27)
  })
})

describe('existing constants are reused, not redefined', () => {
  it('Planck constant and speed of light keep NCERT values', () => {
    expect(PLANCK).toBe(6.626e-34)
    expect(SPEED_OF_LIGHT).toBe(3.0e8)
  })
  it('1 eV is 1.602 × 10^-19 J (NCERT value)', () => {
    expect(EV_JOULES).toBe(1.602e-19)
  })
})
