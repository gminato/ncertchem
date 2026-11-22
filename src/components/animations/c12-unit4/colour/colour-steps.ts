import {
  aquaIonColour,
  complementaryColour,
  dElectronCount,
  isColourlessByConfig,
  type IonColourKey,
  type SpectralKey,
} from '@/lib/chem/dblock'
import { colourWheelSector } from '@/lib/chem/dblock-series-data'
import { NCERT_CATALYSIS_EQUATIONS } from '@/lib/chem/ncert-c12-unit4-tables'

/** Number of Steps in the dd-colour Scrolly (matches P7's MDX). */
export const COLOUR_STEP_COUNT = 5

/** Clamp a Scrolly step index into 0..COLOUR_STEP_COUNT-1. NaN maps to 0. */
export function clampColourStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(COLOUR_STEP_COUNT - 1, Math.max(0, Math.trunc(step)))
}

function mustGet<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Missing lib value: ${what}`)
  return value
}

function catalysisEquation(id: string): string {
  return mustGet(NCERT_CATALYSIS_EQUATIONS.find((e) => e.id === id)?.equation, id)
}

export interface AbsorbStep {
  kind: 'absorb'
  /** Ion shown in the beaker (Table 4.8). */
  ion: 'Cu²⁺'
  key: IonColourKey
  /** Colour seen by the eye (Table 4.8, wheel sector). */
  seen: SpectralKey
  /** Band pulled out of the beam: the complement of the seen sector. */
  absorbed: SpectralKey
}

export interface LadderStep {
  kind: 'ladder'
  ion: 'Cu²⁺'
}

export interface ColourlessIon {
  label: string
  key: IonColourKey
  dCount: number
}

export interface ColourlessStep {
  kind: 'colourless'
  ions: readonly ColourlessIon[]
}

export interface LoopStep {
  kind: 'loop'
  overall: string
  step1: string
  step2: string
}

export interface LatticeStep {
  kind: 'lattice'
  interstitial: 'C'
  interstitialFormula: 'TiC'
  alloySymbol: 'Zn'
}

export type ColourStep = AbsorbStep | LadderStep | ColourlessStep | LoopStep | LatticeStep

function absorbState(): AbsorbStep {
  const cu = mustGet(aquaIonColour('Cu²⁺'), 'Cu²⁺ aqua colour')
  const seen = mustGet(colourWheelSector(cu.colour), 'Cu²⁺ wheel sector').sector
  return { kind: 'absorb', ion: 'Cu²⁺', key: cu.key, seen, absorbed: complementaryColour(seen) }
}

function colourlessState(): ColourlessStep {
  const ions: ColourlessIon[] = [
    { label: 'Zn²⁺(aq)', symbol: 'Zn', charge: 2 },
    { label: 'Sc³⁺(aq)', symbol: 'Sc', charge: 3 },
    { label: 'Ti⁴⁺(aq)', symbol: 'Ti', charge: 4 },
  ].map(({ label, symbol, charge }) => {
    const colour = mustGet(aquaIonColour(label.replace('(aq)', '')), label)
    const dCount = dElectronCount(symbol, charge)
    if (colour.key !== 'colourless' || !isColourlessByConfig(dCount)) {
      throw new Error(`${label} should be colourless by configuration`)
    }
    return { label, key: colour.key, dCount }
  })
  return { kind: 'colourless', ions }
}

/** The state each Scrolly Step draws. Every value comes from the libs. */
export function colourStepState(step: number): ColourStep {
  switch (clampColourStep(step)) {
    case 0:
      return absorbState()
    case 1:
      return { kind: 'ladder', ion: 'Cu²⁺' }
    case 2:
      return colourlessState()
    case 3:
      return {
        kind: 'loop',
        overall: catalysisEquation('iron-iii-persulphate-overall'),
        step1: catalysisEquation('iron-iii-step-1'),
        step2: catalysisEquation('iron-ii-step-2'),
      }
    default:
      return { kind: 'lattice', interstitial: 'C', interstitialFormula: 'TiC', alloySymbol: 'Zn' }
  }
}
