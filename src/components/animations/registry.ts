import { BohrEmission } from './BohrEmission'
import { MassWeight } from './unit1/MassWeight'
import { ThermometerTrio } from './unit1/ThermometerTrio'
import { PrecisionAccuracy } from './unit1/PrecisionAccuracy'
import { UnitFactors } from './unit1/UnitFactors'
import { EverydayChemistry } from './unit1/EverydayChemistry'
import { MatterClassification } from './unit1/MatterClassification'
import { EmpiricalPipeline } from './unit1/EmpiricalPipeline'
import { MoleScale } from './unit1/MoleScale'

/**
 * Animations available to a Scrolly Animation, keyed by the `animation` prop.
 * Every entry takes `{ step: number; reducedMotion: boolean }`.
 */
export const animations = {
  'bohr-emission': BohrEmission,
  'mass-weight': MassWeight,
  'thermometer-trio': ThermometerTrio,
  'precision-accuracy': PrecisionAccuracy,
  'unit-factors': UnitFactors,
  'everyday-chemistry': EverydayChemistry,
  'matter-classification': MatterClassification,
  'mole-scale': MoleScale,
  'empirical-pipeline': EmpiricalPipeline,
} as const

export type AnimationName = keyof typeof animations
