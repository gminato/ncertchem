import { NCERT_BATTERIES, type BatteryEntry } from '@/lib/chem/ncert-c12-unit2-tables'

/**
 * Deterministic target state for each Scrolly Step of Section 2.6 (Batteries).
 * The drawing tweens its numeric targets (PbSO₄ coverage on the lead plates and the
 * illustrative acid-strength bar). Every reaction and voltage shown comes from NCERT_BATTERIES.
 */

export type BatteryStepId = 'dry-cell' | 'mercury-cell' | 'lead-discharge' | 'lead-recharge' | 'nickel-cadmium'

export interface BatteryStepTargets {
  /** PbSO₄ coating on both lead plates: 0 = bare plates (charged), 1 = fully sulphated. */
  readonly coverage: number
  /** Illustrative acid-strength bar: 0 = empty, 1 = full. Not a measured concentration. */
  readonly acid: number
}

export interface BatteryStep {
  readonly index: number
  readonly id: BatteryStepId
  readonly title: string
  readonly ariaLabel: string
  readonly targets: BatteryStepTargets
}

export const BATTERY_STEPS: readonly BatteryStep[] = [
  {
    index: 0,
    id: 'dry-cell',
    title: 'Dry cell',
    ariaLabel: 'Cut-away dry cell: zinc container as the anode, graphite rod as the cathode in MnO₂ paste, electrons flowing to the voltmeter.',
    targets: { coverage: 0, acid: 0 },
  },
  {
    index: 1,
    id: 'mercury-cell',
    title: 'Mercury cell',
    ariaLabel: 'Cut-away mercury cell: zinc amalgam anode, HgO cathode, KOH and ZnO paste, voltmeter steady at 1.35 V.',
    targets: { coverage: 0, acid: 0 },
  },
  {
    index: 2,
    id: 'lead-discharge',
    title: 'Lead storage: discharging',
    ariaLabel: 'Lead storage cell discharging: both plates grow a PbSO₄ coating, the acid-strength bar falls.',
    targets: { coverage: 0.85, acid: 0.35 },
  },
  {
    index: 3,
    id: 'lead-recharge',
    title: 'Lead storage: recharging',
    ariaLabel: 'Lead storage cell recharging: a charger reverses the current, PbSO₄ clears from both plates, the acid-strength bar rises.',
    targets: { coverage: 0.15, acid: 0.9 },
  },
  {
    index: 4,
    id: 'nickel-cadmium',
    title: 'Nickel–cadmium cell',
    ariaLabel: 'Cut-away nickel–cadmium jelly-roll cell: positive plate, separator, negative plate, moist alkali, overall discharge equation.',
    targets: { coverage: 0, acid: 0 },
  },
]

/** The NCERT_BATTERIES entry for a cell. Throws if the lib lacks it. */
export function batteryEntry(id: BatteryEntry['id']): BatteryEntry {
  const entry = NCERT_BATTERIES.find((e) => e.id === id)
  if (!entry) throw new Error(`No battery entry for ${id}`)
  return entry
}

/** NCERT's stated voltage for a cell, as a number. Throws when NCERT states none. */
export function ncertVoltageOf(id: BatteryEntry['id']): number {
  const v = batteryEntry(id).ncertVoltage
  if (v === null) throw new Error(`NCERT states no voltage for ${id}`)
  return v
}

const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
}
const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻',
}

/**
 * Turns an NCERT_BATTERIES mhchem-style string into Unicode for SVG text:
 * `->` becomes →, `^{2+}` and `^-` become superscripts, digits after a letter or `)` become
 * subscripts, a trailing `+` or `-` on a species becomes a superscript charge, and a
 * leading digit stays a coefficient. The data stays the single source of the reactions.
 */
export function toUnicodeChem(ce: string): string {
  return ce
    .replace(/\^\{([^}]*)\}/g, (_, body: string) => body.split('').map((c) => SUPERSCRIPT[c] ?? c).join(''))
    .replace(/\^([+-])/g, (_, s: string) => SUPERSCRIPT[s])
    .replace(/->/g, '→')
    .replace(/(?<=[A-Za-z)])\d+/g, (d) => d.split('').map((c) => SUBSCRIPT[c]).join(''))
    .replace(/(?<=[A-Za-z)])\+(?=\s|$|\))/g, '⁺')
    .replace(/(?<=[A-Za-z])-(?=\s|$)/g, '⁻')
    .replace(/-/g, '−')
}

/** The formatted reaction string of one NCERT_BATTERIES field. Throws when the field is null. */
export function reactionText(id: BatteryEntry['id'], field: 'anodeCe' | 'cathodeCe' | 'overallCe' | 'rechargeCe'): string {
  const raw = batteryEntry(id)[field]
  if (raw === null) throw new Error(`NCERT gives no ${field} for ${id}`)
  return toUnicodeChem(raw)
}

/** Fixed-point text with a real minus sign (U+2212). */
export function fmtVolt(v: number, digits: number): string {
  return v.toFixed(digits).replace('-', '−')
}
