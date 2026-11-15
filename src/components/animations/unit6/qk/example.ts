import type { Reaction } from '@/lib/chem/equilibrium'

/**
 * The worked example for Sections 6.6 and 6.7: 2NO(g) + Cl₂(g) ⇌ 2NOCl(g) with Kc = 2.0, which is
 * chosen for the example and is not a measured value. NO and Cl₂ start at 2.0 and 1.0 mol L⁻¹.
 */
export const NOCL_REACTION: Reaction = {
  reactants: [
    { species: 'NO', coefficient: 2, phase: 'g' },
    { species: 'Cl2', coefficient: 1, phase: 'g' },
  ],
  products: [{ species: 'NOCl', coefficient: 2, phase: 'g' }],
}

export const NOCL_K = 2
export const NOCL_START = { NO: 2, Cl2: 1, NOCl: 0 } as const
