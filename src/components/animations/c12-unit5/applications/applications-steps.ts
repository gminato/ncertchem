import {
  NCERT_ANALYTICAL_REAGENTS,
  NCERT_APPLICATIONS,
  type ApplicationField,
  type CoordinationApplication,
} from '@/lib/chem/ncert-c12-unit5-s9-tables'

export interface CoordinationAppStep {
  readonly index: number
  readonly field: ApplicationField
  readonly fieldLabel: string
  readonly heading: string
  readonly captionLine1: string
  readonly captionLine2: string
  readonly applicationIds: readonly string[]
}

export const FIELD_STRIP: readonly { id: ApplicationField; label: string }[] = [
  { id: 'analysis', label: 'Analysis' },
  { id: 'metallurgy', label: 'Metallurgy' },
  { id: 'biology', label: 'Biology' },
  { id: 'industry', label: 'Industry' },
  { id: 'medicine', label: 'Medicine' },
] as const

export function applicationById(id: string): CoordinationApplication {
  const row = NCERT_APPLICATIONS.find((a) => a.id === id)
  if (!row) throw new Error(`No NCERT 5.7 application for id: ${id}`)
  return row
}

export const COORDINATION_APP_STEPS: readonly CoordinationAppStep[] = [
  {
    index: 0,
    field: 'analysis',
    fieldLabel: 'Analysis',
    heading: 'Colour reactions and EDTA titration',
    captionLine1: 'Colour and stability constants give detection and estimation.',
    captionLine2: 'Water hardness (Ca²⁺, Mg²⁺) is titrated with Na₂EDTA.',
    applicationIds: ['hardness'],
  },
  {
    index: 1,
    field: 'metallurgy',
    fieldLabel: 'Metallurgy',
    heading: 'Gold extraction via [Au(CN)₂]⁻',
    captionLine1: 'Gold dissolves as [Au(CN)₂]⁻ (Au +1, CN 2) in aerated cyanide.',
    captionLine2: 'Adding zinc displaces pure solid gold from solution.',
    applicationIds: ['gold'],
  },
  {
    index: 2,
    field: 'metallurgy',
    fieldLabel: 'Metallurgy',
    heading: 'Nickel purification via [Ni(CO)₄]',
    captionLine1: 'Impure nickel forms volatile [Ni(CO)₄] (Ni 0, CN 4).',
    captionLine2: 'Stronger heating decomposes it to deposit pure nickel.',
    applicationIds: ['nickel'],
  },
  {
    index: 3,
    field: 'biology',
    fieldLabel: 'Biology',
    heading: 'Pigments and enzymes in living systems',
    captionLine1: 'Chlorophyll (Mg), haemoglobin (Fe) and vitamin B₁₂ (Co).',
    captionLine2: 'Carboxypeptidase A and carbonic anhydrase act as catalysts.',
    applicationIds: ['chlorophyll', 'haemoglobin', 'b12'],
  },
  {
    index: 4,
    field: 'industry',
    fieldLabel: 'Industry',
    heading: 'Catalysis, smooth plating and hypo fixing',
    captionLine1: 'Wilkinson catalyst hydrogenates alkenes; cyanides plate smoothly.',
    captionLine2: 'Hypo dissolves unexposed AgBr as [Ag(S₂O₃)₂]³⁻.',
    applicationIds: ['wilkinson', 'silver-plating', 'hypo'],
  },
  {
    index: 5,
    field: 'medicine',
    fieldLabel: 'Medicine',
    heading: 'Chelate therapy and cis-platin',
    captionLine1: 'D-penicillamine, desferrioxime B and EDTA remove toxic metals.',
    captionLine2: 'Platinum complexes like cis-platin inhibit tumour growth.',
    applicationIds: ['cu-fe', 'lead', 'cisplatin'],
  },
] as const

export function analyticalReagentsCount(): number {
  return NCERT_ANALYTICAL_REAGENTS.length
}

export function clampStep(step: number): number {
  return Math.min(Math.max(step, 0), COORDINATION_APP_STEPS.length - 1)
}
