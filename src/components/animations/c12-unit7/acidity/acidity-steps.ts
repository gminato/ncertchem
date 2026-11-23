import { NCERT_TABLE_7_3, NCERT_UNIT7_ORDERS } from '@/lib/chem/ncert-c12-unit7-data'
import { PHENOL_RESONANCE_FORMS, PHENOXIDE_RESONANCE_FORMS } from './PhenolicRingSvg'

export const ACIDITY_STEP_COUNT = 5

export const ACIDITY_STEP_TITLES = [
  'Two bond-cleavage modes & Brønsted transfer',
  '+I alkyl push vs water (1° > 2° ≫ 3°)',
  'Neutral phenol: sp² C–O & charge separation',
  'Phenoxide resonance vs localised ethoxide',
  'Ring substituents shift phenoxide stability',
] as const

export interface Table73BarItem {
  label: string
  pKa: number
  printed: string
  category: 'nitro' | 'phenol' | 'cresol' | 'alcohol'
}

function getPka(name: string) {
  const row = NCERT_TABLE_7_3.find((r) => r.name === name)
  if (!row) throw new Error(`Missing Table 7.3 entry: ${name}`)
  return row
}

export const SUBSTITUENT_PKA_ITEMS: readonly Table73BarItem[] = [
  { label: 'p-NO₂', pKa: getPka('p-Nitrophenol').pKa, printed: getPka('p-Nitrophenol').printed, category: 'nitro' },
  { label: 'o-NO₂', pKa: getPka('o-Nitrophenol').pKa, printed: getPka('o-Nitrophenol').printed, category: 'nitro' },
  { label: 'm-NO₂', pKa: getPka('m-Nitrophenol').pKa, printed: getPka('m-Nitrophenol').printed, category: 'nitro' },
  { label: 'Phenol', pKa: getPka('Phenol').pKa, printed: getPka('Phenol').printed, category: 'phenol' },
  { label: 'm-Cresol', pKa: getPka('m-Cresol').pKa, printed: getPka('m-Cresol').printed, category: 'cresol' },
  { label: 'o/p-Cresol', pKa: getPka('o-Cresol').pKa, printed: getPka('o-Cresol').printed, category: 'cresol' },
  { label: 'Ethanol', pKa: getPka('Ethanol').pKa, printed: getPka('Ethanol').printed, category: 'alcohol' },
] as const

export const ACIDITY_ORDERS = {
  alcohols: NCERT_UNIT7_ORDERS.alcoholAcidity,
  bronsted: NCERT_UNIT7_ORDERS.bronstedAcidStrength,
} as const

export const RESONANCE_COUNTS = {
  neutralPhenolForms: PHENOL_RESONANCE_FORMS.length,
  phenoxideForms: PHENOXIDE_RESONANCE_FORMS.length,
  phenoxideRingChargeSites: 3,
} as const
