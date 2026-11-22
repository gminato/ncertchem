import { EnergyProfile, type EnergyProfileProps } from '@/components/vocab/kinetics/EnergyProfile'

/** Drawing box for a mechanism profile. */
export const MECHANISM_PROFILE_SIZE = { width: 560, height: 300 } as const

/** EnergyProfile draws its y title 44 units left of x and its x title 34 units below the plot, so leave room for both. */
const MARGIN_LEFT = 60
const MARGIN_RIGHT = 12
const MARGIN_TOP = 10
const MARGIN_BOTTOM = 44

/**
 * Stationary energies from reactants to products (see EnergyProfile): even indices are valleys,
 * odd indices are peaks. Schematic levels only, so no numbers are shown on the axes.
 */
const LEVELS = {
  'one-step': [0.3, 0.95, 0.12],
  'two-step': [0.3, 0.95, 0.6, 0.8, 0.12],
} as const

export interface MechanismProfileProps extends Omit<EnergyProfileProps, 'profile' | 'reactant' | 'product' | 'xTitle' | 'yTitle' | 'width' | 'height'> {
  /** 'one-step' (SN2: one hump labelled transition state) or 'two-step' (SN1: two humps, the first higher, the carbocation in the valley). */
  kind: keyof typeof LEVELS
}

/** Energy against reaction coordinate for a one-step or two-step mechanism, with the same axis titles in every Section. */
export function MechanismProfile({ kind, ...rest }: MechanismProfileProps) {
  const profile = [...LEVELS[kind]]
  const labels =
    kind === 'one-step'
      ? { peakLabel: 'transition state' }
      : { peakLabel: 'transition state 1', intermediateLabel: 'carbocation intermediate' }
  return (
    <EnergyProfile
      x={MARGIN_LEFT}
      y={MARGIN_TOP}
      width={MECHANISM_PROFILE_SIZE.width - MARGIN_LEFT - MARGIN_RIGHT}
      height={MECHANISM_PROFILE_SIZE.height - MARGIN_TOP - MARGIN_BOTTOM}
      profile={profile}
      reactant={profile[0]}
      product={profile[profile.length - 1]}
      reactantsLabel="reactants"
      productsLabel="products"
      xTitle="Reaction coordinate"
      yTitle="Energy"
      {...labels}
      {...rest}
    />
  )
}
