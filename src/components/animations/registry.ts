import { BohrEmission } from './BohrEmission'
import { MassBalance } from './unit1/MassBalance'
import { GasLaws } from './unit1/GasLaws'
import { DaltonPostulates } from './unit1/DaltonPostulates'
import { IsotopeSeesaw } from './unit1/IsotopeSeesaw'
import { MolecularMass } from './unit1/MolecularMass'

/**
 * Animations available to a Scrolly Animation, keyed by the `animation` prop.
 * Every entry takes `{ step: number; reducedMotion: boolean }`.
 */
export const animations = {
  'bohr-emission': BohrEmission,
  'mass-balance': MassBalance,
  'gay-lussac-avogadro': GasLaws,
  'dalton-postulates': DaltonPostulates,
  'isotope-seesaw': IsotopeSeesaw,
  'molecular-mass': MolecularMass,
} as const

export type AnimationName = keyof typeof animations
