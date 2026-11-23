/**
 * Class 12 Unit 7, Section 7.4.4: Reactions of Phenols.
 *
 * Pure chemistry data, pathway definitions, multi-step sequences, and structural specs
 * grounded in NCERT Class 12 Part II Unit 7 Section 7.4.4(c) (pp. 211-213) and
 * `src/lib/chem/ncert-c12-unit7-data.ts`.
 */

import {
  NCERT_7_4_4_PHENOL_REACTIONS,
  NCERT_TABLE_7_3,
  type ReactionConditionRecord,
} from './ncert-c12-unit7-data'

export type RingPosition = 1 | 2 | 3 | 4 | 5 | 6

export type RingRenderMode = 'kekule-a' | 'kekule-b' | 'circle' | 'hybrid' | 'quinone'

export interface RingSubstituentSpec {
  position: RingPosition
  /** Chemical group label placed outward along the bond (e.g. 'OH', 'NO₂', 'O₂N', 'Br', 'SO₃H', 'COOH', 'CHCl₂', 'CHO', 'O'). */
  label: string
  /** Bond order to this substituent (1 for single, 2 for =O in quinone). */
  bondOrder?: 1 | 2
  /** Semantic element colour token key. */
  tone?: 'o' | 'n' | 'hal' | 's' | 'na' | 'c'
  /** Optional lone pairs drawn beside oxygen. */
  lonePairs?: number
  /** Optional formal/partial charge badge near the substituent (e.g. '−', 'δ−'). */
  charge?: string
}

export interface PhenolStructureSpec {
  id: string
  name: string
  subtitle?: string
  ringMode: RingRenderMode
  substituents: readonly RingSubstituentSpec[]
  /** Positions (1-6) with soft highlight wash (e.g. activated ortho/para sites). */
  highlightPositions?: readonly RingPosition[]
  /** Partial charges drawn just outside ring carbons (e.g. δ− at C-2, C-4, C-6). */
  ringCharges?: readonly { position: RingPosition; label: string }[]
  /** Wrap structure in square brackets (for NCERT Reimer-Tiemann intermediates). */
  bracketed?: boolean
  /** Optional tag under the structure such as 'major', 'minor', or 'white ppt.'. */
  tag?: string
  /** Tag tone for emphasis. */
  tagTone?: 'accent' | 'muted' | 'caution' | 'success'
}

export type PhenolPathwayId =
  | 'nitration-dilute'
  | 'nitration-conc'
  | 'nitration-modern'
  | 'bromination-cs2'
  | 'bromination-water'
  | 'kolbe'
  | 'reimer-tiemann'
  | 'zinc-dust'
  | 'chromic-oxidation'

export type PhenolPathwayGroup = 'nitration' | 'bromination' | 'named' | 'redox'

export interface PathwayStepSpec {
  stepNumber: number
  label: string
  reagentAbove: string
  conditionBelow?: string
  reactant: PhenolStructureSpec
  intermediateOrProduct: PhenolStructureSpec
  byProductText?: string
  ringState: string
  explanation: string
}

export interface PhenolPathway {
  id: PhenolPathwayId
  group: PhenolPathwayGroup
  buttonLabel: string
  title: string
  ncertRecordId: string
  reagents: string
  solvent: string
  temperatureText: string
  catalystNote: string
  ringState: string
  majorProduct: string
  minorOrByProducts: string
  observationNote: string
  equationSummary: string
  hasHBondComparison?: boolean
  hasBr2PolarisationComparison?: boolean
  hasPicricAcidityNote?: boolean
  isPoorYield?: boolean
  isPrecipitate?: boolean
  /** Upper-stage reactant -> product(s) summary. */
  stageReactant: PhenolStructureSpec
  stageArrowAbove: string
  stageArrowBelow?: string
  stageProducts: readonly PhenolStructureSpec[]
  stageStoichLeft?: string
  stageStoichRight?: string
  /** Multi-step sequence for Step 1 / Step 2 / Final Product controls when applicable. */
  multiSteps?: readonly PathwayStepSpec[]
}

export const PHENOL_EAS_STEP_COUNT = 5
export const PHENOL_NAMED_REDOX_STEP_COUNT = 5

/** Lookup helper backed by the shared Unit 7 NCERT data array. */
export function findNcertPhenolRecord(id: string): ReactionConditionRecord {
  const record = NCERT_7_4_4_PHENOL_REACTIONS.find((r) => r.id === id)
  if (!record) {
    throw new Error(`Missing NCERT 7.4.4 phenol reaction record: ${id}`)
  }
  return record
}

/** Printed pKa values from NCERT Table 7.3 relevant to Section 7.4.4. */
export function nitrophenolPkaData() {
  const pick = (name: string) => {
    const entry = NCERT_TABLE_7_3.find((e) => e.name === name)
    if (!entry) throw new Error(`Missing Table 7.3 entry: ${name}`)
    return entry
  }
  return {
    phenol: pick('Phenol'),
    oNitrophenol: pick('o-Nitrophenol'),
    pNitrophenol: pick('p-Nitrophenol'),
  }
}

// -----------------------------------------------------------------------------
// Reusable Structure Specs (matching NCERT Class 12 pp. 211-213)
// -----------------------------------------------------------------------------

export const STRUCT_PHENOL: PhenolStructureSpec = {
  id: 'phenol',
  name: 'Phenol',
  ringMode: 'kekule-a',
  substituents: [{ position: 1, label: 'OH', tone: 'o', lonePairs: 2 }],
}

export const STRUCT_PHENOL_PLAIN: PhenolStructureSpec = {
  id: 'phenol-plain',
  name: 'Phenol',
  ringMode: 'kekule-a',
  substituents: [{ position: 1, label: 'OH', tone: 'o' }],
}

export const STRUCT_PHENOL_ACTIVATED: PhenolStructureSpec = {
  id: 'phenol-activated',
  name: 'Phenol (resonance-activated)',
  ringMode: 'hybrid',
  substituents: [{ position: 1, label: 'OH', tone: 'o', lonePairs: 2 }],
  highlightPositions: [2, 4, 6],
  ringCharges: [
    { position: 2, label: 'δ−' },
    { position: 4, label: 'δ−' },
    { position: 6, label: 'δ−' },
  ],
}

export const STRUCT_PHENOXIDE: PhenolStructureSpec = {
  id: 'phenoxide',
  name: 'Sodium phenoxide',
  subtitle: 'C₆H₅O⁻Na⁺',
  ringMode: 'kekule-a',
  substituents: [{ position: 1, label: 'ONa', tone: 'o', lonePairs: 2, charge: '−' }],
  highlightPositions: [2, 4, 6],
  ringCharges: [
    { position: 2, label: 'δ−' },
    { position: 4, label: 'δ−' },
    { position: 6, label: 'δ−' },
  ],
}

export const STRUCT_O_NITROPHENOL: PhenolStructureSpec = {
  id: 'o-nitrophenol',
  name: 'o-Nitrophenol',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'OH', tone: 'o' },
    { position: 2, label: 'NO₂', tone: 'n' },
  ],
  tag: 'steam volatile',
  tagTone: 'accent',
}

export const STRUCT_P_NITROPHENOL: PhenolStructureSpec = {
  id: 'p-nitrophenol',
  name: 'p-Nitrophenol',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'OH', tone: 'o' },
    { position: 4, label: 'NO₂', tone: 'n' },
  ],
  tag: 'less volatile',
  tagTone: 'muted',
}

export const STRUCT_PICRIC_ACID: PhenolStructureSpec = {
  id: 'picric-acid',
  name: '2,4,6-Trinitrophenol',
  subtitle: '(Picric acid)',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'OH', tone: 'o' },
    { position: 2, label: 'NO₂', tone: 'n' },
    { position: 4, label: 'NO₂', tone: 'n' },
    { position: 6, label: 'O₂N', tone: 'n' },
  ],
}

export const STRUCT_DISULPHONIC: PhenolStructureSpec = {
  id: 'phenol-2-4-disulphonic-acid',
  name: 'Phenol-2,4-disulphonic acid',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'OH', tone: 'o' },
    { position: 2, label: 'SO₃H', tone: 's' },
    { position: 4, label: 'SO₃H', tone: 's' },
  ],
}

export const STRUCT_O_BROMOPHENOL: PhenolStructureSpec = {
  id: 'o-bromophenol',
  name: 'o-Bromophenol',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'OH', tone: 'o' },
    { position: 2, label: 'Br', tone: 'hal' },
  ],
  tag: 'Minor',
  tagTone: 'muted',
}

export const STRUCT_P_BROMOPHENOL: PhenolStructureSpec = {
  id: 'p-bromophenol',
  name: 'p-Bromophenol',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'OH', tone: 'o' },
    { position: 4, label: 'Br', tone: 'hal' },
  ],
  tag: 'Major',
  tagTone: 'accent',
}

export const STRUCT_TRIBROMOPHENOL: PhenolStructureSpec = {
  id: 'tribromophenol',
  name: '2,4,6-Tribromophenol',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'OH', tone: 'o' },
    { position: 2, label: 'Br', tone: 'hal' },
    { position: 4, label: 'Br', tone: 'hal' },
    { position: 6, label: 'Br', tone: 'hal' },
  ],
  tag: 'white precipitate',
  tagTone: 'success',
}

export const STRUCT_SALICYLIC_ACID: PhenolStructureSpec = {
  id: 'salicylic-acid',
  name: '2-Hydroxybenzoic acid',
  subtitle: '(Salicylic acid)',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'OH', tone: 'o' },
    { position: 2, label: 'COOH', tone: 'o' },
  ],
  tag: 'Major product',
  tagTone: 'accent',
}

export const STRUCT_BENZAL_INTERMEDIATE: PhenolStructureSpec = {
  id: 'benzal-intermediate',
  name: 'Substituted benzal chloride',
  subtitle: 'o-(CHCl₂)C₆H₄O⁻Na⁺',
  ringMode: 'kekule-a',
  bracketed: true,
  substituents: [
    { position: 1, label: 'O⁻Na⁺', tone: 'o' },
    { position: 2, label: 'CHCl₂', tone: 'hal' },
  ],
  tag: 'Intermediate',
  tagTone: 'accent',
}

export const STRUCT_FORMYL_PHENOXIDE: PhenolStructureSpec = {
  id: 'formyl-phenoxide',
  name: 'o-Formyl phenoxide',
  subtitle: 'o-(CHO)C₆H₄O⁻Na⁺',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'O⁻Na⁺', tone: 'o' },
    { position: 2, label: 'CHO', tone: 'o' },
  ],
}

export const STRUCT_SALICYLALDEHYDE: PhenolStructureSpec = {
  id: 'salicylaldehyde',
  name: 'Salicylaldehyde',
  subtitle: '(2-Hydroxybenzaldehyde)',
  ringMode: 'kekule-a',
  substituents: [
    { position: 1, label: 'OH', tone: 'o' },
    { position: 2, label: 'CHO', tone: 'o' },
  ],
}

export const STRUCT_BENZENE: PhenolStructureSpec = {
  id: 'benzene',
  name: 'Benzene',
  subtitle: 'C₆H₆',
  ringMode: 'kekule-a',
  substituents: [],
}

export const STRUCT_BENZOQUINONE: PhenolStructureSpec = {
  id: 'benzoquinone',
  name: 'Benzoquinone',
  subtitle: '(p-Benzoquinone)',
  ringMode: 'quinone',
  substituents: [
    { position: 1, label: 'O', bondOrder: 2, tone: 'o' },
    { position: 4, label: 'O', bondOrder: 2, tone: 'o' },
  ],
}

// -----------------------------------------------------------------------------
// All 9 NCERT 7.4.4(c) Pathways for Phenol Reaction Bench
// -----------------------------------------------------------------------------

export const PHENOL_PATHWAYS: readonly PhenolPathway[] = [
  {
    id: 'nitration-dilute',
    group: 'nitration',
    buttonLabel: 'Nitration: Dilute HNO₃ (298 K)',
    title: 'Mononitration with dilute HNO₃',
    ncertRecordId: 'phenol-dilute-nitration',
    reagents: 'Dilute HNO₃',
    solvent: 'Aqueous dilute acid',
    temperatureText: '298 K',
    catalystNote: 'No H₂SO₄ needed (ring strongly activated by -OH)',
    ringState: 'Neutral -OH (o,p-directing)',
    majorProduct: 'o-Nitrophenol + p-Nitrophenol',
    minorOrByProducts: 'H₂O',
    observationNote: 'Separated by steam distillation: o-nitrophenol is steam volatile (intramolecular H-bond); p-nitrophenol is less volatile (intermolecular H-bond).',
    equationSummary: 'C₆H₅OH → [Dilute HNO₃, 298 K] o-O₂NC₆H₄OH + p-O₂NC₆H₄OH',
    hasHBondComparison: true,
    stageReactant: STRUCT_PHENOL,
    stageArrowAbove: 'Dilute HNO₃',
    stageArrowBelow: '298 K',
    stageProducts: [STRUCT_O_NITROPHENOL, STRUCT_P_NITROPHENOL],
  },
  {
    id: 'nitration-conc',
    group: 'nitration',
    buttonLabel: 'Nitration: Conc. HNO₃ (Direct)',
    title: 'Direct trinitration with concentrated HNO₃',
    ncertRecordId: 'phenol-conc-nitration',
    reagents: 'Conc. HNO₃',
    solvent: 'Concentrated nitric acid',
    temperatureText: 'Ambient / warm',
    catalystNote: 'Strongly activated ring undergoes 2,4,6-trisubstitution',
    ringState: 'Neutral -OH → 2,4,6-trinitro ring (strong acid)',
    majorProduct: '2,4,6-Trinitrophenol (Picric acid)',
    minorOrByProducts: 'Ring oxidation products',
    observationNote: 'Poor yield (ring oxidation): concentrated HNO₃ oxidises part of the electron-rich phenolic ring.',
    equationSummary: 'C₆H₅OH → [Conc. HNO₃] 2,4,6-trinitrophenol (poor yield)',
    hasPicricAcidityNote: true,
    isPoorYield: true,
    stageReactant: STRUCT_PHENOL,
    stageArrowAbove: 'Conc. HNO₃',
    stageArrowBelow: 'Poor yield',
    stageProducts: [STRUCT_PICRIC_ACID],
  },
  {
    id: 'nitration-modern',
    group: 'nitration',
    buttonLabel: 'Nitration: Conc. H₂SO₄ then Conc. HNO₃',
    title: 'Modern two-step synthesis of picric acid',
    ncertRecordId: 'phenol-conc-nitration',
    reagents: '(i) Conc. H₂SO₄  (ii) Conc. HNO₃',
    solvent: 'Acidic medium (two-step)',
    temperatureText: 'Controlled heating',
    catalystNote: 'Sulphonation converts ring to phenol-2,4-disulphonic acid first',
    ringState: 'Disulphonic intermediate (-SO₃H at C-2, C-4)',
    majorProduct: '2,4,6-Trinitrophenol (Picric acid)',
    minorOrByProducts: 'H₂SO₄ displaced during nitration',
    observationNote: 'Improved yield: sulphonation moderates ring oxidation before conc. HNO₃ introduces all three -NO₂ groups.',
    equationSummary: 'C₆H₅OH → [Conc. H₂SO₄] phenol-2,4-disulphonic acid → [Conc. HNO₃] 2,4,6-trinitrophenol',
    hasPicricAcidityNote: true,
    stageReactant: STRUCT_PHENOL,
    stageArrowAbove: '(i) Conc. H₂SO₄',
    stageArrowBelow: '(ii) Conc. HNO₃',
    stageProducts: [STRUCT_PICRIC_ACID],
    multiSteps: [
      {
        stepNumber: 1,
        label: 'Step 1',
        reagentAbove: 'Conc. H₂SO₄',
        conditionBelow: 'Sulphonation',
        reactant: STRUCT_PHENOL,
        intermediateOrProduct: STRUCT_DISULPHONIC,
        ringState: 'Disulphonic intermediate (-SO₃H at C-2, C-4)',
        explanation: 'Concentrated H₂SO₄ installs -SO₃H groups at positions 2 and 4, giving phenol-2,4-disulphonic acid and protecting the ring from direct oxidative destruction.',
      },
      {
        stepNumber: 2,
        label: 'Final Product',
        reagentAbove: 'Conc. HNO₃',
        conditionBelow: 'Nitration',
        reactant: STRUCT_DISULPHONIC,
        intermediateOrProduct: STRUCT_PICRIC_ACID,
        ringState: '2,4,6-Trinitrophenol (strong acid)',
        explanation: 'Concentrated HNO₃ converts phenol-2,4-disulphonic acid cleanly into 2,4,6-trinitrophenol (picric acid) in improved yield.',
      },
    ],
  },
  {
    id: 'bromination-cs2',
    group: 'bromination',
    buttonLabel: 'Bromination: Br₂ in CS₂ / CHCl₃ (273 K)',
    title: 'Monobromination in low-polarity solvent',
    ncertRecordId: 'phenol-bromination-cs2',
    reagents: 'Br₂',
    solvent: 'CS₂ or CHCl₃ (low polarity)',
    temperatureText: '273 K',
    catalystNote: 'No FeBr₃ Lewis acid needed (-OH polarises Br₂ directly)',
    ringState: 'Neutral -OH (o,p-directing)',
    majorProduct: 'p-Bromophenol (Major)',
    minorOrByProducts: 'o-Bromophenol (Minor) + HBr',
    observationNote: 'Low-polarity solvent suppresses phenol ionisation and slows substitution to monobromination at 273 K.',
    equationSummary: 'C₆H₅OH → [Br₂ in CS₂, 273 K] o-BrC₆H₄OH (minor) + p-BrC₆H₄OH (major)',
    hasBr2PolarisationComparison: true,
    stageReactant: STRUCT_PHENOL,
    stageArrowAbove: 'Br₂ in CS₂',
    stageArrowBelow: '273 K (no FeBr₃)',
    stageProducts: [STRUCT_O_BROMOPHENOL, STRUCT_P_BROMOPHENOL],
  },
  {
    id: 'bromination-water',
    group: 'bromination',
    buttonLabel: 'Bromination: Bromine Water (3 Br₂)',
    title: 'Trisubstitution in aqueous bromine water',
    ncertRecordId: 'phenol-bromine-water',
    reagents: '3 Br₂ (bromine water)',
    solvent: 'Water (polar aqueous medium)',
    temperatureText: 'Room temperature',
    catalystNote: 'No FeBr₃ needed; partial phenoxide formation accelerates EAS',
    ringState: 'Partial phenoxide C₆H₅O⁻ in water',
    majorProduct: '2,4,6-Tribromophenol (white precipitate)',
    minorOrByProducts: '3 HBr',
    observationNote: 'White precipitate of 2,4,6-tribromophenol forms immediately as bromine water is decolorised.',
    equationSummary: 'C₆H₅OH + 3 Br₂ → C₆H₂Br₃OH(s) + 3 HBr',
    hasBr2PolarisationComparison: true,
    isPrecipitate: true,
    stageReactant: STRUCT_PHENOL,
    stageStoichRight: '+ 3 Br₂',
    stageArrowAbove: 'H₂O',
    stageArrowBelow: 'Bromine water',
    stageProducts: [STRUCT_TRIBROMOPHENOL],
  },
  {
    id: 'kolbe',
    group: 'named',
    buttonLabel: 'Kolbe: NaOH, (i) CO₂, (ii) H⁺',
    title: "Kolbe's reaction (carboxylation via phenoxide)",
    ncertRecordId: 'kolbe-reaction',
    reagents: 'NaOH, (i) CO₂, (ii) H⁺',
    solvent: 'Alkaline then aqueous acid work-up',
    temperatureText: 'Mild warming with CO₂',
    catalystNote: 'Phenoxide ion (-O⁻) is more reactive than neutral phenol',
    ringState: 'Phenoxide -O⁻ → Neutral -OH (acid)',
    majorProduct: '2-Hydroxybenzoic acid (Salicylic acid)',
    minorOrByProducts: 'Na⁺ salt intermediate',
    observationNote: 'Phenoxide ion reacts even with weak electrophile CO₂ to form ortho-hydroxybenzoic acid as the main product.',
    equationSummary: 'C₆H₅OH → [NaOH] C₆H₅ONa → [(i) CO₂, (ii) H⁺] o-HOC₆H₄COOH',
    stageReactant: STRUCT_PHENOL,
    stageArrowAbove: 'NaOH',
    stageArrowBelow: '(i) CO₂, (ii) H⁺',
    stageProducts: [STRUCT_SALICYLIC_ACID],
    multiSteps: [
      {
        stepNumber: 1,
        label: 'Step 1',
        reagentAbove: 'NaOH',
        conditionBelow: 'Deprotonation',
        reactant: STRUCT_PHENOL,
        intermediateOrProduct: STRUCT_PHENOXIDE,
        byProductText: '+ H₂O',
        ringState: 'Phenoxide -O⁻ (super-activating)',
        explanation: 'NaOH removes the phenolic proton to form sodium phenoxide, making the ring far more electron-rich at C-2, C-4, and C-6 than neutral phenol.',
      },
      {
        stepNumber: 2,
        label: 'Final Product',
        reagentAbove: '(i) CO₂',
        conditionBelow: '(ii) H⁺',
        reactant: STRUCT_PHENOXIDE,
        intermediateOrProduct: STRUCT_SALICYLIC_ACID,
        ringState: 'Neutral -OH with ortho -COOH',
        explanation: 'The highly reactive phenoxide ring attacks weak electrophile CO₂ at the ortho carbon; acidification (H⁺) releases 2-hydroxybenzoic acid (salicylic acid).',
      },
    ],
  },
  {
    id: 'reimer-tiemann',
    group: 'named',
    buttonLabel: 'Reimer-Tiemann: CHCl₃ + aq. NaOH, NaOH, H⁺',
    title: 'Reimer-Tiemann reaction (ortho formylation)',
    ncertRecordId: 'reimer-tiemann',
    reagents: 'CHCl₃ + aq. NaOH, then NaOH, then H⁺',
    solvent: 'Aqueous alkaline medium',
    temperatureText: 'Warming in aq. alkali',
    catalystNote: 'Proceeds via o-substituted benzal chloride intermediate',
    ringState: 'Phenoxide -O⁻ (ortho substitution)',
    majorProduct: 'Salicylaldehyde (2-hydroxybenzaldehyde)',
    minorOrByProducts: 'NaCl, H₂O',
    observationNote: 'Introduces a -CHO group at the ortho position via the bracketed o-(CHCl₂)C₆H₄O⁻Na⁺ intermediate.',
    equationSummary: 'C₆H₅OH → [CHCl₃ + aq. NaOH] o-(CHCl₂)C₆H₄ONa → [NaOH] o-(CHO)C₆H₄ONa → [H⁺] o-HOC₆H₄CHO',
    stageReactant: STRUCT_PHENOL,
    stageArrowAbove: 'CHCl₃ + aq. NaOH',
    stageArrowBelow: 'then NaOH, H⁺',
    stageProducts: [STRUCT_SALICYLALDEHYDE],
    multiSteps: [
      {
        stepNumber: 1,
        label: 'Step 1',
        reagentAbove: 'CHCl₃ + aq. NaOH',
        conditionBelow: 'Ortho attack',
        reactant: STRUCT_PHENOL,
        intermediateOrProduct: STRUCT_BENZAL_INTERMEDIATE,
        ringState: 'Substituted benzal chloride (-O⁻Na⁺, o-CHCl₂)',
        explanation: 'Phenol reacts with CHCl₃ and aqueous NaOH to form the ortho-substituted benzal chloride intermediate [o-(CHCl₂)C₆H₄O⁻Na⁺].',
      },
      {
        stepNumber: 2,
        label: 'Step 2',
        reagentAbove: 'NaOH',
        conditionBelow: 'Alkaline hydrolysis',
        reactant: STRUCT_BENZAL_INTERMEDIATE,
        intermediateOrProduct: STRUCT_FORMYL_PHENOXIDE,
        ringState: 'Phenoxide salt with ortho -CHO',
        explanation: 'Hydrolysis in the presence of aqueous NaOH converts the ortho -CHCl₂ group into -CHO while the phenolic oxygen stays deprotonated.',
      },
      {
        stepNumber: 3,
        label: 'Final Product',
        reagentAbove: 'H⁺',
        conditionBelow: 'Acidification',
        reactant: STRUCT_FORMYL_PHENOXIDE,
        intermediateOrProduct: STRUCT_SALICYLALDEHYDE,
        ringState: 'Neutral -OH with ortho -CHO',
        explanation: 'Acidification with H⁺ protonates the phenoxide oxygen, releasing salicylaldehyde (2-hydroxybenzaldehyde).',
      },
    ],
  },
  {
    id: 'zinc-dust',
    group: 'redox',
    buttonLabel: 'Reduction: Zn dust (heat)',
    title: 'Reduction of phenol with zinc dust',
    ncertRecordId: 'phenol-zinc-dust',
    reagents: 'Zn dust',
    solvent: 'Neat (solid zinc + phenol)',
    temperatureText: 'Heated (Δ)',
    catalystNote: 'Direct C-O deoxygenation (no catalyst)',
    ringState: 'Aromatic -OH reduced to unsubstituted C₆H₆',
    majorProduct: 'Benzene (C₆H₆)',
    minorOrByProducts: 'ZnO',
    observationNote: 'Heating phenol with zinc dust strips the oxygen atom as solid zinc oxide (ZnO), yielding benzene.',
    equationSummary: 'C₆H₅OH + Zn → [Heat] C₆H₆ + ZnO',
    stageReactant: STRUCT_PHENOL,
    stageStoichRight: '+ Zn',
    stageArrowAbove: 'Heat (Δ)',
    stageProducts: [STRUCT_BENZENE],
  },
  {
    id: 'chromic-oxidation',
    group: 'redox',
    buttonLabel: 'Oxidation: Na₂Cr₂O₇ + H₂SO₄',
    title: 'Oxidation with chromic acid to benzoquinone',
    ncertRecordId: 'phenol-oxidation-chromic',
    reagents: 'Na₂Cr₂O₇, H₂SO₄ (chromic acid)',
    solvent: 'Acidic aqueous medium',
    temperatureText: 'Room temperature / mild',
    catalystNote: 'Oxidative ring conversion (loses aromaticity)',
    ringState: 'Conjugated diketone (p-benzoquinone)',
    majorProduct: 'Benzoquinone (p-benzoquinone)',
    minorOrByProducts: 'Cr³⁺ salts, H₂O',
    observationNote: 'Produces the conjugated diketone benzoquinone; in air alone, phenols slowly oxidise to dark-coloured mixtures containing quinones.',
    equationSummary: 'C₆H₅OH → [Na₂Cr₂O₇, H₂SO₄] O=C₆H₄=O (benzoquinone)',
    stageReactant: STRUCT_PHENOL,
    stageArrowAbove: 'Na₂Cr₂O₇',
    stageArrowBelow: 'H₂SO₄',
    stageProducts: [STRUCT_BENZOQUINONE],
  },
] as const

export const PHENOL_GROUP_LABELS: Record<PhenolPathwayGroup, string> = {
  nitration: 'Nitration',
  bromination: 'Halogenation',
  named: 'Phenoxide & Named',
  redox: 'Redox',
}

export function getPathway(id: PhenolPathwayId): PhenolPathway {
  const found = PHENOL_PATHWAYS.find((p) => p.id === id)
  if (!found) {
    throw new Error(`Unknown phenol pathway: ${id}`)
  }
  return found
}

export function clampStep(step: number, total: number): number {
  if (total <= 1) return 0
  return Math.min(total - 1, Math.max(0, Math.round(step)))
}
