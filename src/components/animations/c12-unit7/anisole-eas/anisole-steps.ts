export interface AnisoleStepSpec {
  readonly index: number
  readonly badge: string
  readonly title: string
  readonly activeContributors: readonly ('I' | 'II' | 'III' | 'IV' | 'Hybrid')[]
  readonly chargedRingSites: readonly number[]
  readonly metaPositions: readonly number[]
  readonly footer: string
}

export const ANISOLE_STEP_COUNT = 4

export const ANISOLE_STEPS: readonly AnisoleStepSpec[] = [
  {
    index: 0,
    badge: 'Step 1 of 4',
    title: 'Neutral aryl alkyl ether (:OR)',
    activeContributors: ['I'],
    chargedRingSites: [],
    metaPositions: [3, 5],
    footer: 'Oxygen lone pairs align to conjugate with the benzene π ring',
  },
  {
    index: 1,
    badge: 'Step 2 of 4',
    title: 'Ortho negative charge (Contributor II)',
    activeContributors: ['I', 'II'],
    chargedRingSites: [2],
    metaPositions: [3, 5],
    footer: 'C=O⁺R forms as π electrons shift onto ortho C-2',
  },
  {
    index: 2,
    badge: 'Step 3 of 4',
    title: 'Para & second ortho charge (III, IV)',
    activeContributors: ['III', 'IV'],
    chargedRingSites: [4, 6],
    metaPositions: [3, 5],
    footer: 'Negative charge skips meta C-3 and C-5 in every contributor',
  },
  {
    index: 3,
    badge: 'Step 4 of 4',
    title: 'Electrophile E⁺ attacks ortho & para',
    activeContributors: ['Hybrid'],
    chargedRingSites: [2, 4, 6],
    metaPositions: [3, 5],
    footer: '-OR activates the ring; para product predominates',
  },
] as const

export function getAnisoleStep(step: number): AnisoleStepSpec {
  const idx = Math.min(Math.max(Math.trunc(step), 0), ANISOLE_STEP_COUNT - 1)
  return ANISOLE_STEPS[idx]
}
