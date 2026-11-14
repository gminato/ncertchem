import { MoleBridge } from './sims/mole-bridge'
import type { ComponentType } from 'react'
import { SigFigRuler } from './sims/sigfig-ruler'
import { StatesOfMatter } from './sims/StatesOfMatter'
import { LimitingReagent } from './sims/LimitingReagent'
import { Photoelectric } from './sims/photoelectric'
import { OrbitalExplorer } from './sims/orbital-explorer'
import { HydrogenSpectrum } from './sims/hydrogen-spectrum'
import { OxideLab } from './sims/oxide-lab'

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
  'oxide-lab': OxideLab,
}
