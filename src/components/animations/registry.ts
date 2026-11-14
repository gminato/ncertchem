import { BohrEmission } from './BohrEmission'
import { EmpiricalPipeline } from './unit1/EmpiricalPipeline'
import { MoleScale } from './unit1/MoleScale'

/**
 * Animations available to a Scrolly Animation, keyed by the `animation` prop.
 * Every entry takes `{ step: number; reducedMotion: boolean }`.
 */
export const animations = {
  'bohr-emission': BohrEmission,
  'mole-scale': MoleScale,
  'empirical-pipeline': EmpiricalPipeline,
} as const

export type AnimationName = keyof typeof animations
