/**
 * Pure step state machines for all four Section 5.4 Scrolly Animations:
 * 1. isomer-family-tree (3 steps)
 * 2. geometrical-isomer-builder (5 steps)
 * 3. chirality-mirror (4 steps)
 * 4. structural-isomer-swaps (4 steps)
 */

export type FamilyTreeVisual = 'overview' | 'stereo' | 'structural'

export function familyTreeStepVisual(step: number): FamilyTreeVisual {
  if (step <= 0) return 'overview'
  if (step === 1) return 'stereo'
  return 'structural'
}

export type GeometricVisual =
  | 'sq-cis-trans'
  | 'sq-mabxl'
  | 'tetrahedral'
  | 'oct-cis-trans'
  | 'oct-fac-mer'

const GEO_STEPS: readonly GeometricVisual[] = [
  'sq-cis-trans',
  'sq-mabxl',
  'tetrahedral',
  'oct-cis-trans',
  'oct-fac-mer',
]

export function geometricStepVisual(step: number): GeometricVisual {
  const clamped = Math.max(0, Math.min(GEO_STEPS.length - 1, Math.floor(step)))
  return GEO_STEPS[clamped]
}

export type ChiralityVisual = 'propellers' | 'superimpose' | 'polarimeter' | 'cis-vs-trans'

const CHIRAL_STEPS: readonly ChiralityVisual[] = [
  'propellers',
  'superimpose',
  'polarimeter',
  'cis-vs-trans',
]

export function chiralityStepVisual(step: number): ChiralityVisual {
  const clamped = Math.max(0, Math.min(CHIRAL_STEPS.length - 1, Math.floor(step)))
  return CHIRAL_STEPS[clamped]
}

export type StructuralVisual = 'linkage' | 'coordination' | 'ionisation' | 'solvate'

const STRUCTURAL_STEPS: readonly StructuralVisual[] = [
  'linkage',
  'coordination',
  'ionisation',
  'solvate',
]

export function structuralStepVisual(step: number): StructuralVisual {
  const clamped = Math.max(0, Math.min(STRUCTURAL_STEPS.length - 1, Math.floor(step)))
  return STRUCTURAL_STEPS[clamped]
}
