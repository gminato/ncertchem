/**
 * Pure sizing for AtomSizeRow. Radii are drawn linearly in pixels, so a
 * species with twice the radius is drawn with twice the radius on screen.
 */

/** Pixel radius for a radius in pm, scaled so the largest item reaches maxPx. */
export function radiusToPx(pm: number, maxPm: number, maxPx: number): number {
  if (maxPm <= 0) return 0
  return Math.max(0, (pm / maxPm) * maxPx)
}
