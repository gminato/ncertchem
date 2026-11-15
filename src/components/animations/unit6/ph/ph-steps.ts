/**
 * Target states of the pH Scrolly, one per Step. Each Step is deterministic: the same frame every
 * time, computed by the acid-base library from a concentration and a temperature.
 */

import { strongAcidFrame, strongBaseFrame, waterFrame, type PhFrame } from './ph-model'

/** Number of Steps in the ph-scale Scrolly. */
export const PH_STEP_COUNT = 6

/** Target frame for each Step, in order. */
export function phScaleSteps(): PhFrame[] {
  return [
    // 1. A strong acid at 0.010 mol L⁻¹: pH 2.00 with a ten-fold excess of H₃O⁺ over the pH 3 solution.
    strongAcidFrame(1e-2, 298, '1.0 × 10⁻² M HCl'),
    // 2. Ten times more dilute: one pH unit higher.
    strongAcidFrame(1e-3, 298, '1.0 × 10⁻³ M HCl'),
    // 3. Pure water at 298 K: [H₃O⁺] = [OH⁻] = 1.0 × 10⁻⁷ mol L⁻¹, pH 7.
    waterFrame(298, 'Pure water'),
    // 4. A strong base at 1.0 × 10⁻⁴ mol L⁻¹: pOH 4, pH 10.
    strongBaseFrame(1e-4, 298, '1.0 × 10⁻⁴ M NaOH'),
    // 5. Pure water at 310 K: Kw is larger, so the neutral pH is below 7 and the solution is still neutral.
    waterFrame(310, 'Pure water'),
    // 6. Very dilute HCl at 298 K: water supplies H₃O⁺ as well, so the pH is 6.94, not 7.52.
    strongAcidFrame(3e-8, 298, '3.0 × 10⁻⁸ M HCl'),
  ]
}
