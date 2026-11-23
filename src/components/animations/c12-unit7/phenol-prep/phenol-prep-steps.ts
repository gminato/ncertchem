import {
  CHLOROBENZENE_EQUATION_PRESSURE_ATM,
  CHLOROBENZENE_TARGET_TEMP_K,
  CHLOROBENZENE_TEXT_PRESSURE_ATM,
  DIAZONIUM_TEMP_MAX_K,
  DIAZONIUM_TEMP_MIN_K,
  PHENOL_PREP_SPECIES,
} from '@/lib/chem/c12-u7-s5-phenol-prep'

export const PHENOL_PREP_STEP_COUNT = 4

export interface PhenolPrepStepMeta {
  index: number
  routeKey: 'haloarene' | 'sulphonic' | 'diazonium' | 'workup-comparison'
  title: string
  ariaLabel: string
  speciesIds: readonly (keyof typeof PHENOL_PREP_SPECIES)[]
  reagents: readonly string[]
}

export const PHENOL_PREP_STEPS: readonly PhenolPrepStepMeta[] = [
  {
    index: 0,
    routeKey: 'haloarene',
    title: '1. From haloarenes (alkali fusion)',
    ariaLabel: `Chlorobenzene fused with NaOH at ${CHLOROBENZENE_TARGET_TEMP_K} K and ${CHLOROBENZENE_EQUATION_PRESSURE_ATM} atm forms sodium phenoxide, then HCl yields phenol.`,
    speciesIds: ['chlorobenzene', 'sodiumPhenoxide', 'phenol'],
    reagents: [
      'NaOH',
      `${CHLOROBENZENE_TARGET_TEMP_K} K`,
      `${CHLOROBENZENE_EQUATION_PRESSURE_ATM} atm`,
      `${CHLOROBENZENE_TEXT_PRESSURE_ATM} atm (text)`,
      'HCl',
    ],
  },
  {
    index: 1,
    routeKey: 'sulphonic',
    title: '2. From benzenesulphonic acid',
    ariaLabel:
      'Benzene treated with oleum gives benzenesulphonic acid, which on heating with molten NaOH and acidification yields phenol.',
    speciesIds: ['benzene', 'benzenesulphonicAcid', 'sodiumPhenoxide', 'phenol'],
    reagents: ['Oleum', 'molten NaOH, heat', 'H⁺'],
  },
  {
    index: 2,
    routeKey: 'diazonium',
    title: '3. From diazonium salts',
    ariaLabel: `Aniline with NaNO₂ and HCl at ${DIAZONIUM_TEMP_MIN_K}-${DIAZONIUM_TEMP_MAX_K} K forms benzene diazonium chloride, which hydrolyses in warm water to phenol, N₂, and HCl.`,
    speciesIds: ['aniline', 'benzeneDiazoniumChloride', 'phenol'],
    reagents: [
      'NaNO₂ + HCl',
      `${DIAZONIUM_TEMP_MIN_K}-${DIAZONIUM_TEMP_MAX_K} K`,
      'H₂O, warm',
      'N₂ + HCl',
    ],
  },
  {
    index: 3,
    routeKey: 'workup-comparison',
    title: '4. Comparing workups',
    ariaLabel:
      'Alkali routes trap sodium phenoxide until acidified with HCl or H⁺; diazonium hydrolysis gives phenol directly in warm acidic solution.',
    speciesIds: ['sodiumPhenoxide', 'benzeneDiazoniumChloride', 'phenol'],
    reagents: ['HCl / H⁺', 'H₂O, warm', 'N₂ + HCl'],
  },
] as const

export function phenolPrepStepMeta(step: number): PhenolPrepStepMeta {
  const index = Math.min(PHENOL_PREP_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  return PHENOL_PREP_STEPS[index]
}
