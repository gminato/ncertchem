/**
 * The periodic table types come from the shared data module, so components and
 * data cannot drift apart. This file only adds the position-function alias.
 */
export type {
  Block,
  Category,
  ElementRecord,
  FBlockRow,
  TablePosition,
} from '../../lib/chem/periodic-data'

import type { TablePosition } from '../../lib/chem/periodic-data'

export type PositionFn = (Z: number) => TablePosition
