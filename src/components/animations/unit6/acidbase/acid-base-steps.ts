/**
 * The target state of the acid-base Scrolly for each Step. The animation tweens from the
 * current state to the target, so every value is a fraction from 0 (hidden) to 1 (shown).
 *
 * The scenes are cut-aways of three reactions: HCl in water (proton transfer), NH₃ with H₂O
 * (two conjugate pairs), and BF₃ with NH₃ (a Lewis adduct). Each scene fades in and out with
 * its own field, so a Step can hand over from one scene to the next.
 */
export interface AcidBaseTarget {
  /** Scene A: HCl and H₂O on the top row. */
  hcl: number
  /** Scene A: position of the transferred proton, 0 on HCl and 1 on water. */
  proton: number
  /** Scene A: the product row, Cl⁻ and H₃O⁺. */
  products: number
  /** Scene B: NH₃ and H₂O with NH₄⁺ and OH⁻ below. */
  nh3: number
  /** Scene B: tint behind the two conjugate-pair columns. */
  pairs: number
  /** Scene C: BF₃ and NH₃ as separate molecules, and the curved electron-pair arrow. */
  bf3: number
  /** Scene C: how far the B–N bond has formed, 0 apart and 1 bonded. */
  adduct: number
}

const HIDDEN: AcidBaseTarget = { hcl: 0, proton: 0, products: 0, nh3: 0, pairs: 0, bf3: 0, adduct: 0 }

const STEPS: readonly AcidBaseTarget[] = [
  { ...HIDDEN, hcl: 1 },
  { ...HIDDEN, hcl: 1, proton: 1, products: 1 },
  { ...HIDDEN, nh3: 1, pairs: 1 },
  { ...HIDDEN, bf3: 1, adduct: 1 },
]

export const ACID_BASE_STEP_COUNT = STEPS.length

/** The target state for a Step index. Out-of-range indices are clamped to the first or last Step. */
export function acidBaseTarget(step: number): AcidBaseTarget {
  const index = Math.min(ACID_BASE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  return { ...STEPS[index] }
}

/** The fields of AcidBaseTarget, in the order they are tweened. */
export const ACID_BASE_FIELDS = ['hcl', 'proton', 'products', 'nh3', 'pairs', 'bf3', 'adduct'] as const
