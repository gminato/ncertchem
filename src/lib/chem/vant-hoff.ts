import {
  GAS_CONSTANT_L_BAR,
  NCERT_SOLVENT_CONSTANTS,
  NCERT_VANT_HOFF_SALTS,
  type SolventColligativeEntry,
  type VantHoffSaltEntry,
} from './ncert-c12-unit1-tables'

export { NCERT_VANT_HOFF_SALTS }

export type SoluteBehaviour = 'none' | 'dissociation' | 'association'

export interface VantHoffPreset {
  readonly id:
    | 'urea'
    | 'nacl'
    | 'k2so4'
    | 'acetic-acid-benzene'
    | 'benzoic-acid-benzene'
  readonly name: string
  readonly shortLabel: string
  readonly formula: string
  readonly solventId: 'water' | 'benzene'
  readonly solventName: string
  readonly normalMolarMassGPerMol: number
  readonly behaviour: SoluteBehaviour
  /** Number of ions per formula unit (dissociation) or molecules per aggregate (association). */
  readonly n: number
  readonly defaultAlpha: number
  readonly equationLabel: string
  readonly particleSummary: string
  /** Optional id linking to NCERT Table 1.4 salt dilution series. */
  readonly saltTableId?: 'nacl' | 'kcl' | 'mgso4' | 'k2so4'
}

export const VANT_HOFF_PRESETS: readonly VantHoffPreset[] = [
  {
    id: 'urea',
    name: 'Urea in water',
    shortLabel: 'Urea (non-electrolyte)',
    formula: 'NH₂CONH₂',
    solventId: 'water',
    solventName: 'Water',
    normalMolarMassGPerMol: 60.06,
    behaviour: 'none',
    n: 1,
    defaultAlpha: 0,
    equationLabel: 'NH₂CONH₂(s) → NH₂CONH₂(aq)',
    particleSummary: 'Stays intact as single neutral molecules (i = 1).',
  },
  {
    id: 'nacl',
    name: 'Sodium chloride in water',
    shortLabel: 'NaCl (1:1 salt)',
    formula: 'NaCl',
    solventId: 'water',
    solventName: 'Water',
    normalMolarMassGPerMol: 58.44,
    behaviour: 'dissociation',
    n: 2,
    defaultAlpha: 0.87,
    equationLabel: 'NaCl(aq) → Na⁺(aq) + Cl⁻(aq)',
    particleSummary: 'Splits into 2 ions per formula unit (i approaches 2 on dilution).',
    saltTableId: 'nacl',
  },
  {
    id: 'k2so4',
    name: 'Potassium sulphate in water',
    shortLabel: 'K₂SO₄ (1:2 salt)',
    formula: 'K₂SO₄',
    solventId: 'water',
    solventName: 'Water',
    normalMolarMassGPerMol: 174.26,
    behaviour: 'dissociation',
    n: 3,
    defaultAlpha: 0.66,
    equationLabel: 'K₂SO₄(aq) → 2 K⁺(aq) + SO₄²⁻(aq)',
    particleSummary: 'Splits into 3 ions per formula unit (i approaches 3 on dilution).',
    saltTableId: 'k2so4',
  },
  {
    id: 'acetic-acid-benzene',
    name: 'Ethanoic acid in benzene',
    shortLabel: 'CH₃COOH in benzene',
    formula: 'CH₃COOH',
    solventId: 'benzene',
    solventName: 'Benzene',
    normalMolarMassGPerMol: 60.05,
    behaviour: 'association',
    n: 2,
    defaultAlpha: 0.9,
    equationLabel: '2 CH₃COOH ⇌ (CH₃COOH)₂',
    particleSummary: 'Pairs via H-bonding into dimers (i drops toward 0.5).',
  },
  {
    id: 'benzoic-acid-benzene',
    name: 'Benzoic acid in benzene',
    shortLabel: 'Benzoic acid in benzene (dimer)',
    formula: 'C₆H₅COOH',
    solventId: 'benzene',
    solventName: 'Benzene',
    normalMolarMassGPerMol: 122.12,
    behaviour: 'association',
    n: 2,
    defaultAlpha: 0.9,
    equationLabel: '2 C₆H₅COOH ⇌ (C₆H₅COOH)₂',
    particleSummary: 'Pairs via H-bonding into cyclic dimers (i drops toward 0.5).',
  },
] as const

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number`)
  }
}

function assertAlpha(alpha: number): void {
  assertFinite('alpha', alpha)
  if (alpha < 0 || alpha > 1) {
    throw new RangeError('alpha must be between 0 and 1 inclusive')
  }
}

/**
 * van't Hoff factor for dissociation into nIons particles per formula unit:
 *   i = 1 + (n - 1) * alpha
 */
export function vantHoffDissociation({
  nIons,
  alpha,
}: {
  nIons: number
  alpha: number
}): number {
  assertFinite('nIons', nIons)
  if (nIons < 1) {
    throw new RangeError('nIons must be at least 1')
  }
  assertAlpha(alpha)
  return 1 + (nIons - 1) * alpha
}

/**
 * Degree of dissociation alpha from an observed van't Hoff factor i:
 *   alpha = (i - 1) / (n - 1)
 */
export function alphaFromDissociation({
  i,
  nIons,
}: {
  i: number
  nIons: number
}): number {
  assertFinite('i', i)
  assertFinite('nIons', nIons)
  if (nIons <= 1) {
    throw new RangeError('nIons must be greater than 1 for dissociation')
  }
  const alpha = (i - 1) / (nIons - 1)
  if (alpha < -1e-9 || alpha > 1 + 1e-9) {
    throw new RangeError(`i=${i} is out of physical bounds [1, ${nIons}] for dissociation`)
  }
  return Math.min(1, Math.max(0, alpha))
}

/**
 * van't Hoff factor for association of nMer monomers into one aggregate:
 *   i = 1 - alpha + alpha / n = 1 - alpha * (1 - 1 / n)
 */
export function vantHoffAssociation({
  nMer,
  alpha,
}: {
  nMer: number
  alpha: number
}): number {
  assertFinite('nMer', nMer)
  if (nMer < 1) {
    throw new RangeError('nMer must be at least 1')
  }
  assertAlpha(alpha)
  return 1 - alpha * (1 - 1 / nMer)
}

/**
 * Degree of association alpha from an observed van't Hoff factor i:
 *   alpha = (1 - i) / (1 - 1 / n) = n * (1 - i) / (n - 1)
 */
export function alphaFromAssociation({
  i,
  nMer,
}: {
  i: number
  nMer: number
}): number {
  assertFinite('i', i)
  assertFinite('nMer', nMer)
  if (nMer <= 1) {
    throw new RangeError('nMer must be greater than 1 for association')
  }
  const alpha = (1 - i) / (1 - 1 / nMer)
  if (alpha < -1e-9 || alpha > 1 + 1e-9) {
    throw new RangeError(
      `i=${i} is out of physical bounds [${(1 / nMer).toFixed(3)}, 1] for association`
    )
  }
  return Math.min(1, Math.max(0, alpha))
}

/**
 * Experimentally inferred (abnormal) molar mass from colligative measurements:
 *   M_abnormal = M_normal / i
 */
export function abnormalMolarMass({
  normalMolarMass,
  i,
}: {
  normalMolarMass: number
  i: number
}): number {
  assertFinite('normalMolarMass', normalMolarMass)
  assertFinite('i', i)
  if (normalMolarMass <= 0) {
    throw new RangeError('normalMolarMass must be positive')
  }
  if (i <= 0) {
    throw new RangeError('van’t Hoff factor i must be positive')
  }
  return normalMolarMass / i
}

/**
 * Compute van't Hoff factor directly from normal and observed (abnormal) molar masses:
 *   i = M_normal / M_abnormal
 */
export function vantHoffFromMolarMass({
  normalMolarMass,
  abnormalMolarMass: observedMolarMass,
}: {
  normalMolarMass: number
  abnormalMolarMass: number
}): number {
  assertFinite('normalMolarMass', normalMolarMass)
  assertFinite('abnormalMolarMass', observedMolarMass)
  if (normalMolarMass <= 0 || observedMolarMass <= 0) {
    throw new RangeError('Molar masses must be positive')
  }
  return normalMolarMass / observedMolarMass
}

export interface ModifiedColligativeInput {
  i: number
  molality: number
  /** Ebullioscopic constant K_b in K kg mol⁻¹ (defaults to water: 0.52). */
  kb?: number
  /** Cryoscopic constant K_f in K kg mol⁻¹ (defaults to water: 1.86). */
  kf?: number
  /** Molarity C in mol L⁻¹ (defaults to molality for dilute aqueous solutions). */
  molarity?: number
  /** Absolute temperature T in K (defaults to 298.15 K). */
  tempK?: number
  /** Nominal solute mole fraction x_2 (or n_2 / n_1 for dilute solution, defaults to 0). */
  x2?: number
}

export interface ModifiedColligativeResult {
  readonly i: number
  /** Relative lowering of vapour pressure: (p1° - p1) / p1° = i * x2 */
  readonly relativeVapourPressureLowering: number
  /** Boiling-point elevation: ΔTb = i * Kb * m (K) */
  readonly deltaTbK: number
  /** Freezing-point depression: ΔTf = i * Kf * m (K) */
  readonly deltaTfK: number
  /** Osmotic pressure: Π = i * C * R * T (bar) */
  readonly osmoticPressureBar: number
}

const DEFAULT_WATER = NCERT_SOLVENT_CONSTANTS.find((s) => s.id === 'water')!

/**
 * Evaluate all four van't Hoff–corrected colligative properties.
 */
export function modifiedColligative({
  i,
  molality,
  kb = DEFAULT_WATER.kb,
  kf = DEFAULT_WATER.kf,
  molarity = molality,
  tempK = 298.15,
  x2 = 0,
}: ModifiedColligativeInput): ModifiedColligativeResult {
  assertFinite('i', i)
  assertFinite('molality', molality)
  assertFinite('kb', kb)
  assertFinite('kf', kf)
  assertFinite('molarity', molarity)
  assertFinite('tempK', tempK)
  assertFinite('x2', x2)
  if (i <= 0) {
    throw new RangeError('van’t Hoff factor i must be positive')
  }
  if (molality < 0 || molarity < 0 || x2 < 0) {
    throw new RangeError('Concentrations must be non-negative')
  }
  if (tempK <= 0) {
    throw new RangeError('Temperature must be positive in kelvin')
  }

  return {
    i,
    relativeVapourPressureLowering: i * x2,
    deltaTbK: i * kb * molality,
    deltaTfK: i * kf * molality,
    osmoticPressureBar: i * molarity * GAS_CONSTANT_L_BAR * tempK,
  }
}

export function getVantHoffPreset(id: VantHoffPreset['id']): VantHoffPreset {
  const found = VANT_HOFF_PRESETS.find((p) => p.id === id)
  if (!found) {
    throw new Error(`Unknown van't Hoff preset: ${id}`)
  }
  return found
}

export function getSolventForPreset(preset: VantHoffPreset): SolventColligativeEntry {
  const solvent = NCERT_SOLVENT_CONSTANTS.find((s) => s.id === preset.solventId)
  if (!solvent) {
    throw new Error(`Unknown solvent id: ${preset.solventId}`)
  }
  return solvent
}

export function getSaltTableEntry(
  saltId: NonNullable<VantHoffPreset['saltTableId']>
): VantHoffSaltEntry | undefined {
  return NCERT_VANT_HOFF_SALTS.find((entry) => entry.id === saltId)
}

/**
 * Convenience calculator for a preset solute at a given degree alpha and molality.
 */
export function computePresetMetrics(
  preset: VantHoffPreset,
  alpha: number,
  molality: number
): {
  readonly i: number
  readonly effectiveAlpha: number
  readonly normalMolarMass: number
  readonly abnormalMolarMass: number
  readonly idealDeltaTfK: number
  readonly observedDeltaTfK: number
  readonly idealDeltaTbK: number
  readonly observedDeltaTbK: number
  readonly solvent: SolventColligativeEntry
} {
  const solvent = getSolventForPreset(preset)
  const effectiveAlpha = preset.behaviour === 'none' ? 0 : Math.min(1, Math.max(0, alpha))

  let i = 1
  if (preset.behaviour === 'dissociation') {
    i = vantHoffDissociation({ nIons: preset.n, alpha: effectiveAlpha })
  } else if (preset.behaviour === 'association') {
    i = vantHoffAssociation({ nMer: preset.n, alpha: effectiveAlpha })
  }

  const ideal = modifiedColligative({
    i: 1,
    molality,
    kb: solvent.kb,
    kf: solvent.kf,
  })
  const observed = modifiedColligative({
    i,
    molality,
    kb: solvent.kb,
    kf: solvent.kf,
  })

  return {
    i,
    effectiveAlpha,
    normalMolarMass: preset.normalMolarMassGPerMol,
    abnormalMolarMass: abnormalMolarMass({
      normalMolarMass: preset.normalMolarMassGPerMol,
      i,
    }),
    idealDeltaTfK: ideal.deltaTfK,
    observedDeltaTfK: observed.deltaTfK,
    idealDeltaTbK: ideal.deltaTbK,
    observedDeltaTbK: observed.deltaTbK,
    solvent,
  }
}
