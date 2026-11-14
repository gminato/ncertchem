/** Steps of the EverydayChemistry Scrolly Animation (Section 1.1). */

export const EVERYDAY_STEP_COUNT = 4

export interface EverydayStepText {
  /** Title drawn above the picture. */
  title: string
  /** Short caption drawn under the title. */
  caption: string
  /** Visually hidden description, read by screen readers. */
  description: string
}

const TEXT: readonly EverydayStepText[] = [
  {
    title: 'Medicine and digestion',
    caption: 'The acid in the stomach is hydrochloric acid, HCl',
    description:
      'Hydrogen chloride molecule, HCl, the acid in the stomach. It helps digest food and kills many microbes.',
  },
  {
    title: 'Fertilisers',
    caption: 'Ammonia, NH₃, is the starting point for most nitrogen fertilisers',
    description:
      'Ammonia molecule, NH₃. Most nitrogen fertilisers are made from ammonia.',
  },
  {
    title: 'Climate',
    caption: 'Carbon dioxide and methane are greenhouse gases',
    description:
      'Carbon dioxide, CO₂, and methane, CH₄, trap heat in the atmosphere. Chemists study how they form and react.',
  },
  {
    title: 'Matter changes, atom by atom',
    caption: 'Atoms regroup into new molecules, and none are created or lost',
    description:
      'Nitrogen and hydrogen regroup to form ammonia: N₂ plus three H₂ gives two NH₃. The same atoms appear on both sides.',
  },
]

/** The text for a Step, with the Step index clamped to the valid range. */
export function everydayStepText(step: number): EverydayStepText {
  return TEXT[clampEverydayStep(step)]
}

export function clampEverydayStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(EVERYDAY_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}
