import { MoleBridge } from './sims/mole-bridge'
import type { ComponentType } from 'react'
import { SigFigRuler } from './sims/sigfig-ruler'
import { StatesOfMatter } from './sims/StatesOfMatter'
import { LimitingReagent } from './sims/LimitingReagent'
import { Photoelectric } from './sims/photoelectric'
import { OrbitalExplorer } from './sims/orbital-explorer'
import { HydrogenSpectrum } from './sims/hydrogen-spectrum'
import { Isoelectronic } from './sims/isoelectronic'
import { TableExplorer } from './sims/table-explorer'
import { IupacNamer } from './sims/iupac-namer'
import { TrendsExplorer } from './sims/trends-explorer'
import { MendeleevPredict } from './sims/mendeleev-predict'
import { OxideLab } from './sims/oxide-lab'
import { LewisBuilder } from './sims/lewis-builder'
import { VseprBuilder } from './sims/vsepr-builder'
import { DipoleLab } from './sims/dipole-lab'
import { MOBuilder } from './sims/mo-builder'
import { HybridExplorer } from './sims/hybrid-explorer'
import { PVWorkLab } from './sims/pv-work-lab'
import { StereoOutcomes } from './sims/stereo-outcomes'
import { BondEnergyLedger } from './sims/bond-energy-ledger'
import { GibbsExplorer } from './sims/gibbs-explorer'
import { FirstLawLab } from './sims/first-law-lab'
import { HessBuilder } from './sims/hess-builder'
import { OxidationNumberFinder } from './sims/oxidation-number-finder'
import { RedoxTitrationLab } from './sims/redox-titration-lab'
import { OxidantTitrationLab } from './sims/oxidant-titration-lab'
import { ElectrodePotentialExplorer } from './sims/electrode-potential-explorer'
import { ElectrodePotentialLab } from './sims/electrode-potential-lab'
import { RedoxClassifier } from './sims/redox-classifier'
import { MetalDisplacementLab } from './sims/metal-displacement-lab'
import { RedoxBalancer } from './sims/redox-balancer'
import { KpKcConverter, HeterogeneousConverter } from './sims/kp-kc-converter'
import { IceSolver } from './sims/ice-solver'
import { ConjugatePairSorter } from './sims/conjugate-pair-sorter'
import { SealedContainerLab } from './sims/sealed-container-lab'
import { ApproachToEquilibrium } from './sims/approach-to-equilibrium'
import { BufferDesigner } from './sims/buffer-designer'
import { LeChatelierLab } from './sims/le-chatelier-lab'
import { PrecipitationLab } from './sims/precipitation-lab'
import { PhExplorer } from './sims/ph-explorer'
import { WeakAcidLab } from './sims/weak-acid-lab'
import { HybridisationSpotter } from './sims/hybridisation-spotter'
import { CatenationChains } from './sims/carbon-catenation'
import { TlcLab } from './sims/tlc-lab'
import { IsomerExplorer } from './sims/isomer-explorer'
import { FunctionalGroupSorter } from './sims/functional-group-sorter'
import { DistillationLab } from './sims/distillation-lab'
import { ElementDetective } from './sims/element-detective'
import { FunctionalGroupNamer } from './sims/functional-group-namer'
import { ElementalAnalyser } from './sims/elemental-analyser'
import { ResonanceLab } from './sims/resonance-lab'
import { AlkaneNamer } from './sims/alkane-namer'
import { AdditionPredictor } from './sims/addition-predictor'
import { NewmanRotor } from './sims/newman-rotor'
import { AlkyneIsomers } from './sims/alkyne-isomers'
import { HuckelChecker } from './sims/huckel-checker'
import { FormulaTranslator } from './sims/formula-translator'
import { ArrowPusher } from './sims/arrow-pusher'
import { AlkyneAcidTest } from './sims/alkyne-acid-test'
import { HalideNamer } from './sims/halide-namer'
import { HalogenationLab } from './sims/halogenation-lab'
import { HaloalkanePrepBench } from './sims/haloalkane-prep-bench'
import { OzonolysisDetective } from './sims/ozonolysis-detective'
import { AlkaneSynthesisPlanner } from './sims/alkane-synthesis-planner'
import { AlkeneMaker } from './sims/alkene-maker'
import { CisTransChecker } from './sims/cis-trans-checker'
import { CarbonCounter } from './sims/carbon-counter'
import { FamilySorter } from './sims/family-sorter'
import { OrientationPredictor } from './sims/orientation-predictor'
import { EasWorkbench } from './sims/eas-workbench'
import { HenrySolubilityLab } from './sims/henry-solubility-lab'
import { RaoultMixtureLab } from './sims/raoult-mixture-lab'
import { SolutionTypeExplorer } from './sims/solution-type-explorer'
import { OsmosisPressureLab } from './sims/osmosis-pressure-lab'
import { CorrosionLab } from './sims/corrosion-lab'
import { VantHoffLab } from './sims/vant-hoff-lab'
import { ConcentrationConverter } from './sims/concentration-converter'
import { AzeotropeExplorer } from './sims/azeotrope-explorer'
import { ColligativeThermalLab } from './sims/colligative-thermal-lab'
import { OpposingVoltageLab } from './sims/opposing-voltage-lab'
import { HalfCellPairingBench } from './sims/half-cell-pairing'
import { NucleophilePicker } from './sims/nucleophile-picker'
import { NernstLab } from './sims/nernst-lab'
import { RateSlopeExplorer } from './sims/rate-slope-explorer'
import { RateDeterminingStepLab } from './sims/rate-determining-step-lab'
import { CatalystLab } from './sims/catalyst-lab'
import { CollisionLab } from './sims/collision-lab'
import { EGKConverter } from './sims/e-g-k-converter'
import { OrderUnitsLab } from './sims/order-units-lab'
import { ConductivityCellLab } from './sims/conductivity-cell-lab'
import { KohlrauschLab } from './sims/kohlrausch-lab'
import { ElectrolysisProductPredictor } from './sims/electrolysis-product-predictor'
import { ElectroplatingLab } from './sims/electroplating-lab'
import { LeadAcidCycle } from './sims/lead-acid-cycle'
import { InitialRatesLab } from './sims/initial-rates-lab'
import { ZeroOrderLab } from './sims/zero-order-lab'
import { FirstOrderLab } from './sims/first-order-lab'
import { SubstitutionRace } from './sims/substitution-race'
import { HalfLifeCompare } from './sims/half-life-compare'
import { ArrheniusLab } from './sims/arrhenius-lab'
import { ConfigurationExplorer } from './sims/configuration-explorer'
import { DBlockTrendsLab } from './sims/dblock-trends-lab'
import { IonisationExplorer } from './sims/ionisation-explorer'
import { OxidationStateExplorer } from './sims/oxidation-state-explorer'
import { MagneticMomentLab } from './sims/magnetic-moment-lab'
import { AquaIonColourLab } from './sims/aqua-ion-colour-lab'
import { LanthanoidExplorer } from './sims/lanthanoid-explorer'
import { IndustrialCatalystExplorer } from './sims/industrial-catalyst-explorer'
import { FBlockCompare } from './sims/f-block-compare'
import { WernerPrecipitationLab } from './sims/werner-precipitation-lab'
import { CoordinationDissector } from './sims/coordination-dissector'
import { ComplexNamer } from './sims/complex-namer'
import { IsomerLab } from './sims/isomer-lab'
import { VbtOrbitalLab } from './sims/vbt-orbital-lab'
import { CrystalFieldSplittingLab } from './sims/crystal-field-splitting-lab'
import { LigandColourLab } from './sims/ligand-colour-lab'
import { CarbonylExplorer } from './sims/carbonyl-explorer'
import { ComplexApplicationExplorer } from './sims/complex-application-explorer'
import { HalideClassifier } from './sims/halide-classifier'
import { CXBondExplorer } from './sims/c-x-bond-explorer'
import { HaloareneMaker } from './sims/haloarene-maker'
import { HalidePropertiesLab } from './sims/halide-properties-lab'
import { ZaitsevChooser } from './sims/zaitsev-chooser'
import { NitroActivation } from './sims/nitro-activation'
import { PolyhalogenExplorer } from './sims/polyhalogen-explorer'
import { EtherSynthesisAndPropertiesLab } from './sims/ether-synthesis-and-properties-lab'

export interface SimulationProps {
  /** True when the Learner has asked the OS for reduced motion. Skip tweens and loops when set. */
  reducedMotion: boolean
}

/**
 * Simulations available to `<Simulation name="…" />`, keyed by name. Section
 * work adds entries here. Each entry renders its own stage, and its controls
 * go in the Simulation's controls row through `<SimulationControls>`.
 */
export const simulations: Record<string, ComponentType<SimulationProps>> = {
  'sigfig-ruler': SigFigRuler,
  'states-of-matter': StatesOfMatter,
  'mole-bridge': MoleBridge,
  'limiting-reagent': LimitingReagent,
  photoelectric: Photoelectric,
  'orbital-explorer': OrbitalExplorer,
  'hydrogen-spectrum': HydrogenSpectrum,
  isoelectronic: Isoelectronic,
  'table-explorer': TableExplorer,
  'iupac-namer': IupacNamer,
  'trends-explorer': TrendsExplorer,
  'mendeleev-predict': MendeleevPredict,
  'oxide-lab': OxideLab,
  'lewis-builder': LewisBuilder,
  'vsepr-builder': VseprBuilder,
  'dipole-lab': DipoleLab,
  'mo-builder': MOBuilder,
  'hybrid-explorer': HybridExplorer,
  'pv-work-lab': PVWorkLab,
  'bond-energy-ledger': BondEnergyLedger,
  'gibbs-explorer': GibbsExplorer,
  'first-law-lab': FirstLawLab,
  'hess-builder': HessBuilder,
  'oxidation-number-finder': OxidationNumberFinder,
  'redox-titration-lab': RedoxTitrationLab,
  'oxidant-titration-lab': OxidantTitrationLab,
  'electrode-potential-explorer': ElectrodePotentialExplorer,
  'electrode-potential-lab': ElectrodePotentialLab,
  'redox-classifier': RedoxClassifier,
  'metal-displacement-lab': MetalDisplacementLab,
  'redox-balancer': RedoxBalancer,
  'kp-kc-converter': KpKcConverter,
  'heterogeneous-converter': HeterogeneousConverter,
  'ice-solver': IceSolver,
  'conjugate-pair-sorter': ConjugatePairSorter,
  'sealed-container-lab': SealedContainerLab,
  'approach-to-equilibrium': ApproachToEquilibrium,
  'buffer-designer': BufferDesigner,
  'le-chatelier-lab': LeChatelierLab,
  'precipitation-lab': PrecipitationLab,
  'ph-explorer': PhExplorer,
  'weak-acid-lab': WeakAcidLab,
  'hybridisation-spotter': HybridisationSpotter,
  'carbon-catenation': CatenationChains,
  'tlc-lab': TlcLab,
  'isomer-explorer': IsomerExplorer,
  'functional-group-sorter': FunctionalGroupSorter,
  'distillation-lab': DistillationLab,
  'element-detective': ElementDetective,
  'functional-group-namer': FunctionalGroupNamer,
  'elemental-analyser': ElementalAnalyser,
  'resonance-lab': ResonanceLab,
  'alkane-namer': AlkaneNamer,
  'addition-predictor': AdditionPredictor,
  'alkyne-isomers': AlkyneIsomers,
  'huckel-checker': HuckelChecker,
  'formula-translator': FormulaTranslator,
  'arrow-pusher': ArrowPusher,
  'alkyne-acid-test': AlkyneAcidTest,
  'halogenation-lab': HalogenationLab,
  'haloalkane-prep-bench': HaloalkanePrepBench,
  'ozonolysis-detective': OzonolysisDetective,
  'alkane-synthesis-planner': AlkaneSynthesisPlanner,
  'alkene-maker': AlkeneMaker,
  'cis-trans-checker': CisTransChecker,
  'carbon-counter': CarbonCounter,
  'family-sorter': FamilySorter,
  'orientation-predictor': OrientationPredictor,
  'eas-workbench': EasWorkbench,
  'newman-rotor': NewmanRotor,
  'henry-solubility-lab': HenrySolubilityLab,
  'raoult-mixture-lab': RaoultMixtureLab,
  'solution-type-explorer': SolutionTypeExplorer,
  'osmosis-pressure-lab': OsmosisPressureLab,
  'electrolysis-product-predictor': ElectrolysisProductPredictor,
  'corrosion-lab': CorrosionLab,
  'vant-hoff-lab': VantHoffLab,
  'concentration-converter': ConcentrationConverter,
  'azeotrope-explorer': AzeotropeExplorer,
  'colligative-thermal-lab': ColligativeThermalLab,
  'opposing-voltage-lab': OpposingVoltageLab,
  'half-cell-pairing': HalfCellPairingBench,
  'nernst-lab': NernstLab,
  'rate-slope-explorer': RateSlopeExplorer,
  'catalyst-lab': CatalystLab,
  'collision-lab': CollisionLab,
  'e-g-k-converter': EGKConverter,
  'order-units-lab': OrderUnitsLab,
  'conductivity-cell-lab': ConductivityCellLab,
  'kohlrausch-lab': KohlrauschLab,
  'electroplating-lab': ElectroplatingLab,
  'lead-acid-cycle': LeadAcidCycle,
  'initial-rates-lab': InitialRatesLab,
  'rate-determining-step-lab': RateDeterminingStepLab,
  'zero-order-lab': ZeroOrderLab,
  'first-order-lab': FirstOrderLab,
  'substitution-race': SubstitutionRace,
  'aqua-ion-colour-lab': AquaIonColourLab,
  'half-life-compare': HalfLifeCompare,
  'arrhenius-lab': ArrheniusLab,
  'configuration-explorer': ConfigurationExplorer,
  'dblock-trends-lab': DBlockTrendsLab,
  'ionisation-explorer': IonisationExplorer,
  'oxidation-state-explorer': OxidationStateExplorer,
  'magnetic-moment-lab': MagneticMomentLab,
  'lanthanoid-explorer': LanthanoidExplorer,
  'industrial-catalyst-explorer': IndustrialCatalystExplorer,
  'f-block-compare': FBlockCompare,
  'werner-precipitation-lab': WernerPrecipitationLab,
  'coordination-dissector': CoordinationDissector,
  'complex-namer': ComplexNamer,
  'isomer-lab': IsomerLab,
  'vbt-orbital-lab': VbtOrbitalLab,
  'crystal-field-splitting-lab': CrystalFieldSplittingLab,
  'ligand-colour-lab': LigandColourLab,
  'carbonyl-explorer': CarbonylExplorer,
  'complex-application-explorer': ComplexApplicationExplorer,
  'halide-classifier': HalideClassifier,
  'halide-namer': HalideNamer,
  'c-x-bond-explorer': CXBondExplorer,
  'haloarene-maker': HaloareneMaker,
  'halide-properties-lab': HalidePropertiesLab,
  'nucleophile-picker': NucleophilePicker,
  'stereo-outcomes': StereoOutcomes,
  'zaitsev-chooser': ZaitsevChooser,
  'nitro-activation': NitroActivation,
  'polyhalogen-explorer': PolyhalogenExplorer,
  'ether-synthesis-and-properties-lab': EtherSynthesisAndPropertiesLab,
}
