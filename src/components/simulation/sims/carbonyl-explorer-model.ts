import {
  NCERT_CARBONYLS,
  NCERT_SYNERGIC_BOND,
  type Carbonyl,
} from '@/lib/chem/ncert-c12-unit5-s8-tables'

export const CARBONYL_OPTIONS: readonly Carbonyl[] = NCERT_CARBONYLS

export const DEFAULT_CARBONYL_FORMULA = NCERT_CARBONYLS[0].formula

export interface CarbonylExplorerState {
  readonly formula: string
  readonly showSigma: boolean
  readonly showPi: boolean
}

export interface CarbonylReadout {
  readonly carbonyl: Carbonyl
  readonly isSynergic: boolean
  readonly bondStatusLabel: string
  readonly activeBondNotes: readonly {
    readonly kind: 'sigma' | 'pi'
    readonly label: string
    readonly detail: string
  }[]
  readonly liveSummary: string
}

export function selectCarbonyl(formula: string): Carbonyl {
  return NCERT_CARBONYLS.find((c) => c.formula === formula) ?? NCERT_CARBONYLS[0]
}

export function buildCarbonylReadout(state: CarbonylExplorerState): CarbonylReadout {
  const carbonyl = selectCarbonyl(state.formula)
  const isSynergic = state.showSigma && state.showPi

  const activeBondNotes: Array<{ kind: 'sigma' | 'pi'; label: string; detail: string }> = []
  if (state.showSigma) {
    activeBondNotes.push({
      kind: 'sigma',
      label: `Sigma (${NCERT_SYNERGIC_BOND.sigma.direction})`,
      detail: `${NCERT_SYNERGIC_BOND.sigma.donor} to ${NCERT_SYNERGIC_BOND.sigma.acceptor}`,
    })
  }
  if (state.showPi) {
    activeBondNotes.push({
      kind: 'pi',
      label: `Pi (${NCERT_SYNERGIC_BOND.pi.direction})`,
      detail: `${NCERT_SYNERGIC_BOND.pi.donor} to ${NCERT_SYNERGIC_BOND.pi.acceptor}`,
    })
  }

  let bondStatusLabel: string
  if (isSynergic) {
    bondStatusLabel = 'synergic: stronger M-CO bond'
  } else if (state.showSigma) {
    bondStatusLabel = 'sigma donation only (C to M)'
  } else if (state.showPi) {
    bondStatusLabel = 'pi back donation only (M to C)'
  } else {
    bondStatusLabel = 'skeletal structure only (no arrows shown)'
  }

  const liveSummary =
    `${carbonyl.name} (${carbonyl.formula}), geometry: ${carbonyl.geometry}. ` +
    `Metal oxidation state ${carbonyl.metalOxidationState}, total CO: ${carbonyl.totalCO}, ` +
    `bridging CO: ${carbonyl.bridgingCO}. ${bondStatusLabel}.`

  return {
    carbonyl,
    isSynergic,
    bondStatusLabel,
    activeBondNotes,
    liveSummary,
  }
}
