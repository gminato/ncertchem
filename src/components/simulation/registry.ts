import type { ComponentType } from 'react'
import { StatesOfMatter } from './sims/StatesOfMatter'

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
  'states-of-matter': StatesOfMatter,
}
