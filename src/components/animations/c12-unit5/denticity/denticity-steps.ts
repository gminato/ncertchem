import { NCERT_S2_LIGANDS } from '@/lib/chem/ncert-c12-unit5-s2-tables'

export const DENTICITY_STEP_COUNT = 5

export type DenticityVisual = 'unidentate' | 'didentate' | 'polydentate' | 'hexadentate' | 'ambidentate'

export interface DenticityStepInfo {
  readonly visual: DenticityVisual
  readonly denticity: number
  readonly badgeLabel: string
  readonly caption: string
  readonly subtitle: string
}

export const DENTICITY_STEPS: readonly DenticityStepInfo[] = [
  {
    visual: 'unidentate',
    denticity: 1,
    badgeLabel: 'Denticity: 1',
    caption: 'unidentate',
    subtitle: '1 donor atom binds the metal ion',
  },
  {
    visual: 'didentate',
    denticity: 2,
    badgeLabel: 'Denticity: 2',
    caption: 'didentate, 2 donor atoms, chelate ring',
    subtitle: 'both N atoms grip one metal ion',
  },
  {
    visual: 'polydentate',
    denticity: 4,
    badgeLabel: 'Denticity: 4',
    caption: 'polydentate',
    subtitle: '4 donor atoms in N(CH₂CH₂NH₂)₃',
  },
  {
    visual: 'hexadentate',
    denticity: 6,
    badgeLabel: 'Denticity: 6',
    caption: 'hexadentate, 2 N + 4 O',
    subtitle: 'EDTA⁴⁻ wraps the metal with 6 arrows',
  },
  {
    visual: 'ambidentate',
    denticity: 1,
    badgeLabel: '1 of 2 donors',
    caption: 'two possible donors, only one used at a time',
    subtitle: 'click a mode to switch the donor atom',
  },
] as const

export const COUNTER_VALUES = [1, 2, 4, 6] as const

export type NitriteMode = 'nitrito-N' | 'nitrito-O'
export type ThiocyanateMode = 'thiocyanato-S' | 'thiocyanato-N'

/** Clamp a 0-based Scrolly step index into the valid range [0, 4]. */
export function denticityStepInfo(step: number): DenticityStepInfo {
  const idx = Math.min(Math.max(Math.trunc(step), 0), DENTICITY_STEP_COUNT - 1)
  return DENTICITY_STEPS[idx] ?? DENTICITY_STEPS[0]
}

/** Verify the donor atom counts against NCERT_S2_LIGANDS. */
export function donorCountFor(formula: string): number {
  const found = NCERT_S2_LIGANDS.find((l) => l.formula === formula)
  if (!found) throw new RangeError(`Unknown Section 5.2 ligand: ${formula}`)
  return found.donorAtoms
}
