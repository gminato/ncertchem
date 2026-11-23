export const CUMENE_STEP_COUNT = 4

export interface CumeneStepMeta {
  index: number
  stageKey: 'benzylic-ch' | 'hydroperoxide' | 'phenyl-shift' | 'dual-products'
  title: string
  ariaLabel: string
}

export const CUMENE_STEPS: readonly CumeneStepMeta[] = [
  {
    index: 0,
    stageKey: 'benzylic-ch',
    title: '1. Cumene (isopropylbenzene)',
    ariaLabel:
      'Cumene displays a tertiary benzylic C-H bond between the benzene ring and two methyl groups.',
  },
  {
    index: 1,
    stageKey: 'hydroperoxide',
    title: '2. Air oxidation to cumene hydroperoxide',
    ariaLabel:
      'Oxygen from air inserts into the tertiary benzylic C-H bond to form cumene hydroperoxide with a weak O-O bond.',
  },
  {
    index: 2,
    stageKey: 'phenyl-shift',
    title: '3. Acid-catalysed cleavage and phenyl shift',
    ariaLabel:
      'Dilute acid protonates the outer oxygen; as water leaves and the O-O bond breaks, the phenyl ring shifts onto the inner oxygen.',
  },
  {
    index: 3,
    stageKey: 'dual-products',
    title: '4. Hydrolysis into phenol and acetone',
    ariaLabel:
      'Hydrolysis splits the intermediate into phenol and the valuable industrial by-product acetone.',
  },
] as const

export function cumeneStepMeta(step: number): CumeneStepMeta {
  const index = Math.min(CUMENE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  return CUMENE_STEPS[index]
}
