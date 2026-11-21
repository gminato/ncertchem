export interface HenryAnimationStep {
  readonly index: number
  readonly title: string
  readonly subtitle: string
  readonly badge: string
  readonly ariaLabel: string
  /** Mode rendered in the stage panels. */
  readonly mode: 'solid-equilibrium' | 'gas-low-p' | 'gas-high-p' | 'kh-compare' | 'applications'
  /** Target vertical y-coordinate of the piston bottom face in the 580x420 SVG. */
  readonly pistonY: number
  /** Number of pressure weights resting on top of the piston plate (0 for solid step). */
  readonly weightCount: number
  /** Representative partial pressure in bar for the gauge and operating point. */
  readonly pressureBar: number
  /** Representative dissolved mole fraction (in units of 10⁻⁵) for O₂ at 293 K. */
  readonly moleFraction1e5: number
  /** Count of gas molecules displayed in the headspace. */
  readonly gasParticleCount: number
  /** Count of dissolved molecules displayed in the liquid. */
  readonly dissolvedCount: number
}

export const HENRY_STEPS: readonly HenryAnimationStep[] = [
  {
    index: 0,
    title: 'Solid in Liquid: Dynamic Equilibrium',
    subtitle: 'Like dissolves like; at saturation, dissolution rate equals crystallisation rate.',
    badge: 'Solute + Solvent ⇌ Solution',
    ariaLabel:
      'Step 1: Solid crystal in a polar solvent at saturation, with equal dissolution and crystallisation arrows and a polarity match comparison.',
    mode: 'solid-equilibrium',
    pistonY: 132,
    weightCount: 0,
    pressureBar: 1.0,
    moleFraction1e5: 0,
    gasParticleCount: 0,
    dissolvedCount: 10,
  },
  {
    index: 1,
    title: 'Gas over Liquid at Low Pressure (P₁)',
    subtitle: 'Equal rates of gas molecules entering and escaping maintain a low dissolved fraction x₁.',
    badge: 'P₁ = 1.0 bar  |  Dynamic Equilibrium',
    ariaLabel:
      'Step 2: Piston cylinder at low pressure P1 equal to 1.0 bar with sparse gas molecules above water and a low operating point on the p versus x Henry law line.',
    mode: 'gas-low-p',
    pistonY: 126,
    weightCount: 1,
    pressureBar: 1.0,
    moleFraction1e5: 2.87,
    gasParticleCount: 9,
    dissolvedCount: 4,
  },
  {
    index: 2,
    title: 'Higher Pressure Triples Solubility (P₂ = 3 P₁)',
    subtitle: 'Adding weights crowds gas onto the surface until dissolved mole fraction rises linearly: p = K_H x.',
    badge: 'P₂ = 3.0 bar  |  x₂ = 3 x₁',
    ariaLabel:
      'Step 3: Piston compressed downward under three weights to 3.0 bar, crowding gas molecules over the liquid and tripling dissolved mole fraction along the linear Henry law graph.',
    mode: 'gas-high-p',
    pistonY: 184,
    weightCount: 3,
    pressureBar: 3.0,
    moleFraction1e5: 8.61,
    gasParticleCount: 18,
    dissolvedCount: 12,
  },
  {
    index: 3,
    title: 'Higher K_H Means Lower Solubility',
    subtitle: 'Different gases have distinct K_H slopes; warming raises K_H, so cold water holds more O₂.',
    badge: 'K_H(O₂): 34.9 kbar (293 K) → 46.8 kbar (303 K)',
    ariaLabel:
      'Step 4: Comparing Henry law lines for helium, nitrogen, warm oxygen, and cold oxygen at constant pressure, showing that larger K_H gives steeper slope and lower solubility.',
    mode: 'kh-compare',
    pistonY: 158,
    weightCount: 2,
    pressureBar: 2.0,
    moleFraction1e5: 5.74,
    gasParticleCount: 13,
    dissolvedCount: 8,
  },
  {
    index: 4,
    title: "Henry's Law in Everyday Life",
    subtitle: 'From fizzing soda bottles to helium-diluted scuba tanks and high-altitude anoxia.',
    badge: 'p = K_H x  in Industry & Biology',
    ariaLabel:
      'Step 5: Three real-world consequences of Henry law: pressurised carbonated beverages, scuba diver decompression bends mitigated by helium dilution, and high-altitude anoxia.',
    mode: 'applications',
    pistonY: 174,
    weightCount: 3,
    pressureBar: 3.0,
    moleFraction1e5: 8.61,
    gasParticleCount: 16,
    dissolvedCount: 11,
  },
] as const

/** Clamps any step index safely to the valid [0, HENRY_STEPS.length - 1] range. */
export function clampHenryStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.max(0, Math.min(HENRY_STEPS.length - 1, Math.round(step)))
}
