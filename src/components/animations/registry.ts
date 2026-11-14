import { BohrEmission } from './BohrEmission'
import { ConcentrationVessels } from './unit1/ConcentrationVessels'
import { ReactionReading } from './unit1/ReactionReading'
import { EverydayChemistry } from './unit1/EverydayChemistry'
import { MatterClassification } from './unit1/MatterClassification'

/**
 * Animations available to a Scrolly Animation, keyed by the `animation` prop.
 * Every entry takes `{ step: number; reducedMotion: boolean }`.
 */
export const animations = {
  'bohr-emission': BohrEmission,
  'reaction-reading': ReactionReading,
  'concentration-vessels': ConcentrationVessels,
  'everyday-chemistry': EverydayChemistry,
  'matter-classification': MatterClassification,
} as const

export type AnimationName = keyof typeof animations
