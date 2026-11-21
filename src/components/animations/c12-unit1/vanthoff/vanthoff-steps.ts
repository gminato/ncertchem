export interface VantHoffStepConfig {
  readonly index: number
  readonly title: string
  readonly equationBadge: string
  readonly mode: 'baseline' | 'dissociation' | 'association' | 'definitions' | 'equations'
  /** Target van't Hoff factor shown on the live meter. */
  readonly targetI: number
  /** Target apparent-to-normal molar mass ratio (1 / i). */
  readonly targetMassRatio: number
  /** Visual particle count out of 6 nominal solute formula units. */
  readonly particleCount: number
  readonly beakerCaption: string
  readonly footerLine1: string
  readonly footerLine2: string
  readonly badgeText: string
  readonly ariaSummary: string
}

export const VANT_HOFF_STEPS: readonly VantHoffStepConfig[] = [
  {
    index: 0,
    title: 'Non-Electrolyte Baseline',
    equationBadge: 'Glucose(aq): 1 mol → 1 mol',
    mode: 'baseline',
    targetI: 1.0,
    targetMassRatio: 1.0,
    particleCount: 6,
    beakerCaption: '6 nominal → 6 neutral molecules',
    footerLine1: 'Non-electrolytes like glucose stay intact in water.',
    footerLine2: 'Colligative data matches normal molar mass (i = 1).',
    badgeText: 'i = 1.00',
    ariaSummary:
      'Step 1 of 5: Non-electrolyte baseline. Six dissolved glucose molecules stay intact as six particles, giving van’t Hoff factor i equals 1 and normal molar mass.',
  },
  {
    index: 1,
    title: 'Ionic Dissociation Multiplies Particles',
    equationBadge: 'KCl → K⁺ + Cl⁻',
    mode: 'dissociation',
    targetI: 2.0,
    targetMassRatio: 0.5,
    particleCount: 12,
    beakerCaption: '6 formula units → 12 independent ions',
    footerLine1: 'Each KCl splits into K⁺ and Cl⁻, doubling particles.',
    footerLine2: 'ΔTb and ΔTf double, so apparent molar mass halves.',
    badgeText: 'i ≈ 2.00',
    ariaSummary:
      'Step 2 of 5: Dissociation of KCl. Six formula units split into twelve independent K+ and Cl- ions, pushing i toward 2 and halving the apparent molar mass.',
  },
  {
    index: 2,
    title: 'Hydrogen-Bonded Association Pairs Solutes',
    equationBadge: '2 CH₃COOH ⇌ (CH₃COOH)₂',
    mode: 'association',
    targetI: 0.5,
    targetMassRatio: 2.0,
    particleCount: 3,
    beakerCaption: '6 acid molecules → 3 H-bonded dimers',
    footerLine1: 'In non-polar benzene, acids pair via hydrogen bonds.',
    footerLine2: 'Particles halve (i → 0.5), doubling apparent mass.',
    badgeText: 'i ≈ 0.50',
    ariaSummary:
      'Step 3 of 5: Association in benzene. Six ethanoic acid molecules pair via hydrogen bonds into three dimers, reducing i toward 0.5 and doubling apparent molar mass.',
  },
  {
    index: 3,
    title: 'Defining i and the Dilution Trend',
    equationBadge: 'NCERT Table 1.4',
    mode: 'definitions',
    targetI: 2.0,
    targetMassRatio: 0.5,
    particleCount: 12,
    beakerCaption: 'Strong electrolytes approach ideal i as m → 0',
    footerLine1: 'Three equivalent ratios define i from M, ΔT, or moles.',
    footerLine2: 'Diluting electrolytes weakens ion drag so i → n.',
    badgeText: 'i → n',
    ariaSummary:
      'Step 4 of 5: Three equivalent definitions of van’t Hoff factor i alongside the Table 1.4 dilution curves for K2SO4, NaCl, and MgSO4 approaching complete dissociation.',
  },
  {
    index: 4,
    title: 'Four Colligative Laws Unified by i',
    equationBadge: 'All colligative properties × i',
    mode: 'equations',
    targetI: 1.0,
    targetMassRatio: 1.0,
    particleCount: 6,
    beakerCaption: 'Multiply every colligative equation by i',
    footerLine1: 'Inserting van’t Hoff’s factor i restores exact laws.',
    footerLine2: 'Applies to non-electrolytes, salts, and dimers alike.',
    badgeText: 'All × i',
    ariaSummary:
      'Step 5 of 5: All four colligative equations updated with van’t Hoff factor i: relative vapour pressure lowering, boiling-point elevation, freezing-point depression, and osmotic pressure.',
  },
] as const

export function clampVantHoffStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.max(0, Math.min(VANT_HOFF_STEPS.length - 1, Math.round(step)))
}
