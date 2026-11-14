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
import { AufbauDiagonal } from './unit2/filling/AufbauDiagonal'
import { BuildUpAtoms } from './unit2/filling/BuildUpAtoms'
import { ExchangeEnergy } from './unit2/filling/ExchangeEnergy'
import { WaveNature } from './unit2/light/WaveNature'
import { BlackBody } from './unit2/light/BlackBody'
import { LineSpectra } from './unit2/light/LineSpectra'
import { CathodeRayTube } from './unit2/subatomic/CathodeRayTube'
import { OilDropApparatus } from './unit2/subatomic/OilDropApparatus'
import { ParticleTable } from './unit2/subatomic/ParticleTable'
import { RutherfordScattering } from './unit2/atomic/RutherfordScattering'
import { IsotopeNuclei } from './unit2/atomic/IsotopeNuclei'
import { OrbitCollapse } from './unit2/atomic/OrbitCollapse'
import { OrbitalQuantumNumbers } from './unit2/orbitals/OrbitalQuantumNumbers'
import { DeBroglieScale } from './unit2/bohr/DeBroglieScale'
import { DeBroglieOrbit } from './unit2/bohr/DeBroglieOrbit'
import { HeisenbergMicroscope } from './unit2/bohr/HeisenbergMicroscope'
import { DefinitionRadii } from './unit3/radii/DefinitionRadii'
import { PeriodTwoRadii, GroupOneRadii } from './unit3/radii/PeriodRadii'
import { PeriodicRadiiMap } from './unit3/radii/PeriodicRadiiMap'
import { IonicRadii } from './unit3/radii/IonicRadii'

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
  'aufbau-diagonal': AufbauDiagonal,
  'build-up-atoms': BuildUpAtoms,
  'exchange-pairs': ExchangeEnergy,
  'wave-nature': WaveNature,
  'black-body': BlackBody,
  'line-spectra': LineSpectra,
  'subatomic-cathode-ray': CathodeRayTube,
  'subatomic-oil-drop': OilDropApparatus,
  'subatomic-particles': ParticleTable,
  'atomic-rutherford': RutherfordScattering,
  'atomic-isotopes': IsotopeNuclei,
  'atomic-collapse': OrbitCollapse,
  'orbital-quantum-numbers': OrbitalQuantumNumbers,
  'de-broglie-scale': DeBroglieScale,
  'de-broglie-orbit': DeBroglieOrbit,
  'heisenberg-microscope': HeisenbergMicroscope,
  'radii-definitions': DefinitionRadii,
  'radii-period-two': PeriodTwoRadii,
  'radii-group-one': GroupOneRadii,
  'radii-periodic-table': PeriodicRadiiMap,
  'radii-ionic': IonicRadii,
} as const

export type AnimationName = keyof typeof animations
