import { BohrEmission } from './BohrEmission'
import { ConcentrationVessels } from './unit1/ConcentrationVessels'
import { ReactionReading } from './unit1/ReactionReading'

/**
 * Animations available to a Scrolly Animation, keyed by the `animation` prop.
 * Every entry takes `{ step: number; reducedMotion: boolean }`.
 */
export const animations = {
  'bohr-emission': BohrEmission,
  'reaction-reading': ReactionReading,
  'concentration-vessels': ConcentrationVessels,
} as const

export type AnimationName = keyof typeof animations
