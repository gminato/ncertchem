/**
 * Fits a reaction scheme to a width. ReactionScheme lays the species out at the largest bond scale
 * that fits on one row; this file measures that row, so the drawing can be scaled up to fill the
 * panel. A scheme that needs two rows is never scaled up, because the gap between rows would grow.
 */

import { layoutReactionScheme, type SchemePath } from '@/components/organic/hydrocarbon-geometry'

/** The largest factor the drawing is enlarged by. Above this the labels grow out of proportion. */
export const MAX_SCHEME_SCALE = 1.5

export interface FittedScheme {
  /** Factor to apply to the ReactionScheme group (a transform scale). */
  scale: number
  /** The width the ReactionScheme must be laid out to (its maxWidth). */
  layoutWidth: number
  /** The drawn width, after scaling. */
  width: number
  /** The drawn height, after scaling. */
  height: number
  rows: number
}

/** Measures a scheme laid out to `width` and returns the scale that makes it fill that width. */
export function fitScheme(sequence: SchemePath, width: number): FittedScheme {
  const layout = layoutReactionScheme(sequence, width)
  const natural = Math.max(1, layout.width)
  const scale = layout.rows === 1 ? Math.min(MAX_SCHEME_SCALE, width / natural) : 1
  return {
    scale,
    layoutWidth: width,
    width: natural * scale,
    height: layout.height * scale,
    rows: layout.rows,
  }
}
