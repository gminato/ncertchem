/**
 * Why an element sits where it does: the period, group and block of element Z, each with a
 * sentence that gives the reason (NCERT Class 11 Unit 3, sections 3.5 and 3.6). Period, group
 * and block come from periodic-data.ts. For Z up to 36 the reasons use the ground-state
 * configuration from quantum.ts, and the group is checked against the data in the tests.
 * Past Z = 36 the reasons are stated from the position alone.
 */

import { elementByZ, type Block } from './periodic-data'
import { aufbauOrder, electronConfiguration } from './quantum'

export interface PlacementReasoning {
  Z: number
  symbol: string
  /** Display name: NCERT's spelling where it differs. */
  name: string
  period: number
  group: number | null
  block: Block
  periodReason: string
  groupReason: string
  blockReason: string
  /** Noble-gas-core configuration, e.g. "[Ar] 3d⁶ 4s²". Null past Z = 36. */
  configuration: string | null
  /** Subshells to draw as orbital boxes: the valence shell and any (n − 1)d subshell. Empty past Z = 36. */
  valenceSubshells: string[]
  /** The subshell that receives the last electron, from the Aufbau order. Null past Z = 36. */
  lastSubshell: string | null
}

const SUPERSCRIPT = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
const sup = (n: number) => String(n).split('').map((d) => SUPERSCRIPT[Number(d)]).join('')

function requireZ(Z: number): void {
  if (!Number.isInteger(Z) || Z < 1 || Z > 118) {
    throw new RangeError(`Atomic number Z must be an integer from 1 to 118 (received ${Z})`)
  }
}

/** Number of electrons in the subshells of a configuration that match a predicate. */
function countWhere(
  subshells: readonly { label: string; electrons: number }[],
  pred: (label: string) => boolean
): number {
  return subshells.filter((s) => pred(s.label)).reduce((sum, s) => sum + s.electrons, 0)
}

/**
 * Group of element Z worked out from its configuration (Z up to 36). The rule for each block:
 * s-block, the outer ns electrons; p-block, 10 plus the outer ns² np electrons; d-block, the
 * (n − 1)d electrons plus the ns electrons; helium, 18 because its shell is full.
 *
 * @throws {RangeError} If Z is not an integer from 1 to 36
 */
export function groupFromConfiguration(Z: number): number {
  if (!Number.isInteger(Z) || Z < 1 || Z > 36) {
    throw new RangeError(`groupFromConfiguration is defined for Z from 1 to 36 (received ${Z})`)
  }
  if (Z === 2) return 18
  const { subshells } = electronConfiguration(Z)
  const block = elementByZ(Z).block
  const period = elementByZ(Z).period
  const outerS = countWhere(subshells, (l) => l === `${period}s`)
  if (block === 's') return outerS
  if (block === 'p') return 10 + outerS + countWhere(subshells, (l) => l === `${period}p`)
  if (block === 'd') {
    return countWhere(subshells, (l) => l === `${period - 1}d`) + outerS
  }
  throw new RangeError(`Z=${Z} has no group from its configuration`)
}

/**
 * The placement reasoning for element Z. The text is written for a Learner, so the numbers in
 * it come straight from the configuration or the table.
 *
 * @throws {RangeError} If Z is not an integer from 1 to 118
 */
export function placementReasoning(Z: number): PlacementReasoning {
  requireZ(Z)
  const e = elementByZ(Z)
  const name = e.ncertName ?? e.name
  const { period, group, block } = e

  const periodReason =
    e.fBlockRow === 'lanthanoid'
      ? `Period ${period}: the lanthanoids belong to the n = ${period} shell, and they sit in a detached row below the table.`
      : e.fBlockRow === 'actinoid'
        ? `Period ${period}: the actinoids belong to the n = ${period} shell, and they sit in a detached row below the table.`
        : `Period ${period}: the outermost shell is n = ${period}, and the period number is that highest principal quantum number.`

  const inTable = Z <= 36
  const config = inTable ? electronConfiguration(Z) : null
  const subshells = config ? config.subshells : []
  const configuration = config ? config.nobleGasCore : null

  // The subshell of the last electron, found from the Aufbau order.
  const order = aufbauOrder('7p')
  const filled = new Set(subshells.filter((s) => s.electrons > 0).map((s) => s.label))
  const lastSubshell = config
    ? [...order].reverse().find((label) => filled.has(label)) ?? null
    : null

  let groupReason: string
  if (group === null) {
    groupReason = 'No group: f-block elements sit in the two detached rows, not in the 18 columns.'
  } else if (Z === 2) {
    groupReason = 'Group 18: helium is an s-block element, but its shell is full (1s²), so it goes with the noble gases.'
  } else if (!config) {
    groupReason = `Group ${group}: the position follows from the outer electrons. The configuration is not shown past Z = 36.`
  } else if (block === 's') {
    const count = countWhere(subshells, (l) => l === `${period}s`)
    groupReason = `Group ${group}: the outer shell holds ${count} s electron${count === 1 ? '' : 's'}, which is ${period}s${sup(count)}, and the group number equals that count.`
  } else if (block === 'p') {
    const outerS = countWhere(subshells, (l) => l === `${period}s`)
    const outerP = countWhere(subshells, (l) => l === `${period}p`)
    groupReason = `Group ${group}: the outer shell is ${period}s²${period}p${sup(outerP)}, which holds ${outerS + outerP} electrons, and 10 + ${outerS + outerP} = ${group}.`
  } else {
    const dCount = countWhere(subshells, (l) => l === `${period - 1}d`)
    const sCount = countWhere(subshells, (l) => l === `${period}s`)
    groupReason = `Group ${group}: the (n − 1)d and ns electrons add up to ${dCount} + ${sCount} = ${group}.`
  }

  const blockReason = config && lastSubshell
    ? `Block ${block}: the last electron enters ${lastSubshell}, and that is a ${block} subshell.`
    : `Block ${block}: the block follows from the subshell that receives the last electron.`

  // Valence subshells to draw: the outer shell, and the (n − 1)d subshell of a d-block element.
  const valenceSubshells = config
    ? subshells
        .filter((s) => {
          const n = Number(s.label[0])
          const l = s.label[1]
          return n === period || (block === 'd' && l === 'd' && n === period - 1)
        })
        .map((s) => s.label)
    : []

  return {
    Z,
    symbol: e.symbol,
    name,
    period,
    group,
    block,
    periodReason,
    groupReason,
    blockReason,
    configuration,
    valenceSubshells,
    lastSubshell,
  }
}
