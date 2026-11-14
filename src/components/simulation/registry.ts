import { MoleBridge } from './sims/mole-bridge'
import type { ComponentType } from 'react'
import { SigFigRuler } from './sims/sigfig-ruler'
import { StatesOfMatter } from './sims/StatesOfMatter'
import { LimitingReagent } from './sims/LimitingReagent'
import { HydrogenSpectrum } from './sims/hydrogen-spectrum'

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
  'hydrogen-spectrum': HydrogenSpectrum,
}
