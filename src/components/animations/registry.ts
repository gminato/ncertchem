import { BohrEmission } from './BohrEmission'
import { VseprRepulsion } from './unit4/vsepr/VseprRepulsion'
import { VseprLonePairs } from './unit4/vsepr/VseprLonePairs'
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
import { MoseleyPlot } from './unit3/modern/MoseleyPlot'
import { PeriodicLongForm } from './unit3/modern/PeriodicLongForm'
import { PeriodicBlocks, PeriodicCategories } from './unit3/modern/PeriodicBlocks'
import { IonizationTrends } from './unit3/energetics/IonizationTrends'
import { EnergeticsTable } from './unit3/energetics/EnergeticsTable'
import { DobereinerTriads } from './unit3/history/DobereinerTriads'
import { NewlandsOctaves } from './unit3/history/NewlandsOctaves'
import { MeyerVolume } from './unit3/history/MeyerVolume'
import { MendeleevGaps } from './unit3/history/MendeleevGaps'
import { ChemicalProperties } from './unit3/chemical/ChemicalProperties'
import { KosselTransfer } from './unit4/lewis/KosselTransfer'
import { OctetExceptions } from './unit4/lewis/OctetExceptions'
import { BornHaberStaircase } from './unit4/lewis/BornHaberStaircase'
import { BondLengthRadii } from './unit4/parameters/BondLengthRadii'
import { BondOrderScale } from './unit4/parameters/BondOrderScale'
import { OzoneResonance } from './unit4/parameters/OzoneResonance'
import { MOWaveCombination } from './unit4/mo/MOWaveCombination'
import { MOEnergyOrders } from './unit4/mo/MOEnergyOrders'
import { MOO2Filling } from './unit4/mo/MOO2Filling'
import { HBondContacts } from './unit4/hbond/HBondContacts'
import { HBondBoiling } from './unit4/hbond/HBondBoiling'
import { H2PotentialCurve } from './unit4/vbt/H2PotentialCurve'
import { OverlapSteps } from './unit4/vbt/OverlapSteps'
import { EthynePi } from './unit4/vbt/EthynePi'
import { HybridGeometry } from './unit4/vbt/HybridGeometry'
import { PistonWork } from './unit5/work/PistonWork'
import { PathsOnPV } from './unit5/work/PathsOnPV'
import { EnthalpyBars } from './unit5/work/EnthalpyBars'
import { NaClBornHaber } from './unit5/NaClBornHaber'
import { NaClDissolution } from './unit5/NaClDissolution'
import { EntropyPhases } from './unit5/gibbs/EntropyPhases'
import { SignCases } from './unit5/gibbs/SignCases'
import { KLadder } from './unit5/gibbs/KLadder'
import { SystemTypes } from './unit5/terms/SystemTypes'
import { JouleAdiabatic } from './unit5/terms/JouleAdiabatic'
import { StateFunction } from './unit5/terms/StateFunction'
import { ThermoBomb } from './unit5/enthalpy/ThermoBomb'
import { HessRoutes } from './unit5/enthalpy/HessRoutes'
import { RedoxOnRules } from './unit7/onrules/RedoxOnRules'
import { RedoxTitration } from './unit7/titration/RedoxTitration'
import { RedoxDaniell } from './unit7/daniell/RedoxDaniell'
import { RedoxTypes } from './unit7/types/RedoxTypes'
import { RedoxClassical } from './unit7/classical/RedoxClassical'
import { RedoxElectronTransfer } from './unit7/transfer/RedoxElectronTransfer'
import { RedoxBalanceON } from './unit7/balance/RedoxBalanceON'
import { RedoxBalanceHalf } from './unit7/balance/RedoxBalanceHalf'
import { KpKc } from './unit6/kpkc/KpKc'
import { Heterogeneous } from './unit6/heterogeneous/Heterogeneous'
import { QAndK } from './unit6/qk/QAndK'
import { IceMethod } from './unit6/qk/IceMethod'
import { GibbsCurve } from './unit6/qk/GibbsCurve'
import { AcidBaseConcepts } from './unit6/acidbase/AcidBaseConcepts'
import { IonicElectrolytes } from './unit6/acidbase/IonicElectrolytes'
import { PhysicalEquilibria } from './unit6/physical/PhysicalEquilibria'
import { DynamicEquilibrium } from './unit6/dynamic/DynamicEquilibrium'
import { MassAction } from './unit6/massaction/MassAction'
import { BufferAction } from './unit6/buffer/BufferAction'
import { LeChatelierStress } from './unit6/lechatelier/LeChatelierStress'
import { SolubilityProduct } from './unit6/solubility/SolubilityProduct'
import { PhLadder } from './unit6/ph/PhLadder'
import { WeakAcid } from './unit6/weakacid/WeakAcid'
import { CarbonShapes } from './unit8/shapes/CarbonShapes'
import { VitalForce } from './unit8/intro/VitalForce'
import { Chromatography } from './unit8/chromatography/Chromatography'
import { IsomerFamily } from './unit8/isomers/IsomerFamily'
import { ClassificationTree } from './unit8/classification/ClassificationTree'
import { PurificationMethods } from './unit8/purification/PurificationMethods'
import { LassaigneBench } from './unit8/lassaigne/LassaigneBench'
import { FunctionalNaming } from './unit8/fgnaming/FunctionalNaming'
import { CombustionAnalysis } from './unit8/quantitative/CombustionAnalysis'
import { ElectronEffects } from './unit8/effects/ElectronEffects'
import { AlkaneNaming } from './unit8/naming/AlkaneNaming'
import { RepresentationsMorph } from './unit8/representations/RepresentationsMorph'
import { BondFission } from './unit8/fission/BondFission'
import { Markovnikov } from './unit9/addition/Markovnikov'
import { AlkyneReactions } from './unit9/alkyne-reactions/AlkyneReactions'
import { RadicalChain } from './unit9/halogenation/RadicalChain'
import { AlkeneCleavage } from './unit9/ozonolysis/AlkeneCleavage'
import { AlkaneRoutes } from './unit9/preparation/AlkaneRoutes'
import { ElimMechanism } from './unit9/elimination/ElimMechanism'
import { AlkeneStructure } from './unit9/alkene-structure/AlkeneStructure'
import { HydrocarbonFamily } from './unit9/family/HydrocarbonFamily'
import { AlkaneIsomers } from './unit9/family/AlkaneIsomers'
import { EthaneRotation } from './unit9/conformations/EthaneRotation'
import { TripleBond } from './unit9/alkyne-structure/TripleBond'
import { DirectingGroups } from './unit9/directing/DirectingGroups'
import { Carcinogens } from './unit9/carcinogens/Carcinogens'
import { BenzeneStructure } from './unit9/benzene/BenzeneStructure'
import { HuckelCount } from './unit9/benzene/HuckelCount'
import { EasScrolly } from './unit9/eas/EasScrolly'
import { HenryLawPiston } from './c12-unit1/solubility/HenryLawPiston'
import { RaoultSurface } from './c12-unit1/raoult/RaoultSurface'
import { SolutionsNineTypes } from './c12-unit1/types/SolutionsNineTypes'
import { OsmosisMembrane } from './c12-unit1/osmosis/OsmosisMembrane'
import { FuelRust } from './c12-unit2/fuelrust/FuelRust'
import { VantHoffParticles } from './c12-unit1/vanthoff/VantHoffParticles'
import { ConcentrationScales } from './c12-unit1/concentration/ConcentrationScales'
import { RaoultDeviations } from './c12-unit1/deviations/RaoultDeviations'
import { ColligativePhaseShift } from './c12-unit1/colligative/ColligativePhaseShift'

/**
 * Animations available to a Scrolly Animation, keyed by the `animation` prop.
 * Every entry takes `{ step: number; reducedMotion: boolean }`.
 */
export const animations = {
  'bohr-emission': BohrEmission,
  'vsepr-repulsion': VseprRepulsion,
  'vsepr-lone-pairs': VseprLonePairs,
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
  'moseley-plot': MoseleyPlot,
  'periodic-long-form': PeriodicLongForm,
  'periodic-blocks': PeriodicBlocks,
  'periodic-categories': PeriodicCategories,
  'ionization-trends': IonizationTrends,
  'energetics-table': EnergeticsTable,
  'history-triads': DobereinerTriads,
  'history-octaves': NewlandsOctaves,
  'history-meyer': MeyerVolume,
  'history-mendeleev-gaps': MendeleevGaps,
  'chemical-properties': ChemicalProperties,
  'lewis-kossel-transfer': KosselTransfer,
  'lewis-octet-exceptions': OctetExceptions,
  'lewis-born-haber': BornHaberStaircase,
  'bond-length-radii': BondLengthRadii,
  'bond-order-scale': BondOrderScale,
  'resonance-ozone': OzoneResonance,
  'mo-wave-combination': MOWaveCombination,
  'mo-energy-orders': MOEnergyOrders,
  'mo-o2-filling': MOO2Filling,
  'hbond-contacts': HBondContacts,
  'hbond-boiling': HBondBoiling,
  'vbt-h2-curve': H2PotentialCurve,
  'vbt-overlap': OverlapSteps,
  'vbt-ethyne-pi': EthynePi,
  'vbt-hybrid-geometry': HybridGeometry,
  'work-piston': PistonWork,
  'work-paths': PathsOnPV,
  'work-enthalpy': EnthalpyBars,
  'unit5-nacl-born-haber': NaClBornHaber,
  'unit5-nacl-dissolution': NaClDissolution,
  'gibbs-entropy-phases': EntropyPhases,
  'gibbs-sign-cases': SignCases,
  'gibbs-k-ladder': KLadder,
  'thermo-system-types': SystemTypes,
  'thermo-joule': JouleAdiabatic,
  'thermo-state-function': StateFunction,
  'thermo-bomb': ThermoBomb,
  'thermo-hess': HessRoutes,
  'redox-on-rules': RedoxOnRules,
  'redox-titration': RedoxTitration,
  'redox-daniell': RedoxDaniell,
  'redox-types': RedoxTypes,
  'redox-classical': RedoxClassical,
  'redox-electron-transfer': RedoxElectronTransfer,
  'redox-balance-on': RedoxBalanceON,
  'redox-balance-half': RedoxBalanceHalf,
  'kp-kc': KpKc,
  heterogeneous: Heterogeneous,
  'q-and-k': QAndK,
  'ice-method': IceMethod,
  'qk-gibbs': GibbsCurve,
  'acid-base-concepts': AcidBaseConcepts,
  'ionic-electrolytes': IonicElectrolytes,
  'physical-equilibria': PhysicalEquilibria,
  'unit6-dynamic-equilibrium': DynamicEquilibrium,
  'unit6-mass-action': MassAction,
  'buffer-action': BufferAction,
  'le-chatelier': LeChatelierStress,
  'solubility-product': SolubilityProduct,
  'ph-scale': PhLadder,
  'weak-acid': WeakAcid,
  'vital-force': VitalForce,
  'carbon-shapes': CarbonShapes,
  chromatography: Chromatography,
  'isomer-family': IsomerFamily,
  'classification-tree': ClassificationTree,
  'purification-methods': PurificationMethods,
  'lassaigne': LassaigneBench,
  'functional-naming': FunctionalNaming,
  'combustion-analysis': CombustionAnalysis,
  'electron-effects': ElectronEffects,
  'alkane-naming': AlkaneNaming,
  elimination: ElimMechanism,
  'structure-morph': RepresentationsMorph,
  'bond-fission': BondFission,
  markovnikov: Markovnikov,
  'alkyne-reactions': AlkyneReactions,
  'radical-chain': RadicalChain,
  'alkene-cleavage': AlkeneCleavage,
  'alkane-routes': AlkaneRoutes,
  'double-bond': AlkeneStructure,
  'hydrocarbon-family': HydrocarbonFamily,
  'alkane-isomers': AlkaneIsomers,
  'ethane-rotation': EthaneRotation,
  'triple-bond': TripleBond,
  'directing-groups': DirectingGroups,
  carcinogens: Carcinogens,
  'benzene-structure': BenzeneStructure,
  'huckel-count': HuckelCount,
  'eas-mechanism': EasScrolly,
  'henry-law-piston': HenryLawPiston,
  'raoult-surface': RaoultSurface,
  'solutions-nine-types': SolutionsNineTypes,
  'osmosis-membrane': OsmosisMembrane,
  'fuel-cell-and-rust': FuelRust,
  'vant-hoff-particles': VantHoffParticles,
  'concentration-scales': ConcentrationScales,
  'raoult-deviations': RaoultDeviations,
  'colligative-phase-shift': ColligativePhaseShift,
} as const

export type AnimationName = keyof typeof animations
