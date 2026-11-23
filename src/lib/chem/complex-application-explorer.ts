import {
  NCERT_APPLICATIONS,
  type ApplicationField,
  type CoordinationApplication,
} from './ncert-c12-unit5-s9-tables'

export type ComplexEffect = 'colour' | 'dissolving' | 'hiding' | 'releasing'

export interface EffectMeta {
  readonly id: ComplexEffect
  readonly label: string
  readonly shortLabel: string
  readonly description: string
}

export const COMPLEX_EFFECTS: readonly EffectMeta[] = [
  {
    id: 'colour',
    label: 'Colour & selective binding',
    shortLabel: 'Colour',
    description: 'Complex formation gives a distinct colour or selective stability for detection and light absorption.',
  },
  {
    id: 'dissolving',
    label: 'Dissolving a solid',
    shortLabel: 'Dissolving',
    description: 'An insoluble metal or salt passes into solution as a soluble coordination ion.',
  },
  {
    id: 'hiding',
    label: 'Hiding the metal',
    shortLabel: 'Hiding the metal',
    description: 'Ligands bind a metal ion tightly so it is carried safely or kept locked in place.',
  },
  {
    id: 'releasing',
    label: 'Releasing on demand',
    shortLabel: 'Releasing the metal',
    description: 'The complex lets go of the metal or bound partner steadily when conditions change.',
  },
] as const

export interface ExplorerUse {
  readonly id: string
  readonly shortLabel: string
  readonly app: CoordinationApplication
  readonly metalLabel: string
  readonly ligandLabel: string
  readonly entityDisplay: string
  readonly effect: ComplexEffect
  readonly whyNeeded: string
  /** Motif hint for the SVG stage. */
  readonly motif: 'linear' | 'tetrahedral' | 'square-planar' | 'ring' | 'chelate'
}

function mustApp(id: string): CoordinationApplication {
  const row = NCERT_APPLICATIONS.find((a) => a.id === id)
  if (!row) throw new Error(`Missing NCERT_APPLICATIONS entry: ${id}`)
  return row
}

/**
 * The 11 uses specified for the Complex Application Explorer, backed directly by NCERT_APPLICATIONS.
 */
export const EXPLORER_USES: readonly ExplorerUse[] = [
  {
    id: 'hardness',
    shortLabel: 'Hardness titration',
    app: mustApp('hardness'),
    metalLabel: 'Ca²⁺, Mg²⁺',
    ligandLabel: 'Na₂EDTA',
    entityDisplay: 'Ca-EDTA / Mg-EDTA',
    effect: 'colour',
    whyNeeded: 'Different stability constants let Ca²⁺ and Mg²⁺ be estimated selectively by titration with Na₂EDTA.',
    motif: 'chelate',
  },
  {
    id: 'gold',
    shortLabel: 'Gold extraction',
    app: mustApp('gold'),
    metalLabel: 'Au (in ore)',
    ligandLabel: 'CN⁻ (O₂, H₂O)',
    entityDisplay: '[Au(CN)₂]⁻',
    effect: 'dissolving',
    whyNeeded: 'Gold dissolves from ore as soluble [Au(CN)₂]⁻, after which zinc displaces metallic gold.',
    motif: 'linear',
  },
  {
    id: 'nickel',
    shortLabel: 'Nickel purification',
    app: mustApp('nickel'),
    metalLabel: 'Impure Ni',
    ligandLabel: '4 CO',
    entityDisplay: '[Ni(CO)₄]',
    effect: 'releasing',
    whyNeeded: 'Impure nickel forms volatile [Ni(CO)₄], leaving impurities behind, then decomposes to release pure nickel.',
    motif: 'tetrahedral',
  },
  {
    id: 'silver-plating',
    shortLabel: 'Electroplating',
    app: mustApp('silver-plating'),
    metalLabel: 'Ag⁺ / Au⁺',
    ligandLabel: '2 CN⁻',
    entityDisplay: '[Ag(CN)₂]⁻',
    effect: 'releasing',
    whyNeeded: 'The cyanide complex releases metal ions slowly, giving a smoother, more even coat than simple ions.',
    motif: 'linear',
  },
  {
    id: 'hypo',
    shortLabel: 'Photographic fixing',
    app: mustApp('hypo'),
    metalLabel: 'Ag⁺ (AgBr)',
    ligandLabel: '2 S₂O₃²⁻ (hypo)',
    entityDisplay: '[Ag(S₂O₃)₂]³⁻',
    effect: 'dissolving',
    whyNeeded: 'Hypo dissolves unexposed AgBr as soluble [Ag(S₂O₃)₂]³⁻ while leaving the dark silver image fixed.',
    motif: 'linear',
  },
  {
    id: 'lead',
    shortLabel: 'Lead poisoning',
    app: mustApp('lead'),
    metalLabel: 'Toxic Pb²⁺',
    ligandLabel: 'EDTA',
    entityDisplay: 'Pb-EDTA chelate',
    effect: 'hiding',
    whyNeeded: 'EDTA wraps toxic lead ions in a stable chelate so the body can excrete them safely.',
    motif: 'chelate',
  },
  {
    id: 'haemoglobin',
    shortLabel: 'Haemoglobin',
    app: mustApp('haemoglobin'),
    metalLabel: 'Fe',
    ligandLabel: 'Haem ligand',
    entityDisplay: 'Haemoglobin',
    effect: 'releasing',
    whyNeeded: 'Iron held in haemoglobin acts as the red pigment of blood that carries and releases oxygen.',
    motif: 'ring',
  },
  {
    id: 'chlorophyll',
    shortLabel: 'Chlorophyll',
    app: mustApp('chlorophyll'),
    metalLabel: 'Mg',
    ligandLabel: 'Macrocyclic ring',
    entityDisplay: 'Chlorophyll',
    effect: 'colour',
    whyNeeded: 'Magnesium held in chlorophyll forms the green pigment responsible for photosynthesis.',
    motif: 'ring',
  },
  {
    id: 'b12',
    shortLabel: 'Vitamin B12',
    app: mustApp('b12'),
    metalLabel: 'Co',
    ligandLabel: 'Corrin ring',
    entityDisplay: 'Vitamin B₁₂ (cyanocobalamine)',
    effect: 'hiding',
    whyNeeded: 'Cobalt coordinated inside vitamin B12 serves as the anti-pernicious anaemia factor.',
    motif: 'ring',
  },
  {
    id: 'wilkinson',
    shortLabel: 'Wilkinson hydrogenation',
    app: mustApp('wilkinson'),
    metalLabel: 'Rh',
    ligandLabel: '3 Ph₃P, Cl⁻',
    entityDisplay: '[(Ph₃P)₃RhCl]',
    effect: 'releasing',
    whyNeeded: 'Wilkinson catalyst binds and releases hydrogen and alkene to catalyse hydrogenation.',
    motif: 'square-planar',
  },
  {
    id: 'cisplatin',
    shortLabel: 'cis-platin',
    app: mustApp('cisplatin'),
    metalLabel: 'Pt',
    ligandLabel: '2 NH₃, 2 Cl⁻',
    entityDisplay: 'cis-platin',
    effect: 'hiding',
    whyNeeded: 'This platinum coordination compound binds in tumour cells and inhibits tumour growth.',
    motif: 'square-planar',
  },
] as const

export const FIELD_LABELS: Record<ApplicationField, string> = {
  analysis: 'Analysis',
  metallurgy: 'Metallurgy',
  biology: 'Biology',
  industry: 'Industry',
  medicine: 'Medicine',
}

export function explorerUseById(id: string): ExplorerUse {
  return EXPLORER_USES.find((u) => u.id === id) ?? EXPLORER_USES[0]
}

export function usesForEffect(effect: ComplexEffect): readonly ExplorerUse[] {
  return EXPLORER_USES.filter((u) => u.effect === effect)
}

export interface PracticeOption {
  readonly id: string
  readonly label: string
  readonly entityTex: string | null
  readonly correct: boolean
}

/**
 * Deterministic 4-choice options for practice mode for a given use.
 * Always includes the correct entity and 3 distinct distractors from other uses.
 */
export function practiceOptionsFor(useId: string): readonly PracticeOption[] {
  const target = explorerUseById(useId)
  const targetIndex = EXPLORER_USES.findIndex((u) => u.id === target.id)
  const others = EXPLORER_USES.filter((u) => u.id !== target.id && u.entityDisplay !== target.entityDisplay)

  // Deterministic stride across the remaining uses so distractors are varied and stable across SSR/CSR.
  const picks: ExplorerUse[] = []
  const step = 3
  for (let i = 0; picks.length < 3 && i < others.length; i++) {
    const candidate = others[(targetIndex + i * step) % others.length]
    if (candidate && !picks.some((p) => p.id === candidate.id)) {
      picks.push(candidate)
    }
  }

  const all: PracticeOption[] = [
    { id: target.id, label: target.entityDisplay, entityTex: target.app.entityTex, correct: true },
    ...picks.map((p) => ({ id: p.id, label: p.entityDisplay, entityTex: p.app.entityTex, correct: false })),
  ]

  // Deterministic rotation based on targetIndex so the correct answer is not always first.
  const shift = targetIndex % all.length
  return [...all.slice(shift), ...all.slice(0, shift)]
}
