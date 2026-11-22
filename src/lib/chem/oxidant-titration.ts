import { titrationMoles, titrationRatio, unknownFe2Molarity, type OxidantKey } from './dblock'

/** One burette step in the Oxidant Titration Lab (0.01 mL, a fine drop). */
export const DROP_ML = 0.01

/** Burette capacity in mL (the drawn scale runs 0 to 25). */
export const BURETTE_CAPACITY_ML = 25

const SUPERSCRIPT: Readonly<Record<string, string>> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
}

/**
 * Burette volume (whole drops, 0.01 mL each) at which the first excess of oxidant is seen: the smallest reading
 * that reaches the equivalence volume, computed from the printed ratio (5 or 6 Fe²⁺ per oxidant).
 */
export function endPointDrops(args: {
  readonly oxidant: OxidantKey
  readonly oxidantMolarity: number
  readonly fe2Molarity: number
  readonly fe2VolumeMl: number
}): number {
  const fe2PerOxidant = titrationRatio(args.oxidant).fe2PerOxidant
  const fe2Mol = args.fe2Molarity * (args.fe2VolumeMl / 1000)
  const oxidantVolumeMl = (fe2Mol / fe2PerOxidant / args.oxidantMolarity) * 1000
  return Math.ceil(oxidantVolumeMl / DROP_ML - 1e-9)
}

/** Calculated Fe²⁺ molarity (mol dm⁻³) from a burette reading in whole drops at the end point. */
export function calculatedFe2Molarity(args: {
  readonly oxidant: OxidantKey
  readonly oxidantMolarity: number
  readonly drops: number
  readonly fe2VolumeMl: number
}): number {
  return unknownFe2Molarity({
    oxidant: args.oxidant,
    oxidantMolarity: args.oxidantMolarity,
    oxidantVolumeMl: args.drops * DROP_ML,
    fe2VolumeMl: args.fe2VolumeMl,
  })
}

/** Oxidant and Fe²⁺ moles delivered by a burette reading in drops. */
export function reactedMoles(args: {
  readonly oxidant: OxidantKey
  readonly oxidantMolarity: number
  readonly drops: number
}): { readonly oxidantMol: number; readonly fe2Mol: number } {
  const { oxidantMol, fe2Mol } = titrationMoles({
    oxidant: args.oxidant,
    oxidantMolarity: args.oxidantMolarity,
    oxidantVolumeMl: args.drops * DROP_ML,
  })
  return { oxidantMol, fe2Mol }
}

/** A mole amount as "2.50 × 10⁻⁴ mol" (3 significant figures, half-up, real superscripts). */
export function formatMoles(mol: number): string {
  if (mol === 0) return '0 mol'
  let exp = Math.floor(Math.log10(Math.abs(mol)))
  let mantissa = Math.round((mol / 10 ** exp) * 100) / 100
  if (Math.abs(mantissa) >= 10) {
    exp += 1
    mantissa = Math.round((mol / 10 ** exp) * 100) / 100
  }
  const expText = String(exp)
    .split('')
    .map((ch) => SUPERSCRIPT[ch] ?? ch)
    .join('')
  return `${mantissa.toFixed(2)} × 10${expText} mol`
}
