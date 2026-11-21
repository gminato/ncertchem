/**
 * Step data and state helpers for the ConcentrationScales Scrolly animation
 * (Class 12, Unit 1, Section 1.2).
 */

export interface ConcentrationStepMeta {
  index: number;
  badge: string;
  title: string;
  takeaway: string;
  ariaLabel: string;
  targetTempC: number;
}

export const CONCENTRATION_STEPS: readonly ConcentrationStepMeta[] = [
  {
    index: 0,
    badge: 'Step 1 of 5',
    title: 'Qualitative labels vs exact ratios',
    takeaway: 'Words like "dilute" are vague; quantitative ratios fix exact composition.',
    ariaLabel:
      'Comparison of two beakers labeled dilute and concentrated beside a quantitative ratio card showing solute over solution or solvent.',
    targetTempC: 25,
  },
  {
    index: 1,
    badge: 'Step 2 of 5',
    title: 'Percentage scales and trace ppm',
    takeaway: 'Use %, w/w, V/V, or w/V for everyday mixes and ppm (× 10⁶) for trace solutes.',
    ariaLabel:
      'Three percentage cards for mass percent, volume percent, and mass by volume percent above a parts per million diagram showing 5.8 ppm dissolved oxygen in seawater.',
    targetTempC: 25,
  },
  {
    index: 2,
    badge: 'Step 3 of 5',
    title: 'Mole fraction: pure particle counts',
    takeaway: 'Mole fraction x_i is dimensionless and all fractions always add up to 1.',
    ariaLabel:
      'Particle grid showing 4 solute particles and 16 solvent particles feeding into a stacked bar where solute mole fraction 0.20 plus solvent mole fraction 0.80 equals 1.00.',
    targetTempC: 25,
  },
  {
    index: 3,
    badge: 'Step 4 of 5',
    title: 'Molarity (M) vs Molality (m)',
    takeaway: 'Molarity divides by solution volume (L); molality divides by solvent mass (kg).',
    ariaLabel:
      'Side-by-side comparison showing molarity measured in a 1 litre volumetric flask versus molality weighed on a balance with 1 kilogram of solvent.',
    targetTempC: 25,
  },
  {
    index: 4,
    badge: 'Step 5 of 5',
    title: 'Heating the flask: why M shifts',
    takeaway: 'Warming expands volume so M decreases, whereas m, x, and mass % stay constant.',
    ariaLabel:
      'Heated volumetric flask expanding above its 1 litre mark at 80 degrees Celsius beside meters showing molarity decreasing while molality, mole fraction, and mass percent remain locked.',
    targetTempC: 80,
  },
] as const;

export const CONCENTRATION_STEP_COUNT = CONCENTRATION_STEPS.length;

export function clampConcentrationStep(step: number): number {
  if (!Number.isFinite(step)) return 0;
  const rounded = Math.round(step);
  if (rounded < 0) return 0;
  if (rounded >= CONCENTRATION_STEP_COUNT) return CONCENTRATION_STEP_COUNT - 1;
  return rounded;
}

export function getConcentrationStep(step: number): ConcentrationStepMeta {
  return CONCENTRATION_STEPS[clampConcentrationStep(step)];
}

/**
 * Computes the reference 1.000 M aqueous urea solution's apparent molarity
 * when warmed from 20 °C to tempC using water's thermal expansion coefficient.
 */
export function heatedMolarity(tempC: number): number {
  const beta = 0.000257;
  const factor = 1 + beta * (tempC - 20);
  return 1.0 / factor;
}
