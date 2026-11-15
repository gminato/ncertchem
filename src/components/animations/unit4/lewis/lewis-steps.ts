import { NACL_BORN_HABER, NACL_STANDARD_FORMATION_KJ, bornHaberSum, type BornHaberStep } from '@/lib/chem/ionic'
import { describeOctet, sectionStructure, shellPopulations } from '@/lib/chem/lewis-learning'
import { octetReport, type AtomOctet } from '@/lib/chem/lewis'

// ---------------------------------------------------------------------------
// Kössel: electron transfer from sodium to chlorine
// ---------------------------------------------------------------------------

/** Number of Steps in the Kössel transfer Scrolly. */
export const KOSSEL_STEP_COUNT = 4

/** What the Kössel diagram shows at one Step. */
export interface KosselFrame {
  /** Sodium has its single valence electron, drawn as a dot. */
  sodiumDot: boolean
  /** The electron has moved: Na is Na⁺ and Cl is a bracketed Cl⁻ with an octet. */
  transferred: boolean
  /** Draw the curved arrow for the electron leaving sodium. */
  arrow: boolean
  /** Show the electrostatic attraction label between the two ions. */
  attraction: boolean
}

/** The target frame for each Step. Steps are cut, not tweened, so each frame is exact. */
export function kosselFrame(step: number): KosselFrame {
  const s = Math.min(KOSSEL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  switch (s) {
    case 0:
      return { sodiumDot: true, transferred: false, arrow: false, attraction: false }
    case 1:
      return { sodiumDot: true, transferred: false, arrow: true, attraction: false }
    case 2:
      return { sodiumDot: false, transferred: true, arrow: false, attraction: false }
    default:
      return { sodiumDot: false, transferred: true, arrow: false, attraction: true }
  }
}

/** Shell populations for the captions: sodium, its ion, chlorine and its ion. */
export function kosselShells(): { na: number[]; naIon: number[]; cl: number[]; clIon: number[] } {
  return {
    na: shellPopulations(11),
    naIon: shellPopulations(10),
    cl: shellPopulations(17),
    clIon: shellPopulations(18),
  }
}

// ---------------------------------------------------------------------------
// Octet exceptions: four species from Section 4.1.5
// ---------------------------------------------------------------------------

/** Number of Steps in the octet-exceptions Scrolly. */
export const OCTET_STEP_COUNT = 4

/** The species drawn at each Step, in order. Keys resolve with sectionStructure. */
export const OCTET_EXAMPLE_KEYS: readonly [string, string, string, string] = ['BeCl2', 'BCl3', 'NO', 'PCl5']

/** Display formula for each example key, with subscripts. */
const DISPLAY: Readonly<Record<string, string>> = {
  BeCl2: 'BeCl₂',
  BCl3: 'BCl₃',
  NO: 'NO',
  PCl5: 'PCl₅',
}

/** What to show for one octet Step. */
export interface OctetFrame {
  key: string
  label: string
  /** The atom the Step is about: the first one whose octet is not complete. */
  focusIndex: number
  focus: AtomOctet
  /** One readout line about the focus atom, for example "4 electrons: incomplete octet". */
  readout: string
  /** Every atom's octet, in atom order. */
  octets: AtomOctet[]
}

/**
 * The octet status of the species at one Step. The focus atom is the first atom whose octet is
 * not complete, so each Step points at the exception that Section 4.1.5 describes.
 */
export function octetFrame(step: number): OctetFrame {
  const s = Math.min(OCTET_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const key = OCTET_EXAMPLE_KEYS[s]
  const octets = octetReport(sectionStructure(key))
  const focusIndex = Math.max(
    0,
    octets.findIndex((o) => o.status !== 'complete')
  )
  const focus = octets[focusIndex]
  return {
    key,
    label: DISPLAY[key] ?? key,
    focusIndex,
    focus,
    readout: `${focus.element}: ${describeOctet(focus)}`,
    octets,
  }
}

// ---------------------------------------------------------------------------
// Born–Haber cycle for NaCl as an energy staircase
// ---------------------------------------------------------------------------

/** Number of Steps in the Born–Haber staircase: the reference state, then five steps of the cycle. */
export const BORN_HABER_STEP_COUNT = 6

/** One bar of the staircase: the step's enthalpy and the level before and after it. */
export interface StairBar {
  label: string
  enthalpyKj: number
  from: number
  to: number
  source: BornHaberStep['source']
  /** True for the last bar, the lattice formation step that closes the cycle. */
  closing: boolean
}

/** The bars of the cycle, cumulative, in formation-direction order. */
export function staircase(): StairBar[] {
  const bars: StairBar[] = []
  let level = 0
  NACL_BORN_HABER.forEach((step, i) => {
    const from = level
    level = level + step.enthalpyKj
    bars.push({
      label: step.label,
      enthalpyKj: step.enthalpyKj,
      from,
      to: level,
      source: step.source,
      closing: i === NACL_BORN_HABER.length - 1,
    })
  })
  return bars
}

/** Level of the staircase after `step` bars are drawn (Step 0 is the reference level, 0). */
export function levelAtStep(step: number): number {
  const s = Math.min(BORN_HABER_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const drawn = staircase().slice(0, s)
  return drawn.length === 0 ? 0 : drawn[drawn.length - 1].to
}

/**
 * Enthalpy of formation implied by the cycle (the level after every bar). It equals the
 * standard value used in ionic.ts, which is checked in tests.
 */
export function cycleFormationKj(): number {
  return bornHaberSum(NACL_BORN_HABER)
}

/** Standard enthalpy of formation of NaCl(s) that the cycle closes on. */
export const FORMATION_KJ = NACL_STANDARD_FORMATION_KJ
