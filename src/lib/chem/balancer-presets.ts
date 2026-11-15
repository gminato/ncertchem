/**
 * Curated preset reactions for the Redox Equation Balancer simulation.
 * None of these presets duplicate NCERT Problems 7.8, 7.9 or 7.10.
 *
 * All numbers, steps and intermediate equations are computed dynamically
 * via balanceRedox and balanceByOxidationNumber from redox-balance.ts.
 */

import {
  balanceRedox,
  balanceByOxidationNumber,
  isBalanced,
  type BalancedRedoxResult,
  type BalanceVerification,
} from './redox-balance'
import { analyseRedox, parseSpeciesToken } from './redox-analysis'
import { parseFormula } from './formula'
import { oxidationNumbers } from './oxidation-number'
import { rationalToNumber } from './oxidation-number'

export interface BalancerPreset {
  id: string
  name: string
  skeleton: string
  medium: 'acidic' | 'basic'
  description: string
  context: string
}

export interface TallyItem {
  item: string
  left: number
  right: number
  balanced: boolean
}

export const BALANCER_PRESETS: readonly BalancerPreset[] = [
  {
    id: 'permanganate-oxalate',
    name: 'Permanganate + Oxalate',
    skeleton: 'MnO4- + C2O42- -> Mn2+ + CO2',
    medium: 'acidic',
    description: 'Oxidation of ethanedioate (oxalate) by permanganate in dilute acid.',
    context: 'Standard laboratory redox titration used to standardise potassium permanganate solution against oxalic acid.',
  },
  {
    id: 'dichromate-iodide',
    name: 'Dichromate + Iodide',
    skeleton: 'Cr2O72- + I- -> Cr3+ + I2',
    medium: 'acidic',
    description: 'Oxidation of iodide ions to molecular iodine by dichromate in acidic medium.',
    context: 'Foundation of iodometric titrations used to determine oxidising agents quantitatively.',
  },
  {
    id: 'permanganate-so2',
    name: 'Permanganate + Sulphur Dioxide',
    skeleton: 'MnO4- + SO2 -> Mn2+ + SO42-',
    medium: 'acidic',
    description: 'Decolourisation of purple permanganate by dissolved sulphur dioxide gas.',
    context: 'Classic analytical test for reducing gases such as sulphur dioxide in environmental chemistry.',
  },
  {
    id: 'dichromate-h2o2',
    name: 'Dichromate + Hydrogen Peroxide',
    skeleton: 'H2O2 + Cr2O72- -> O2 + Cr3+',
    medium: 'acidic',
    description: 'Hydrogen peroxide acting as a reducing agent towards acidified potassium dichromate.',
    context: 'Demonstrates the dual oxidising/reducing nature of hydrogen peroxide.',
  },
  {
    id: 'copper-nitrate',
    name: 'Copper + Concentrated Nitrate',
    skeleton: 'Cu + NO3- -> Cu2+ + NO2',
    medium: 'acidic',
    description: 'Dissolution of metallic copper in nitric acid yielding copper(II) and brown NO2 gas.',
    context: 'Standard laboratory preparation of nitrogen dioxide gas from metallic copper turns.',
  },
  {
    id: 'chromium-hypochlorite',
    name: 'Chromium(III) + Hypochlorite',
    skeleton: 'Cr(OH)3 + ClO- -> CrO42- + Cl-',
    medium: 'basic',
    description: 'Oxidation of green chromium(III) hydroxide to yellow chromate by bleach in alkaline medium.',
    context: 'Key step in qualitative inorganic analysis for separating chromium from group III cations.',
  },
  {
    id: 'permanganate-sulphite',
    name: 'Permanganate + Sulphite',
    skeleton: 'MnO4- + SO32- -> MnO2 + SO42-',
    medium: 'basic',
    description: 'Mild reduction of purple permanganate to brown manganese(IV) oxide in alkaline solution.',
    context: 'Contrasts the alkaline reduction product MnO2 with the acidic reduction product Mn²⁺.',
  },
  {
    id: 'aluminium-nitrate',
    name: 'Aluminium + Nitrate',
    skeleton: 'Al + NO3- -> Al(OH)4- + NH3',
    medium: 'basic',
    description: 'Reduction of nitrate ions to pungent ammonia gas by metallic aluminium in alkali.',
    context: 'The Devarda / aluminium alloy reduction test used in laboratories to detect nitrate ions.',
  },
  {
    id: 'zinc-nitrate',
    name: 'Zinc + Nitrate',
    skeleton: 'Zn + NO3- -> Zn(OH)42- + NH3',
    medium: 'basic',
    description: 'Reduction of nitrate to ammonia by zinc dust in strongly alkaline solution.',
    context: 'Confirmatory test for nitrate in wet chemical analysis yielding alkaline tetrahydroxozincate.',
  },
  {
    id: 'phosphorus-disproportionation',
    name: 'White Phosphorus Disproportionation',
    skeleton: 'P4 -> PH3 + H2PO2-',
    medium: 'basic',
    description: 'Disproportionation of elemental white phosphorus in hot alkali into phosphine and hypophosphite.',
    context: 'Industrial and textbook reaction illustrating self-oxidation-reduction of non-metals in base.',
  },
] as const

/** Atom and charge tally items for display. */
export function toTallyItems(verification: BalanceVerification): TallyItem[] {
  const items: TallyItem[] = Object.entries(verification.atomBalance).map(([item, b]) => ({
    item,
    left: b.reactant,
    right: b.product,
    balanced: b.balanced,
  }))
  items.push({
    item: 'Charge',
    left: verification.chargeBalance.reactant,
    right: verification.chargeBalance.product,
    balanced: verification.chargeBalance.balanced,
  })
  return items
}

const resultCache = new Map<string, BalancedRedoxResult>()

/** The fully computed balanced result for a preset and method (cached). */
export function getPresetBalanceResult(
  preset: BalancerPreset,
  method: BalancerMethod,
): BalancedRedoxResult {
  const key = `${preset.id}|${method}`
  const cached = resultCache.get(key)
  if (cached) return cached
  const result =
    method === 'half-reaction'
      ? balanceRedox(preset.skeleton, preset.medium)
      : balanceByOxidationNumber(preset.skeleton, preset.medium)
  resultCache.set(key, result)
  return result
}

export type BalancerMethod = 'half-reaction' | 'oxidation-number'

/** Short labels for the step rail, one per lib step. */
export const RAIL_LABELS: Record<BalancerMethod, readonly string[]> = {
  'half-reaction': ['Skeleton', 'Halves', 'Key atoms', 'O and H', 'Electrons', 'Multiply', 'Verify'],
  'oxidation-number': ['Skeleton', 'Oxidation numbers', 'Equalise', 'Charge', 'H and O'],
}

export interface BalancerHalf {
  title: string
  /** Half-reaction equation with its electron term, mhchem. */
  equation: string
  /** Electrons per half-reaction at this step (after multiplying, the total). */
  electrons: number
  multiplier?: number
  tally: TallyItem[]
}

export interface OxidationCard {
  /** Species as written in the skeleton, e.g. "C2O4^2-". */
  species: string
  element: string
  from: number
  to: number
  /** Electrons lost or gained by one formula unit. */
  electrons: number
  multiplier: number
}

export interface BalancerChallengeField {
  id: string
  label: string
  target: number
  hint: string
}

export interface BalancerChallenge {
  prompt: string
  fields: BalancerChallengeField[]
  explanation: string
}

export interface BalancerStepView {
  stepIndex: number
  totalSteps: number
  title: string
  description: string
  /** Lib equation for this step (composite half-reaction strings are split by the view). */
  equation: string
  previousEquation?: string
  /** Normalised species formulas being oxidised (ox) and reduced (red). */
  roles: { ox: string[]; red: string[] }
  /** Atom and charge tally of the whole equation (overall or oxidation-number steps). */
  tally: TallyItem[]
  halves?: { ox: BalancerHalf; red: BalancerHalf }
  onCards?: { ox: OxidationCard; red: OxidationCard; lcm: number }
  challenge?: BalancerChallenge
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (Math.abs(a) * Math.abs(b)) / gcd(a, b)
}

/**
 * Makes a lib step description readable: arrows, electron counts and any bare
 * formula in the text (such as "H2O", "OH-" or "CrO4^2-") are displayed as
 * subscripts, superscript charges and e⁻, not as raw source text.
 */
export function prettyDescription(text: string): string {
  const withElectrons = text.replace(/(\d*)e-(?![A-Za-z])/g, '$1e⁻').replace(/->/g, '→')
  return withElectrons.replace(/[A-Z][A-Za-z0-9()]*(?:\^[0-9]*[+-]|[+-])?/g, (token) => {
    if (!/[0-9+\-⁻⁺]/.test(token)) return token
    return prettyFormula(canonicalSpecies(token))
  })
}

/** Converts a formula string to display text: subscripts and superscript charges. */
export function prettyFormula(raw: string): string {
  const SUB: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  }
  const SUP: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻',
  }
  let base = raw
  let charge = ''
  const caret = raw.indexOf('^')
  if (caret >= 0) {
    base = raw.slice(0, caret)
    charge = raw.slice(caret + 1)
  } else {
    const trailing = /([+-]+)$/.exec(raw)
    if (trailing) {
      base = raw.slice(0, trailing.index)
      charge = trailing[1]
    }
  }
  const subBase = base.replace(/\d/g, (d) => SUB[d])
  const supCharge = charge
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')
  return `${subBase}${supCharge}`
}

/** Formula of a token with coefficient, state and charge removed. */
function normalizeTokenFormula(token: string): string {
  return token
    .replace(/^\d+/, '')
    .replace(/\((aq|l|s|g)\)/g, '')
    .replace(/\^.*$/, '')
    .replace(/[+-]+$/, '')
}

function formatOxState(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0'
}

/**
 * The view model the simulation renders for one step: the lib equation, the
 * colour roles, the half-reaction or oxidation-number cards and, in Try-It
 * mode, a challenge whose targets come from the lib's own balanced steps.
 */
export function getBalancerStep(
  preset: BalancerPreset,
  method: BalancerMethod,
  stepIndex: number,
): BalancerStepView {
  const result = getPresetBalanceResult(preset, method)
  const steps = result.steps
  const index = Math.max(0, Math.min(steps.length - 1, stepIndex))
  const step = steps[index]
  const prev = index > 0 ? steps[index - 1] : undefined
  const roles = skeletonRoles(preset.skeleton)

  const base: BalancerStepView = {
    stepIndex: index,
    totalSteps: steps.length,
    title: step.title,
    description: prettyDescription(step.description),
    equation: step.equationMhchem,
    previousEquation: prev?.equationMhchem,
    roles,
    tally: step.equationMhchem.includes(' | ') ? [] : toTallyItems(isBalanced(step.equationMhchem)),
  }

  if (method === 'oxidation-number') {
    return withOxidationNumber(preset, base, index, steps)
  }
  return withHalves(preset, base, index, steps)
}

/**
 * Canonical caret form of a skeleton token, e.g. "C2O42-" -> "C2O4^2-", so that
 * the formula and charge can be shown and matched consistently.
 */
export function canonicalSpecies(token: string): string {
  const sp = parseSpeciesToken(token)
  const charge = sp.charge ?? 0
  if (charge === 0) return sp.formula
  const mag = Math.abs(charge) === 1 ? '' : String(Math.abs(charge))
  return `${sp.formula}^${mag}${charge > 0 ? '+' : '-'}`
}

/** Oxidation number of one element in a single species token, or undefined if absent. */
function speciesOxidationNumber(token: string, element: string): number | undefined {
  const sp = parseSpeciesToken(token)
  const states = oxidationNumbers(sp.formula, sp.charge ?? 0)
  const value = states[element]
  return value === undefined ? undefined : rationalToNumber(value)
}

/**
 * Normalised formulas of the reactant species being oxidised (ox) and reduced
 * (red) in a skeleton, taken from the lib's redox analysis. A species that is
 * both (disproportionation) gets no role.
 */
export function skeletonRoles(skeleton: string): { ox: string[]; red: string[] } {
  const analysis = analyseRedox(skeleton)
  const reductants = new Set(analysis.reductants.map((r) => parseSpeciesToken(r).formula))
  const oxidants = new Set(analysis.oxidants.map((r) => parseSpeciesToken(r).formula))
  const disproportionation = analysis.type === 'disproportionation'
  const tokens = skeleton.split(' -> ')[0].split(' + ').map((t) => t.trim())
  const ox: string[] = []
  const red: string[] = []
  for (const token of tokens) {
    const formula = parseSpeciesToken(token).formula
    const f = normalizeTokenFormula(canonicalSpecies(token))
    const both = reductants.has(formula) && oxidants.has(formula)
    // A species holding a reduced element is the oxidant. The lib also lists
    // such a species as a reductant when its oxygen is oxidised, so the reduced
    // element decides. Disproportionation has no single oxidant or reductant.
    if (both && disproportionation) continue
    if (oxidants.has(formula)) red.push(f)
    else if (reductants.has(formula)) ox.push(f)
  }
  return { ox, red }
}

/** Splits a composite "Oxidation: ... | Reduction: ..." lib string into its two halves. */
function splitHalves(equation: string): { ox: string; red: string } | undefined {
  const parts = equation.split(' | ')
  if (parts.length !== 2) return undefined
  const ox = parts.find((p) => p.startsWith('Oxidation: '))
  const red = parts.find((p) => p.startsWith('Reduction: '))
  if (!ox || !red) return undefined
  return { ox: ox.slice('Oxidation: '.length), red: red.slice('Reduction: '.length) }
}

function electronsIn(equation: string): number {
  let total = 0
  for (const term of equation.split(/ \+ | -> /)) {
    const m = /^(\d*)e-$/.exec(term.trim())
    if (m) total += m[1] ? Number(m[1]) : 1
  }
  return total
}

function withHalves(
  preset: BalancerPreset,
  base: BalancerStepView,
  index: number,
  steps: readonly { equationMhchem: string }[],
): BalancerStepView {
  // Step 1 (skeleton) has no halves yet.
  if (index === 0) return base

  const halfSplit = splitHalves(steps[Math.min(index, 4)].equationMhchem)
  const step4 = splitHalves(steps[4].equationMhchem)
  if (!step4) return base

  const eOx = electronsIn(step4.ox)
  const eRed = electronsIn(step4.red)
  const common = lcm(eOx, eRed)
  const multOx = common / eOx
  const multRed = common / eRed

  const toHalf = (title: string, eq: string, electrons: number, multiplier?: number): BalancerHalf => ({
    title,
    equation: eq,
    electrons,
    multiplier,
    tally: toTallyItems(isBalanced(eq)),
  })

  let halves: { ox: BalancerHalf; red: BalancerHalf }
  if (index <= 4 && halfSplit) {
    halves = {
      ox: toHalf('Oxidation half', halfSplit.ox, electronsIn(halfSplit.ox)),
      red: toHalf('Reduction half', halfSplit.red, electronsIn(halfSplit.red)),
    }
  } else {
    halves = {
      ox: toHalf('Oxidation half', scaleBy(step4.ox, multOx), eOx * multOx, multOx),
      red: toHalf('Reduction half', scaleBy(step4.red, multRed), eRed * multRed, multRed),
    }
  }

  const view: BalancerStepView = { ...base, halves, tally: index <= 4 ? [] : base.tally }
  view.challenge = halfChallenge(preset, index, step4, { eOx, eRed, multOx, multRed, common })
  return view
}

/** Multiplies each term of one half-reaction equation by an integer. */
function scaleBy(eq: string, k: number): string {
  if (k === 1) return eq
  const [left, right] = eq.split(' -> ')
  const scale = (side: string) =>
    side
      .split(' + ')
      .map((t) => {
        const lead = /^\d+/.exec(t)
        const c = (lead ? Number(lead[0]) : 1) * k
        const body = t.replace(/^\d+/, '')
        return `${c === 1 ? '' : c}${body}`
      })
      .join(' + ')
  return `${scale(left)} -> ${scale(right)}`
}

function halfChallenge(
  preset: BalancerPreset,
  index: number,
  step4: { ox: string; red: string },
  m: { eOx: number; eRed: number; multOx: number; multRed: number; common: number },
): BalancerChallenge | undefined {
  if (index === 3) {
    const oxToken = canonicalSpecies(firstTermRaw(step4.ox))
    const redToken = canonicalSpecies(firstTermRaw(step4.red))
    const oxF = normalizeTokenFormula(oxToken)
    const redF = normalizeTokenFormula(redToken)
    return {
      prompt: 'How many electrons does each half-reaction exchange?',
      fields: [
        {
          id: 'ox',
          label: `e⁻ lost in the oxidation half (${prettyFormula(oxToken)})`,
          target: m.eOx,
          hint: electronHint(preset.skeleton, step4.ox, oxF, 'oxidised', m.eOx, oxToken),
        },
        {
          id: 'red',
          label: `e⁻ gained in the reduction half (${prettyFormula(redToken)})`,
          target: m.eRed,
          hint: electronHint(preset.skeleton, step4.red, redF, 'reduced', m.eRed, redToken),
        },
      ],
      explanation: `The oxidation half gives up ${m.eOx} e⁻ and the reduction half takes up ${m.eRed} e⁻.`,
    }
  }
  if (index === 4) {
    return {
      prompt: 'Which multipliers make the electrons match?',
      fields: [
        {
          id: 'ox',
          label: 'Multiplier for the oxidation half',
          target: m.multOx,
          hint: `The electron counts are ${m.eOx} and ${m.eRed}. Their lowest common multiple is ${m.common}, so the oxidation half needs ${m.common} ÷ ${m.eOx}.`,
        },
        {
          id: 'red',
          label: 'Multiplier for the reduction half',
          target: m.multRed,
          hint: `The reduction half has ${m.eRed} e⁻, so it needs ${m.common} ÷ ${m.eRed} = ${m.multRed} to reach ${m.common} e⁻.`,
        },
      ],
      explanation: `Multiplying the oxidation half by ${m.multOx} and the reduction half by ${m.multRed} gives ${m.common} e⁻ on each side.`,
    }
  }
  return undefined
}

/** The first reactant of a half-reaction, without its coefficient, e.g. "I-" or "Cr(OH)3". */
function firstTermRaw(eq: string): string {
  const first = eq.split(' -> ')[0].split(' + ')[0].trim()
  return first.replace(/^\d+/, '')
}

/** Specific feedback for an electron count: the change per atom, the atoms, and the coefficient in the half-reaction. */
function electronHint(
  skeleton: string,
  halfEq: string,
  species: string,
  role: 'oxidised' | 'reduced',
  target: number,
  speciesToken: string,
): string {
  const counts = parseFormula(species)
  const shown = prettyFormula(speciesToken)
  const coefficient = reactantCount(halfEq, species)
  const change = analyseRedox(skeleton).changes.find(
    (c) =>
      (counts[c.element] ?? 0) > 0 &&
      (role === 'oxidised' ? c.changePerAtom.num > 0 : c.changePerAtom.num < 0) &&
      speciesOxidationNumber(speciesToken, c.element) === rationalToNumber(c.from),
  )
  if (!change) return `Count the electrons from the change in oxidation number of the redox-active element in ${shown}.`
  const per = Math.abs(rationalToNumber(change.changePerAtom))
  const atoms = counts[change.element] ?? 1
  const n = per * atoms * coefficient
  if (n !== target) return `Count the electrons from the change in oxidation number of ${change.element} in ${shown}.`
  const verb = role === 'oxidised' ? 'loses' : 'gains'
  const perUnit = per * atoms
  const change1 = `${change.element} goes from ${formatOxState(rationalToNumber(change.from))} to ${formatOxState(
    rationalToNumber(change.to),
  )}`
  const unit = `each ${shown} ${verb} ${perUnit} e⁻${atoms > 1 ? ` (${per} per ${change.element} × ${atoms} atoms)` : ''}`
  const count = coefficient > 1 ? `; the half-reaction has ${coefficient} × ${shown}, so ${n} e⁻ in all` : ''
  return `${change1}, so ${unit}${count}.`
}

function withOxidationNumber(
  preset: BalancerPreset,
  base: BalancerStepView,
  index: number,
  steps: readonly { equationMhchem: string }[],
): BalancerStepView {
  if (index === 0) return base
  const analysis = analyseRedox(preset.skeleton)
  const roles = base.roles

  const oxSpecies = tokenWithRole(preset.skeleton, roles.ox)
  const redSpecies = tokenWithRole(preset.skeleton, roles.red)
  if (!oxSpecies || !redSpecies) return base
  // Disproportionation (one species both oxidised and reduced) has no two-species ledger.
  if (normalizeTokenFormula(oxSpecies) === normalizeTokenFormula(redSpecies)) return base

  const reductantChange = analysis.changes.find(
    (c) => c.changePerAtom.num > 0 && speciesOxidationNumber(oxSpecies, c.element) === rationalToNumber(c.from),
  )
  const oxidantChange = analysis.changes.find(
    (c) => c.changePerAtom.num < 0 && speciesOxidationNumber(redSpecies, c.element) === rationalToNumber(c.from),
  )
  if (!reductantChange || !oxidantChange) return base

  const oxElectrons = Math.abs(rationalToNumber(reductantChange.changePerAtom)) *
    (parseFormula(normalizeTokenFormula(oxSpecies))[reductantChange.element] ?? 1)
  const redElectrons = Math.abs(rationalToNumber(oxidantChange.changePerAtom)) *
    (parseFormula(normalizeTokenFormula(redSpecies))[oxidantChange.element] ?? 1)
  const common = lcm(oxElectrons, redElectrons)

  const onCards = {
    ox: {
      species: oxSpecies,
      element: reductantChange.element,
      from: rationalToNumber(reductantChange.from),
      to: rationalToNumber(reductantChange.to),
      electrons: oxElectrons,
      multiplier: common / oxElectrons,
    },
    red: {
      species: redSpecies,
      element: oxidantChange.element,
      from: rationalToNumber(oxidantChange.from),
      to: rationalToNumber(oxidantChange.to),
      electrons: redElectrons,
      multiplier: common / redElectrons,
    },
    lcm: common,
  }

  const view: BalancerStepView = { ...base, onCards }
  if (index === 1) {
    const target = steps[2]
    const oxCoef = reactantCount(target.equationMhchem, normalizeTokenFormula(oxSpecies))
    const redCoef = reactantCount(target.equationMhchem, normalizeTokenFormula(redSpecies))
    view.challenge = {
      prompt: 'Electrons lost must equal electrons gained. What multiplier does each species need?',
      fields: [
        {
          id: 'ox',
          label: `Multiplier for ${prettyFormula(oxSpecies)}`,
          target: oxCoef,
          hint: `${reductantChange.element} goes from ${formatOxState(rationalToNumber(reductantChange.from))} to ${formatOxState(
            rationalToNumber(reductantChange.to),
          )}, so each ${prettyFormula(oxSpecies)} loses ${oxElectrons} e⁻. The lowest common multiple is ${common}, so the multiplier is ${common} ÷ ${oxElectrons} = ${oxCoef}.`,
        },
        {
          id: 'red',
          label: `Multiplier for ${prettyFormula(redSpecies)}`,
          target: redCoef,
          hint: `${oxidantChange.element} goes from ${formatOxState(rationalToNumber(oxidantChange.from))} to ${formatOxState(
            rationalToNumber(oxidantChange.to),
          )}, so each ${prettyFormula(redSpecies)} gains ${redElectrons} e⁻. The multiplier is ${common} ÷ ${redElectrons} = ${redCoef}.`,
        },
      ],
      explanation: `Each oxidant unit gains ${redElectrons} e⁻ and each reductant unit loses ${oxElectrons} e⁻, so both sides need ${common} e⁻.`,
    }
  } else if (index === 2) {
    const formula = preset.medium === 'acidic' ? 'H' : 'OH'
    const sp = preset.medium === 'acidic' ? 'H⁺' : 'OH⁻'
    const unit = preset.medium === 'acidic' ? 1 : -1
    const added = countIn(steps[3].equationMhchem, formula) - countIn(steps[2].equationMhchem, formula)
    {
      const v = isBalanced(steps[2].equationMhchem)
      const diff = Math.abs(v.chargeBalance.reactant - v.chargeBalance.product)
      view.challenge = {
        prompt: `How many ${sp} must be added to balance the net ionic charge?`,
        fields: [
          {
            id: 'count',
            label: `${sp} to add`,
            target: added,
            hint: `The net charge is ${formatOxState(v.chargeBalance.reactant)} on the left and ${formatOxState(
              v.chargeBalance.product,
            )} on the right, a difference of ${diff}. Each ${sp} carries ${unit > 0 ? '+1' : '−1'}, so add ${added}.`,
          },
        ],
        explanation: `${added} ${sp} make both sides carry the same net charge.`,
      }
    }
  } else if (index === 3) {
    const added = countIn(steps[4].equationMhchem, 'H2O') - countIn(steps[3].equationMhchem, 'H2O')
    const v = isBalanced(steps[3].equationMhchem)
    const h = v.atomBalance.H
    const missing = Math.abs((h?.reactant ?? 0) - (h?.product ?? 0))
    view.challenge = {
      prompt: 'How many H₂O must be added to balance hydrogen?',
      fields: [
        {
          id: 'count',
          label: 'H₂O to add',
          target: added,
          hint: `Hydrogen is ${h?.reactant ?? 0} on the left and ${h?.product ?? 0} on the right, so ${missing} H atoms are missing. Each H₂O brings 2, so add ${added}.`,
        },
      ],
      explanation: `${added} H₂O supply the ${missing} missing hydrogen atoms.`,
    }
  }
  return view
}

/** Coefficient of a formula on the reactant side only (for multipliers). */
function reactantCount(equation: string, formula: string): number {
  const left = equation.split(' -> ')[0]
  let total = 0
  for (const term of left.split(' + ')) {
    const t = term.trim()
    const lead = /^\d+/.exec(t)
    if (normalizeTokenFormula(t) === formula) total += lead ? Number(lead[0]) : 1
  }
  return total
}

/** Counts a formula's coefficient in an equation string, across both sides. */
function countIn(equation: string, formula: string): number {
  let total = 0
  for (const term of equation.split(' -> ').join(' + ').split(' + ')) {
    const t = term.trim()
    const lead = /^\d+/.exec(t)
    const coef = lead ? Number(lead[0]) : 1
    if (normalizeTokenFormula(t) === formula) total += coef
  }
  return total
}

/** Returns the skeleton token (with written charge) whose formula is one of the roles. */
function tokenWithRole(skeleton: string, roleFormulas: readonly string[]): string {
  const left = skeleton.split(' -> ')[0]
  const tokens = left.split(' + ').map((t) => t.trim())
  const found = tokens.find((t) => roleFormulas.includes(normalizeTokenFormula(canonicalSpecies(t))))
  return found ? canonicalSpecies(found) : ''
}

