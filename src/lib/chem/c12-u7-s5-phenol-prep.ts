/**
 * Pure domain model and verified NCERT data bindings for Section 7.4.2 ("Preparation of Phenols").
 * Imports canonical conditions from `ncert-c12-unit7-data.ts` and verifies neutral/ionic carbon
 * skeletons through `parseSmiles` and `molecularFormula`.
 */
import { molecularFormula, parseSmiles } from './molecule-parse'
import { NCERT_7_4_2_PHENOL_PREP } from './ncert-c12-unit7-data'

export type RouteSubstrateId = 'chlorobenzene' | 'benzene' | 'aniline' | 'cumene'

export type PipelineStatusKind = 'complete' | 'intermediate' | 'trapped' | 'blocked' | 'decomposed'

export interface RouteSpeciesRecord {
  id: string
  name: string
  formulaUnicode: string
  /** Kekulé SMILES for structures representable in the supported SMILES subset (null for hexavalent S). */
  smiles: string | null
  expectedHillFormula: string
}

export const PHENOL_PREP_SPECIES = {
  benzene: {
    id: 'benzene',
    name: 'Benzene',
    formulaUnicode: 'C₆H₆',
    smiles: 'C1=CC=CC=C1',
    expectedHillFormula: 'C6H6',
  },
  chlorobenzene: {
    id: 'chlorobenzene',
    name: 'Chlorobenzene',
    formulaUnicode: 'C₆H₅Cl',
    smiles: 'ClC1=CC=CC=C1',
    expectedHillFormula: 'C6H5Cl',
  },
  sodiumPhenoxide: {
    id: 'sodiumPhenoxide',
    name: 'Sodium phenoxide',
    formulaUnicode: 'C₆H₅O⁻ Na⁺',
    smiles: '[O-]C1=CC=CC=C1',
    expectedHillFormula: 'C6H5O-',
  },
  benzenesulphonicAcid: {
    id: 'benzenesulphonicAcid',
    name: 'Benzenesulphonic acid',
    formulaUnicode: 'C₆H₅SO₃H',
    smiles: null,
    expectedHillFormula: 'C6H6O3S',
  },
  aniline: {
    id: 'aniline',
    name: 'Aniline',
    formulaUnicode: 'C₆H₅NH₂',
    smiles: 'NC1=CC=CC=C1',
    expectedHillFormula: 'C6H7N',
  },
  benzeneDiazoniumChloride: {
    id: 'benzeneDiazoniumChloride',
    name: 'Benzene diazonium chloride',
    formulaUnicode: 'C₆H₅N₂⁺ Cl⁻',
    smiles: '[N+](#N)C1=CC=CC=C1',
    expectedHillFormula: 'C6H5N2+',
  },
  cumene: {
    id: 'cumene',
    name: 'Cumene (isopropylbenzene)',
    formulaUnicode: 'C₆H₅–CH(CH₃)₂',
    smiles: 'CC(C)C1=CC=CC=C1',
    expectedHillFormula: 'C9H12',
  },
  cumeneHydroperoxide: {
    id: 'cumeneHydroperoxide',
    name: 'Cumene hydroperoxide',
    formulaUnicode: 'C₆H₅–C(CH₃)₂–O–O–H',
    smiles: 'CC(C)(OO)C1=CC=CC=C1',
    expectedHillFormula: 'C9H12O2',
  },
  phenol: {
    id: 'phenol',
    name: 'Phenol',
    formulaUnicode: 'C₆H₅OH',
    smiles: 'OC1=CC=CC=C1',
    expectedHillFormula: 'C6H6O',
  },
  acetone: {
    id: 'acetone',
    name: 'Acetone',
    formulaUnicode: 'CH₃COCH₃',
    smiles: 'CC(=O)C',
    expectedHillFormula: 'C3H6O',
  },
} as const satisfies Record<string, RouteSpeciesRecord>

/** Sanity check helper used by unit tests to ensure SMILES formulas stay aligned. */
export function verifyParsedSpeciesFormulas(): Array<{ id: string; actual: string; expected: string }> {
  const mismatches: Array<{ id: string; actual: string; expected: string }> = []
  for (const entry of Object.values(PHENOL_PREP_SPECIES)) {
    if (!entry.smiles) continue
    const actual = molecularFormula(parseSmiles(entry.smiles))
    if (actual !== entry.expectedHillFormula) {
      mismatches.push({ id: entry.id, actual, expected: entry.expectedHillFormula })
    }
  }
  return mismatches
}

/** Exact numeric thresholds pulled from `NCERT_7_4_2_PHENOL_PREP`. */
const HALOARENE_RECORD = NCERT_7_4_2_PHENOL_PREP.find((r) => r.id === 'from-haloarenes')!
const DIAZONIUM_RECORD = NCERT_7_4_2_PHENOL_PREP.find((r) => r.id === 'from-diazonium-salts')!

export const CHLOROBENZENE_TARGET_TEMP_K = HALOARENE_RECORD.temperatureK as number // 623 K
export const CHLOROBENZENE_EQUATION_PRESSURE_ATM = HALOARENE_RECORD.pressureAtm as number // 300 atm
export const CHLOROBENZENE_TEXT_PRESSURE_ATM = 320
export const DIAZONIUM_TEMP_MIN_K = (DIAZONIUM_RECORD.temperatureK as [number, number])[0] // 273 K
export const DIAZONIUM_TEMP_MAX_K = (DIAZONIUM_RECORD.temperatureK as [number, number])[1] // 278 K

export interface WorkbenchState {
  substrate: RouteSubstrateId
  /** Chlorobenzene controls */
  chloroTempK: number
  chloroPressureAtm: number
  chloroAcidify: boolean
  /** Benzene controls */
  benzeneStep1: 'none' | 'oleum'
  benzeneStep2: 'aqueous' | 'molten'
  benzeneAcidify: boolean
  /** Aniline controls */
  anilineTempK: number
  anilineStep2: 'cold' | 'warm'
  /** Cumene controls */
  cumeneOxygen: boolean
  cumeneAcid: boolean
}

export const DEFAULT_WORKBENCH_STATE: WorkbenchState = {
  substrate: 'chlorobenzene',
  chloroTempK: CHLOROBENZENE_TARGET_TEMP_K,
  chloroPressureAtm: CHLOROBENZENE_EQUATION_PRESSURE_ATM,
  chloroAcidify: true,
  benzeneStep1: 'oleum',
  benzeneStep2: 'molten',
  benzeneAcidify: true,
  anilineTempK: 275,
  anilineStep2: 'warm',
  cumeneOxygen: true,
  cumeneAcid: true,
}

export interface PipelineStageVisual {
  kind:
    | 'benzene'
    | 'chlorobenzene'
    | 'benzenesulphonicAcid'
    | 'phenoxide'
    | 'aniline'
    | 'diazonium'
    | 'cumene'
    | 'hydroperoxide'
    | 'phenol'
    | 'blocked'
    | 'degraded'
  label: string
  formula: string
}

export interface WorkbenchOutcome {
  substrate: RouteSubstrateId
  statusKind: PipelineStatusKind
  statusLabel: string
  step1Active: boolean
  step2Active: boolean
  step1Reagent: string
  step1Condition: string
  step2Reagent: string
  step2Condition: string
  startNode: PipelineStageVisual
  intermediateNode: PipelineStageVisual
  productNode: PipelineStageVisual
  coProductFormula: string | null
  activeIntermediateText: string
  organicProductsText: string
  byProductsText: string
  explanation: string
  gasBubbles: boolean
  /** Screen-reader live summary sentence. */
  liveSummary: string
}

export function evaluateWorkbench(state: WorkbenchState): WorkbenchOutcome {
  switch (state.substrate) {
    case 'chlorobenzene':
      return evaluateChlorobenzene(state)
    case 'benzene':
      return evaluateBenzene(state)
    case 'aniline':
      return evaluateAniline(state)
    case 'cumene':
      return evaluateCumene(state)
  }
}

function evaluateChlorobenzene(state: WorkbenchState): WorkbenchOutcome {
  const forcingMet =
    state.chloroTempK >= CHLOROBENZENE_TARGET_TEMP_K &&
    state.chloroPressureAtm >= CHLOROBENZENE_EQUATION_PRESSURE_ATM

  const startNode: PipelineStageVisual = {
    kind: 'chlorobenzene',
    label: 'Chlorobenzene',
    formula: 'C₆H₅Cl',
  }

  if (!forcingMet) {
    const tempLow = state.chloroTempK < CHLOROBENZENE_TARGET_TEMP_K
    const pressLow = state.chloroPressureAtm < CHLOROBENZENE_EQUATION_PRESSURE_ATM
    const missing =
      tempLow && pressLow
        ? `needs >= ${CHLOROBENZENE_TARGET_TEMP_K} K and >= ${CHLOROBENZENE_EQUATION_PRESSURE_ATM} atm`
        : tempLow
          ? `needs >= ${CHLOROBENZENE_TARGET_TEMP_K} K`
          : `needs >= ${CHLOROBENZENE_EQUATION_PRESSURE_ATM} atm`

    const explanation = `No reaction: aryl C–Cl resists mild NaOH (${missing}; NCERT notes 623 K and 300 atm in equation, 320 atm in text).`
    return {
      substrate: 'chlorobenzene',
      statusKind: 'blocked',
      statusLabel: 'No reaction',
      step1Active: false,
      step2Active: false,
      step1Reagent: '+ NaOH',
      step1Condition: `${state.chloroTempK} K, ${state.chloroPressureAtm} atm`,
      step2Reagent: state.chloroAcidify ? 'HCl' : 'No HCl added',
      step2Condition: 'acidification',
      startNode,
      intermediateNode: {
        kind: 'blocked',
        label: 'No substitution',
        formula: 'C₆H₅Cl unchanged',
      },
      productNode: {
        kind: 'blocked',
        label: 'No phenol formed',
        formula: 'Aryl C–Cl intact',
      },
      coProductFormula: null,
      activeIntermediateText: 'None (unreacted chlorobenzene)',
      organicProductsText: 'None (C₆H₅Cl unchanged)',
      byProductsText: 'None',
      explanation,
      gasBubbles: false,
      liveSummary: `Chlorobenzene at ${state.chloroTempK} K and ${state.chloroPressureAtm} atm. ${explanation}`,
    }
  }

  if (!state.chloroAcidify) {
    const explanation =
      'Alkali fusion forms sodium phenoxide, which remains trapped as an ionic salt in excess NaOH until HCl is added.'
    return {
      substrate: 'chlorobenzene',
      statusKind: 'trapped',
      statusLabel: 'Trapped as phenoxide',
      step1Active: true,
      step2Active: false,
      step1Reagent: '+ NaOH',
      step1Condition: `${state.chloroTempK} K, ${state.chloroPressureAtm} atm`,
      step2Reagent: 'HCl OFF',
      step2Condition: 'acidify to release',
      startNode,
      intermediateNode: {
        kind: 'phenoxide',
        label: 'Sodium phenoxide',
        formula: 'C₆H₅O⁻ Na⁺',
      },
      productNode: {
        kind: 'phenoxide',
        label: 'Trapped salt',
        formula: 'C₆H₅O⁻ Na⁺',
      },
      coProductFormula: 'NaCl',
      activeIntermediateText: 'Sodium phenoxide (C₆H₅O⁻ Na⁺)',
      organicProductsText: 'Trapped as C₆H₅O⁻ Na⁺ (turn HCl ON)',
      byProductsText: 'NaCl',
      explanation,
      gasBubbles: false,
      liveSummary: `Chlorobenzene fused with NaOH at ${state.chloroTempK} K and ${state.chloroPressureAtm} atm gives sodium phenoxide. ${explanation}`,
    }
  }

  const explanation =
    'Forcing alkali fusion replaces Cl with O⁻Na⁺, and HCl acidification protonates the phenoxide ion to give phenol.'
  return {
    substrate: 'chlorobenzene',
    statusKind: 'complete',
    statusLabel: 'Complete',
    step1Active: true,
    step2Active: true,
    step1Reagent: '+ NaOH',
    step1Condition: `${state.chloroTempK} K, ${state.chloroPressureAtm} atm`,
    step2Reagent: 'HCl',
    step2Condition: 'acid workup',
    startNode,
    intermediateNode: {
      kind: 'phenoxide',
      label: 'Sodium phenoxide',
      formula: 'C₆H₅O⁻ Na⁺',
    },
    productNode: {
      kind: 'phenol',
      label: 'Phenol',
      formula: 'C₆H₅OH',
    },
    coProductFormula: 'NaCl',
    activeIntermediateText: 'Sodium phenoxide (C₆H₅O⁻ Na⁺)',
    organicProductsText: 'Phenol (C₆H₅OH)',
    byProductsText: 'NaCl',
    explanation,
    gasBubbles: false,
    liveSummary: `Chlorobenzene at ${state.chloroTempK} K and ${state.chloroPressureAtm} atm with HCl workup yields phenol and NaCl.`,
  }
}

function evaluateBenzene(state: WorkbenchState): WorkbenchOutcome {
  const startNode: PipelineStageVisual = {
    kind: 'benzene',
    label: 'Benzene',
    formula: 'C₆H₆',
  }

  if (state.benzeneStep1 === 'none') {
    const explanation =
      'Benzene resists direct hydroxide attack; first sulphonate the ring with oleum to introduce –SO₃H.'
    return {
      substrate: 'benzene',
      statusKind: 'blocked',
      statusLabel: 'No reaction',
      step1Active: false,
      step2Active: false,
      step1Reagent: 'No oleum',
      step1Condition: 'sulphonation skipped',
      step2Reagent: state.benzeneStep2 === 'molten' ? 'Molten NaOH' : 'Aqueous NaOH',
      step2Condition: state.benzeneAcidify ? 'then H⁺' : 'no H⁺',
      startNode,
      intermediateNode: {
        kind: 'blocked',
        label: 'No sulphonic acid',
        formula: 'C₆H₆ unchanged',
      },
      productNode: {
        kind: 'blocked',
        label: 'No phenol formed',
        formula: 'Needs oleum first',
      },
      coProductFormula: null,
      activeIntermediateText: 'None (unreacted benzene)',
      organicProductsText: 'None (C₆H₆ unchanged)',
      byProductsText: 'None',
      explanation,
      gasBubbles: false,
      liveSummary: `Benzene without oleum. ${explanation}`,
    }
  }

  if (state.benzeneStep2 === 'aqueous') {
    const explanation =
      'Oleum forms benzenesulphonic acid (C₆H₅SO₃H), but mild aqueous NaOH only neutralises the acid; molten NaOH with heating is required to fuse the ring.'
    return {
      substrate: 'benzene',
      statusKind: 'intermediate',
      statusLabel: 'Needs molten NaOH',
      step1Active: true,
      step2Active: false,
      step1Reagent: 'Oleum',
      step1Condition: 'sulphonation',
      step2Reagent: 'Aq. NaOH',
      step2Condition: 'too mild for fusion',
      startNode,
      intermediateNode: {
        kind: 'benzenesulphonicAcid',
        label: 'Benzenesulphonic acid',
        formula: 'C₆H₅SO₃H',
      },
      productNode: {
        kind: 'blocked',
        label: 'Fusion incomplete',
        formula: 'Needs molten NaOH',
      },
      coProductFormula: null,
      activeIntermediateText: 'Benzenesulphonic acid (C₆H₅SO₃H)',
      organicProductsText: 'None (stops before phenoxide; select Molten NaOH + heat)',
      byProductsText: 'None',
      explanation,
      gasBubbles: false,
      liveSummary: `Benzene with oleum and aqueous NaOH. ${explanation}`,
    }
  }

  if (!state.benzeneAcidify) {
    const explanation =
      'Heating benzenesulphonic acid with molten NaOH forms sodium phenoxide; switch H⁺ acidification ON to liberate phenol.'
    return {
      substrate: 'benzene',
      statusKind: 'trapped',
      statusLabel: 'Trapped as phenoxide',
      step1Active: true,
      step2Active: false,
      step1Reagent: 'Oleum',
      step1Condition: 'C₆H₅SO₃H formed',
      step2Reagent: '(i) NaOH, heat',
      step2Condition: '(ii) H⁺ OFF',
      startNode,
      intermediateNode: {
        kind: 'phenoxide',
        label: 'Sodium phenoxide',
        formula: 'C₆H₅O⁻ Na⁺',
      },
      productNode: {
        kind: 'phenoxide',
        label: 'Trapped salt',
        formula: 'C₆H₅O⁻ Na⁺',
      },
      coProductFormula: null,
      activeIntermediateText: 'C₆H₅SO₃H -> Sodium phenoxide (C₆H₅O⁻ Na⁺)',
      organicProductsText: 'Trapped as C₆H₅O⁻ Na⁺ (turn H⁺ ON)',
      byProductsText: 'Alkali fusion salts',
      explanation,
      gasBubbles: false,
      liveSummary: `Benzene sulphonated with oleum and fused with molten NaOH stops at sodium phenoxide without H⁺ acidification.`,
    }
  }

  const explanation =
    'Benzene is sulphonated with oleum to benzenesulphonic acid, fused with molten NaOH to sodium phenoxide, and acidified with H⁺ to yield phenol.'
  return {
    substrate: 'benzene',
    statusKind: 'complete',
    statusLabel: 'Complete',
    step1Active: true,
    step2Active: true,
    step1Reagent: 'Oleum',
    step1Condition: 'C₆H₅SO₃H formed',
    step2Reagent: '(i) NaOH, heat',
    step2Condition: '(ii) H⁺ workup',
    startNode,
    intermediateNode: {
      kind: 'benzenesulphonicAcid',
      label: 'Benzenesulphonic acid',
      formula: 'C₆H₅SO₃H',
    },
    productNode: {
      kind: 'phenol',
      label: 'Phenol',
      formula: 'C₆H₅OH',
    },
    coProductFormula: null,
    activeIntermediateText: 'C₆H₅SO₃H -> C₆H₅O⁻ Na⁺',
    organicProductsText: 'Phenol (C₆H₅OH)',
    byProductsText: 'Alkali fusion salts',
    explanation,
    gasBubbles: false,
    liveSummary: `Benzene treated with oleum, molten NaOH with heat, and H⁺ acidification produces phenol.`,
  }
}

function evaluateAniline(state: WorkbenchState): WorkbenchOutcome {
  const startNode: PipelineStageVisual = {
    kind: 'aniline',
    label: 'Aniline',
    formula: 'C₆H₅NH₂',
  }

  if (state.anilineTempK < DIAZONIUM_TEMP_MIN_K) {
    const explanation = `Below ${DIAZONIUM_TEMP_MIN_K} K, the aqueous diazotisation mixture is too cold; hold the ice bath between ${DIAZONIUM_TEMP_MIN_K} K and ${DIAZONIUM_TEMP_MAX_K} K.`
    return {
      substrate: 'aniline',
      statusKind: 'blocked',
      statusLabel: 'Too cold',
      step1Active: false,
      step2Active: false,
      step1Reagent: 'NaNO₂ + HCl',
      step1Condition: `${state.anilineTempK} K (below 273 K)`,
      step2Reagent: state.anilineStep2 === 'warm' ? 'H₂O, warm' : 'Keep cold',
      step2Condition: 'awaits diazonium',
      startNode,
      intermediateNode: {
        kind: 'blocked',
        label: 'Reaction sluggish',
        formula: 'Below 273 K',
      },
      productNode: {
        kind: 'blocked',
        label: 'No phenol formed',
        formula: 'Keep 273-278 K',
      },
      coProductFormula: null,
      activeIntermediateText: 'Incomplete diazotisation below 273 K',
      organicProductsText: 'None',
      byProductsText: 'None',
      explanation,
      gasBubbles: false,
      liveSummary: `Aniline at ${state.anilineTempK} K. ${explanation}`,
    }
  }

  if (state.anilineTempK > DIAZONIUM_TEMP_MAX_K) {
    const explanation = `Above ${DIAZONIUM_TEMP_MAX_K} K, benzene diazonium chloride undergoes premature thermal decomposition, losing N₂ before controlled workup.`
    return {
      substrate: 'aniline',
      statusKind: 'decomposed',
      statusLabel: 'Premature decomposition',
      step1Active: false,
      step2Active: false,
      step1Reagent: 'NaNO₂ + HCl',
      step1Condition: `${state.anilineTempK} K (> 278 K)`,
      step2Reagent: state.anilineStep2 === 'warm' ? 'H₂O, warm' : 'Unstable salt',
      step2Condition: 'decomposed early',
      startNode,
      intermediateNode: {
        kind: 'degraded',
        label: 'Unstable diazonium',
        formula: 'Decomposes > 278 K',
      },
      productNode: {
        kind: 'degraded',
        label: 'Degraded mixture',
        formula: 'Low phenol yield',
      },
      coProductFormula: 'N₂ ↑ + HCl',
      activeIntermediateText: 'C₆H₅N₂⁺Cl⁻ decomposes prematurely above 278 K',
      organicProductsText: 'Degraded mixture (keep diazotisation at 273-278 K)',
      byProductsText: 'N₂ ↑ + HCl (premature loss)',
      explanation,
      gasBubbles: true,
      liveSummary: `Aniline at ${state.anilineTempK} K exceeds 278 K. ${explanation}`,
    }
  }

  if (state.anilineStep2 === 'cold') {
    const explanation = `Within ${DIAZONIUM_TEMP_MIN_K}-${DIAZONIUM_TEMP_MAX_K} K, aniline converts cleanly into benzene diazonium chloride. Switch Step 2 to "Warm with H₂O" to release N₂ and form phenol.`
    return {
      substrate: 'aniline',
      statusKind: 'intermediate',
      statusLabel: 'Diazonium isolated',
      step1Active: true,
      step2Active: false,
      step1Reagent: 'NaNO₂ + HCl',
      step1Condition: `${state.anilineTempK} K (273-278 K)`,
      step2Reagent: 'Held cold',
      step2Condition: 'warm with H₂O next',
      startNode,
      intermediateNode: {
        kind: 'diazonium',
        label: 'Benzene diazonium chloride',
        formula: 'C₆H₅N₂⁺ Cl⁻',
      },
      productNode: {
        kind: 'diazonium',
        label: 'Held in ice bath',
        formula: 'C₆H₅N₂⁺ Cl⁻',
      },
      coProductFormula: null,
      activeIntermediateText: 'Benzene diazonium chloride (C₆H₅N₂⁺ Cl⁻)',
      organicProductsText: 'Held as C₆H₅N₂⁺ Cl⁻ (warm with H₂O for phenol)',
      byProductsText: 'None yet',
      explanation,
      gasBubbles: false,
      liveSummary: `Aniline with NaNO₂ and HCl at ${state.anilineTempK} K isolates benzene diazonium chloride.`,
    }
  }

  const explanation =
    'Cold diazotisation (273-278 K) forms benzene diazonium chloride, and gentle warming with water hydrolyses it cleanly to phenol while N₂ gas bubbles out.'
  return {
    substrate: 'aniline',
    statusKind: 'complete',
    statusLabel: 'Complete',
    step1Active: true,
    step2Active: true,
    step1Reagent: 'NaNO₂ + HCl',
    step1Condition: `${state.anilineTempK} K (273-278 K)`,
    step2Reagent: 'H₂O, warm',
    step2Condition: 'hydrolysis',
    startNode,
    intermediateNode: {
      kind: 'diazonium',
      label: 'Benzene diazonium chloride',
      formula: 'C₆H₅N₂⁺ Cl⁻',
    },
    productNode: {
      kind: 'phenol',
      label: 'Phenol',
      formula: 'C₆H₅OH',
    },
    coProductFormula: 'N₂ ↑ + HCl',
    activeIntermediateText: 'Benzene diazonium chloride (C₆H₅N₂⁺ Cl⁻)',
    organicProductsText: 'Phenol (C₆H₅OH)',
    byProductsText: 'N₂ + HCl',
    explanation,
    gasBubbles: true,
    liveSummary: `Aniline diazotised at ${state.anilineTempK} K and warmed with water yields phenol, N₂ gas, and HCl.`,
  }
}

function evaluateCumene(state: WorkbenchState): WorkbenchOutcome {
  const startNode: PipelineStageVisual = {
    kind: 'cumene',
    label: 'Cumene',
    formula: 'C₆H₅–CH(CH₃)₂',
  }

  if (!state.cumeneOxygen) {
    const explanation =
      'Cumene requires air oxidation (O₂) first to insert oxygen into the tertiary benzylic C–H bond; dilute acid alone cannot oxidise cumene.'
    return {
      substrate: 'cumene',
      statusKind: 'blocked',
      statusLabel: 'No reaction',
      step1Active: false,
      step2Active: false,
      step1Reagent: 'O₂ OFF',
      step1Condition: 'air oxidation needed',
      step2Reagent: state.cumeneAcid ? 'H⁺ / H₂O' : 'Acid OFF',
      step2Condition: 'no peroxide yet',
      startNode,
      intermediateNode: {
        kind: 'blocked',
        label: 'No oxidation',
        formula: 'Cumene unchanged',
      },
      productNode: {
        kind: 'blocked',
        label: 'No phenol formed',
        formula: 'Turn O₂ ON first',
      },
      coProductFormula: null,
      activeIntermediateText: 'None (unreacted cumene)',
      organicProductsText: 'None (cumene unchanged)',
      byProductsText: 'None',
      explanation,
      gasBubbles: false,
      liveSummary: `Cumene without O₂ oxidation. ${explanation}`,
    }
  }

  if (!state.cumeneAcid) {
    const explanation =
      'O₂ (air) oxidises cumene to cumene hydroperoxide. Turn dilute acid (H⁺ / H₂O) ON to cleave it into phenol and acetone.'
    return {
      substrate: 'cumene',
      statusKind: 'intermediate',
      statusLabel: 'Hydroperoxide formed',
      step1Active: true,
      step2Active: false,
      step1Reagent: 'O₂ (air)',
      step1Condition: 'oxidation',
      step2Reagent: 'H⁺ / H₂O OFF',
      step2Condition: 'add dilute acid',
      startNode,
      intermediateNode: {
        kind: 'hydroperoxide',
        label: 'Cumene hydroperoxide',
        formula: 'C₆H₅–C(CH₃)₂–OOH',
      },
      productNode: {
        kind: 'hydroperoxide',
        label: 'Intermediate held',
        formula: 'Needs H⁺ / H₂O',
      },
      coProductFormula: null,
      activeIntermediateText: 'Cumene hydroperoxide (C₆H₅–C(CH₃)₂–O–O–H)',
      organicProductsText: 'Held as cumene hydroperoxide (turn H⁺ / H₂O ON)',
      byProductsText: 'None yet',
      explanation,
      gasBubbles: false,
      liveSummary: `Cumene oxidised by air O₂ forms cumene hydroperoxide.`,
    }
  }

  const explanation =
    'Air oxidation builds cumene hydroperoxide, and dilute acid (H⁺ / H₂O) rearranges and cleaves it into phenol and acetone.'
  return {
    substrate: 'cumene',
    statusKind: 'complete',
    statusLabel: 'Complete',
    step1Active: true,
    step2Active: true,
    step1Reagent: 'O₂ (air)',
    step1Condition: 'oxidation',
    step2Reagent: 'H⁺, H₂O',
    step2Condition: 'dilute acid',
    startNode,
    intermediateNode: {
      kind: 'hydroperoxide',
      label: 'Cumene hydroperoxide',
      formula: 'C₆H₅–C(CH₃)₂–OOH',
    },
    productNode: {
      kind: 'phenol',
      label: 'Phenol',
      formula: 'C₆H₅OH',
    },
    coProductFormula: 'CH₃COCH₃',
    activeIntermediateText: 'Cumene hydroperoxide (C₆H₅–C(CH₃)₂–O–O–H)',
    organicProductsText: 'Phenol (C₆H₅OH) + Acetone (CH₃COCH₃)',
    byProductsText: 'Acetone (CH₃COCH₃)',
    explanation,
    gasBubbles: false,
    liveSummary: `Cumene oxidised with O₂ and cleaved with dilute H⁺/H₂O produces phenol and acetone (CH₃COCH₃).`,
  }
}
