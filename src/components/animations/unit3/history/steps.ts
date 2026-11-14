/** Clamps a Step index to the Steps an animation has. Non-finite input maps to Step 0. */
export function clampIndex(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}
