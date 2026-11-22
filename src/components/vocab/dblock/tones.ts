/** Shared colour names for the d- and f-block drawings. Code uses these maps, never raw strings. */

/** Transition series and the f-block rows, each with one tone used the same way everywhere. */
export const SERIES = ['3d', '4d', '5d', '6d', 'ln', 'an'] as const
export type Series = (typeof SERIES)[number]

export const SERIES_TONE: Readonly<Record<Series, string>> = {
  '3d': 'var(--db-3d)',
  '4d': 'var(--db-4d)',
  '5d': 'var(--db-5d)',
  '6d': 'var(--db-6d)',
  ln: 'var(--db-ln)',
  an: 'var(--db-an)',
}

/** Ions and oxoanions whose colour comes from Table 4.8 (aqua ions) or the oxoanion colours. Each value is a dilute solution, alpha included. */
export const ION_COLOUR_KEYS = [
  'ti3',
  'v4',
  'v3',
  'v2',
  'cr3',
  'cr2',
  'mn3',
  'mn2',
  'fe3',
  'fe2',
  'co3',
  'co2',
  'ni2',
  'cu2',
  'colourless',
  'cro4',
  'cr2o7',
  'mno4',
  'mno4-2',
  'mno2',
] as const
export type IonColourKey = (typeof ION_COLOUR_KEYS)[number]

export const ION_COLOUR_TOKEN: Readonly<Record<IonColourKey, string>> = {
  ti3: 'var(--ion-ti3)',
  v4: 'var(--ion-v4)',
  v3: 'var(--ion-v3)',
  v2: 'var(--ion-v2)',
  cr3: 'var(--ion-cr3)',
  cr2: 'var(--ion-cr2)',
  mn3: 'var(--ion-mn3)',
  mn2: 'var(--ion-mn2)',
  fe3: 'var(--ion-fe3)',
  fe2: 'var(--ion-fe2)',
  co3: 'var(--ion-co3)',
  co2: 'var(--ion-co2)',
  ni2: 'var(--ion-ni2)',
  cu2: 'var(--ion-cu2)',
  colourless: 'var(--ion-colourless)',
  cro4: 'var(--ion-cro4)',
  cr2o7: 'var(--ion-cr2o7)',
  mno4: 'var(--ion-mno4)',
  'mno4-2': 'var(--ion-mno4-2)',
  mno2: 'var(--ion-mno2)',
}

/** Six spectral sectors in wheel order. Opposite sectors (index i and i + 3) are complementary. */
export const SPECTRAL_KEYS = ['red', 'orange', 'yellow', 'green', 'blue', 'violet'] as const
export type SpectralKey = (typeof SPECTRAL_KEYS)[number]

export const SPECTRAL_TOKEN: Readonly<Record<SpectralKey, string>> = {
  red: 'var(--spec-red)',
  orange: 'var(--spec-orange)',
  yellow: 'var(--spec-yellow)',
  green: 'var(--spec-green)',
  blue: 'var(--spec-blue)',
  violet: 'var(--spec-violet)',
}
