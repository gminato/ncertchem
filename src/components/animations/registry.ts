import { BohrEmission } from './BohrEmission'

/**
 * Animations available to a Scrolly Animation, keyed by the `animation` prop.
 * Every entry takes `{ step: number; reducedMotion: boolean }`.
 */
export const animations = {
  'bohr-emission': BohrEmission,
} as const

export type AnimationName = keyof typeof animations
