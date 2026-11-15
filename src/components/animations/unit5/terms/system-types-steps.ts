import type { BoundaryKind, FlowDirection } from '@/components/thermo/SystemBoundary'
import { clampIndex } from './useTweenedSnapshot'

/** Number of Steps in the system-types Scrolly. */
export const SYSTEM_TYPES_STEP_COUNT = 4

/** What the boundary looks like, and what crosses it, at one Step. */
export interface SystemTypeTarget {
  kind: BoundaryKind
  matter: 'none' | 'both'
  heat: 'none' | FlowDirection
  work: 'none' | FlowDirection
  /** Short name shown under the drawing. */
  caption: string
}

/**
 * The target for each Step. The boundary changes kind as the Learner scrolls, and the flows that
 * the kind permits are drawn. The kinds follow Section 5.1.2: open (matter and energy), closed
 * (energy only) and isolated (neither).
 */
export function systemTypeForStep(step: number): SystemTypeTarget {
  switch (clampIndex(step, SYSTEM_TYPES_STEP_COUNT)) {
    case 0:
      return {
        kind: 'closed',
        matter: 'none',
        heat: 'none',
        work: 'none',
        caption: 'The system, its boundary and the surroundings',
      }
    case 1:
      return {
        kind: 'open',
        matter: 'both',
        heat: 'in',
        work: 'none',
        caption: 'Open: matter and energy cross the boundary',
      }
    case 2:
      return {
        kind: 'closed',
        matter: 'none',
        heat: 'out',
        work: 'in',
        caption: 'Closed: energy crosses, matter does not',
      }
    default:
      return {
        kind: 'isolated',
        matter: 'none',
        heat: 'none',
        work: 'none',
        caption: 'Isolated: neither matter nor energy crosses',
      }
  }
}
