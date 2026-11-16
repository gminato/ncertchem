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
import { BondEnergyLedger } from './sims/bond-energy-ledger'
import { GibbsExplorer } from './sims/gibbs-explorer'
import { FirstLawLab } from './sims/first-law-lab'
import { HessBuilder } from './sims/hess-builder'
import { OxidationNumberFinder } from './sims/oxidation-number-finder'
import { RedoxTitrationLab } from './sims/redox-titration-lab'
import { ElectrodePotentialExplorer } from './sims/electrode-potential-explorer'
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
import { AlkaneSynthesisPlanner } from './sims/alkane-synthesis-planner'
import { AlkeneMaker } from './sims/alkene-maker'
import { CisTransChecker } from './sims/cis-trans-checker'
import { CarbonCounter } from './sims/carbon-counter'
import { FamilySorter } from './sims/family-sorter'

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
  'electrode-potential-explorer': ElectrodePotentialExplorer,
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
  'alkane-synthesis-planner': AlkaneSynthesisPlanner,
  'alkene-maker': AlkeneMaker,
  'cis-trans-checker': CisTransChecker,
  'carbon-counter': CarbonCounter,
  'family-sorter': FamilySorter,
  'newman-rotor': NewmanRotor,
}
