import {
  NCERT_NI_EN_SERIES,
  NCERT_TABLE_5_3,
  photonEnergyJ,
  type ColourRow,
  type NickelEnStep,
} from './ncert-c12-unit5-s7-tables'
import type { SpectralKey } from '@/components/vocab/dblock'

export type ComplexSource = 'table-5-3' | 'ni-en'

export interface LabComplex {
  readonly id: string
  readonly source: ComplexSource
  readonly displayFormula: string
  readonly metalIon: string
  readonly dCount: number
  readonly geometry: 'octahedral' | 'square-planar-or-distorted'
  /** Printed wavelength in nm for Table 5.3; null for Ni(II) en series (NCERT does not print wavelengths). */
  readonly wavelengthNm: number | null
  /** Relative splitting gap (0 to 1) used to position t2g and eg levels visually. */
  readonly relativeGap: number
  readonly absorbedText: string
  readonly observedText: string
  readonly isUv: boolean
  /** Wheel sector absorbed (null when UV or Ni qualitative series). */
  readonly wheelAbsorbed: SpectralKey | null
  /** Wheel sector seen (null when UV or Ni qualitative series). */
  readonly wheelSeen: SpectralKey | null
  /** CSS token or colour value for the solution swatch, matching printed NCERT colour. */
  readonly swatchFill: string
  /** For Ni(II) en series only: number of en ligands (0..3) and water molecules left (6 - 2n). */
  readonly enPerNi?: number
  readonly waterLeft?: number
  readonly note: string
}

const TABLE_5_3_META: Record<
  string,
  {
    displayFormula: string
    metalIon: string
    dCount: number
    wheelAbsorbed: SpectralKey | null
    wheelSeen: SpectralKey | null
    swatchFill: string
    note: string
  }
> = {
  'co-cl-nh3-5': {
    displayFormula: '[CoCl(NH₃)₅]²⁺',
    metalIon: 'Co³⁺',
    dCount: 6,
    wheelAbsorbed: 'yellow',
    wheelSeen: 'violet',
    swatchFill: 'var(--ion-ti3)',
    note: 'Replacing one NH₃ with weak-field Cl⁻ lowers Δₒ and shifts absorption to 535 nm (yellow).',
  },
  'co-nh3-5-h2o': {
    displayFormula: '[Co(NH₃)₅(H₂O)]³⁺',
    metalIon: 'Co³⁺',
    dCount: 6,
    wheelAbsorbed: 'green',
    wheelSeen: 'red',
    swatchFill: 'var(--spec-red)',
    note: 'H₂O splits more than Cl⁻ but less than NH₃, so absorption sits at 500 nm (blue-green) and the complex looks red.',
  },
  'co-nh3-6': {
    displayFormula: '[Co(NH₃)₆]³⁺',
    metalIon: 'Co³⁺',
    dCount: 6,
    wheelAbsorbed: 'blue',
    wheelSeen: 'orange',
    swatchFill: 'var(--spec-orange)',
    note: 'Six NH₃ ligands give a larger Δₒ, absorbing blue light at 475 nm and appearing yellow-orange.',
  },
  'co-cn-6': {
    displayFormula: '[Co(CN)₆]³⁻',
    metalIon: 'Co³⁺',
    dCount: 6,
    wheelAbsorbed: null,
    wheelSeen: null,
    swatchFill: 'var(--ion-fe3)',
    note: 'Strong-field CN⁻ makes Δₒ so large that absorption moves to 310 nm in the ultraviolet (not visible).',
  },
  'cu-h2o-4': {
    displayFormula: '[Cu(H₂O)₄]²⁺',
    metalIon: 'Cu²⁺',
    dCount: 9,
    wheelAbsorbed: 'red',
    wheelSeen: 'blue',
    swatchFill: 'var(--ion-cu2)',
    note: 'Absorbs red light at 600 nm and transmits its complement, blue.',
  },
  'ti-h2o-6': {
    displayFormula: '[Ti(H₂O)₆]³⁺',
    metalIon: 'Ti³⁺',
    dCount: 1,
    wheelAbsorbed: 'green',
    wheelSeen: 'violet',
    swatchFill: 'var(--ion-ti3)',
    note: 'A single 3d electron jumps from t₂g¹ eg⁰ to t₂g⁰ eg¹ by absorbing 498 nm blue-green light, leaving violet.',
  },
}

const NI_EN_META: readonly {
  displayFormula: string
  relativeGap: number
  absorbedText: string
  wheelAbsorbed: SpectralKey
  wheelSeen: SpectralKey
  swatchFill: string
  note: string
}[] = [
  {
    displayFormula: '[Ni(H₂O)₆]²⁺',
    relativeGap: 0.34,
    absorbedText: 'Red region (smaller Δₒ)',
    wheelAbsorbed: 'red',
    wheelSeen: 'green',
    swatchFill: 'var(--ion-ni2)',
    note: 'Six water ligands give the smallest splitting in this series; the solution is green.',
  },
  {
    displayFormula: '[Ni(H₂O)₄(en)]²⁺',
    relativeGap: 0.5,
    absorbedText: 'Orange-red region (larger Δₒ)',
    wheelAbsorbed: 'orange',
    wheelSeen: 'blue',
    swatchFill: 'var(--ion-cu2)',
    note: 'One bidentate en displaces two waters, increasing Δₒ; the solution turns pale blue.',
  },
  {
    displayFormula: '[Ni(H₂O)₂(en)₂]²⁺',
    relativeGap: 0.66,
    absorbedText: 'Yellow-orange region (larger Δₒ)',
    wheelAbsorbed: 'yellow',
    wheelSeen: 'violet',
    swatchFill: 'var(--ion-co3)',
    note: 'Two en ligands leave only two waters bonded to Ni²⁺; the solution turns blue/purple.',
  },
  {
    displayFormula: '[Ni(en)₃]²⁺',
    relativeGap: 0.82,
    absorbedText: 'Yellow-green region (largest Δₒ)',
    wheelAbsorbed: 'yellow',
    wheelSeen: 'violet',
    swatchFill: 'var(--ion-ti3)',
    note: 'Three en ligands displace all six waters, giving the largest Δₒ in the series and a violet solution.',
  },
]

function relativeGapFromWavelength(nm: number): number {
  // Higher energy (shorter wavelength) -> larger gap. Maps 650 nm -> ~0.30, 310 nm -> ~0.95.
  const e = 1 / nm
  const eMin = 1 / 660
  const eMax = 1 / 300
  return Math.min(0.96, Math.max(0.28, 0.28 + ((e - eMin) / (eMax - eMin)) * 0.68))
}

function buildTableRow(row: ColourRow): LabComplex {
  const m = TABLE_5_3_META[row.id]
  return {
    id: row.id,
    source: 'table-5-3',
    displayFormula: m.displayFormula,
    metalIon: m.metalIon,
    dCount: m.dCount,
    geometry: row.id === 'cu-h2o-4' ? 'square-planar-or-distorted' : 'octahedral',
    wavelengthNm: row.wavelengthNm,
    relativeGap: relativeGapFromWavelength(row.wavelengthNm),
    absorbedText: row.absorbed,
    observedText: row.observed,
    isUv: row.wavelengthNm < 400,
    wheelAbsorbed: m.wheelAbsorbed,
    wheelSeen: m.wheelSeen,
    swatchFill: m.swatchFill,
    note: m.note,
  }
}

function buildNiRow(step: NickelEnStep): LabComplex {
  const m = NI_EN_META[step.enPerNi]
  return {
    id: `ni-en-${step.enPerNi}`,
    source: 'ni-en',
    displayFormula: m.displayFormula,
    metalIon: 'Ni²⁺',
    dCount: 8,
    geometry: 'octahedral',
    wavelengthNm: null,
    relativeGap: m.relativeGap,
    absorbedText: m.absorbedText,
    observedText: step.colour,
    isUv: false,
    wheelAbsorbed: m.wheelAbsorbed,
    wheelSeen: m.wheelSeen,
    swatchFill: m.swatchFill,
    enPerNi: step.enPerNi,
    waterLeft: step.waterLeft,
    note: m.note,
  }
}

export const LAB_COMPLEXES: readonly LabComplex[] = [
  ...NCERT_TABLE_5_3.map(buildTableRow),
  ...NCERT_NI_EN_SERIES.map(buildNiRow),
]

export function findLabComplex(id: string): LabComplex {
  return LAB_COMPLEXES.find((c) => c.id === id) ?? LAB_COMPLEXES[5] // default [Ti(H2O)6]3+
}

/** Map a visible wavelength (400..700 nm) to a normalized 0..1 position on the spectrum strip. */
export function wavelengthFraction(nm: number): number {
  return (nm - 400) / (700 - 400)
}

/** Format photon energy in units of 10^-19 J to 2 decimal places. */
export function formatPhotonEnergy(wavelengthNm: number): string {
  const e = photonEnergyJ(wavelengthNm) / 1e-19
  return `${e.toFixed(2)} × 10⁻¹⁹ J`
}
