import { BohrEmission } from './BohrEmission'
import { MassWeight } from './unit1/MassWeight'
import { ThermometerTrio } from './unit1/ThermometerTrio'
import { PrecisionAccuracy } from './unit1/PrecisionAccuracy'
import { UnitFactors } from './unit1/UnitFactors'
import { ConcentrationVessels } from './unit1/ConcentrationVessels'
import { ReactionReading } from './unit1/ReactionReading'
import { EverydayChemistry } from './unit1/EverydayChemistry'
import { MatterClassification } from './unit1/MatterClassification'
import { EmpiricalPipeline } from './unit1/EmpiricalPipeline'
import { MoleScale } from './unit1/MoleScale'
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
  'mass-weight': MassWeight,
  'thermometer-trio': ThermometerTrio,
  'precision-accuracy': PrecisionAccuracy,
  'unit-factors': UnitFactors,
  'reaction-reading': ReactionReading,
  'concentration-vessels': ConcentrationVessels,
  'everyday-chemistry': EverydayChemistry,
  'matter-classification': MatterClassification,
  'mole-scale': MoleScale,
  'empirical-pipeline': EmpiricalPipeline,
  'mass-balance': MassBalance,
  'gay-lussac-avogadro': GasLaws,
  'dalton-postulates': DaltonPostulates,
  'isotope-seesaw': IsotopeSeesaw,
  'molecular-mass': MolecularMass,
} as const

export type AnimationName = keyof typeof animations
