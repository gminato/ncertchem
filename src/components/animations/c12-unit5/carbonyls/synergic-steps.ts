import { NCERT_SYNERGIC_BOND } from '@/lib/chem/ncert-c12-unit5-s8-tables'

export const SYNERGIC_STEP_COUNT = 4

export type SynergicVisual = 'parts' | 'sigma' | 'pi' | 'synergy'

export interface SynergicStepState {
  readonly kind: SynergicVisual
  readonly showSigmaArrow: boolean
  readonly showPiArrows: boolean
  readonly vacantMetalFilled: boolean
  readonly piStarFilled: boolean
  readonly metalNegativeTint: boolean
  readonly mcBondStrength: 'none' | 'single' | 'synergic'
  readonly heading: string
  readonly caption: string
}

export const SYNERGIC_STEPS: readonly SynergicStepState[] = [
  {
    kind: 'parts',
    showSigmaArrow: false,
    showPiArrows: false,
    vacantMetalFilled: false,
    piStarFilled: false,
    metalNegativeTint: false,
    mcBondStrength: 'none',
    heading: 'Unbonded metal and CO orbitals',
    caption: 'Metal has a vacant orbital and a filled d orbital; CO has a filled C lone pair and vacant pi* orbitals.',
  },
  {
    kind: 'sigma',
    showSigmaArrow: true,
    showPiArrows: false,
    vacantMetalFilled: true,
    piStarFilled: false,
    metalNegativeTint: true,
    mcBondStrength: 'single',
    heading: 'Sigma bond: C to M',
    caption: `Carbon donates its ${NCERT_SYNERGIC_BOND.sigma.donor} into the ${NCERT_SYNERGIC_BOND.sigma.acceptor}.`,
  },
  {
    kind: 'pi',
    showSigmaArrow: false,
    showPiArrows: true,
    vacantMetalFilled: true,
    piStarFilled: true,
    metalNegativeTint: false,
    mcBondStrength: 'single',
    heading: 'Pi bond: M to C (back donation)',
    caption: `A ${NCERT_SYNERGIC_BOND.pi.donor} donates into the ${NCERT_SYNERGIC_BOND.pi.acceptor}.`,
  },
  {
    kind: 'synergy',
    showSigmaArrow: true,
    showPiArrows: true,
    vacantMetalFilled: true,
    piStarFilled: true,
    metalNegativeTint: false,
    mcBondStrength: 'synergic',
    heading: 'Synergic bonding',
    caption: 'Each donation makes the other easier, strengthening the M-CO bond.',
  },
]

export function synergicStepState(step: number): SynergicStepState {
  const clamped = Math.min(Math.max(Math.trunc(step), 0), SYNERGIC_STEP_COUNT - 1)
  return SYNERGIC_STEPS[clamped] ?? SYNERGIC_STEPS[0]
}
