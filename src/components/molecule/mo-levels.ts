/**
 * Molecular orbital bookkeeping for the MO energy diagram. Energies are
 * schematic (only their order and spacing matter), in arbitrary units where a
 * larger value is a higher energy.
 */

/** Every MO in a homonuclear second-period diagram. Starred keys are antibonding. */
export type MOKey = 's1s' | 's*1s' | 's2s' | 's*2s' | 's2p' | 'p2p' | 'p*2p' | 's*2p'

/**
 * `mixed`: the s and p levels mix, so pi2p lies below sigma2p (B2, C2, N2).
 * `unmixed`: sigma2p lies below pi2p (O2, F2).
 */
export type MOOrder = 'mixed' | 'unmixed'

export interface MOLevel {
  key: MOKey
  /** Schematic energy, larger is higher. */
  energy: number
  /** Number of degenerate orbitals at this level: 2 for the pi pairs, 1 otherwise. */
  degeneracy: 1 | 2
  /** True for bonding orbitals, false for antibonding. */
  bonding: boolean
}

const ENERGY_UNMIXED: Record<MOKey, number> = {
  's1s': -8,
  's*1s': 8,
  's2s': 34,
  's*2s': 50,
  's2p': 62,
  'p2p': 68,
  'p*2p': 84,
  's*2p': 96,
}

const ENERGY_MIXED: Record<MOKey, number> = {
  's1s': -8,
  's*1s': 8,
  's2s': 34,
  's*2s': 50,
  's2p': 68,
  'p2p': 62,
  'p*2p': 84,
  's*2p': 96,
}

const DEGENERATE: ReadonlySet<MOKey> = new Set(['p2p', 'p*2p'])
const BONDING: ReadonlySet<MOKey> = new Set(['s1s', 's2s', 's2p', 'p2p'])

/** Schematic energy of the atomic orbitals (1s, 2s, 2p), on the same scale as the MOs. */
export const AO_ENERGY = { '1s': 0, '2s': 40, '2p': 75 } as const
export type AOKey = keyof typeof AO_ENERGY

/** Which atomic orbital each MO correlates with. */
export const MO_CORRELATION: Record<MOKey, AOKey> = {
  's1s': '1s',
  's*1s': '1s',
  's2s': '2s',
  's*2s': '2s',
  's2p': '2p',
  'p2p': '2p',
  'p*2p': '2p',
  's*2p': '2p',
}

/** The MO levels in order from lowest to highest energy. */
export function moLevels(order: MOOrder): MOLevel[] {
  const table = order === 'unmixed' ? ENERGY_UNMIXED : ENERGY_MIXED
  const keys = Object.keys(table) as MOKey[]
  return keys
    .map((key) => ({
      key,
      energy: table[key],
      degeneracy: DEGENERATE.has(key) ? (2 as const) : (1 as const),
      bonding: BONDING.has(key),
    }))
    .sort((a, b) => a.energy - b.energy)
}

/**
 * Hund's rule for a set of degenerate orbitals: each orbital takes one electron
 * before any takes a second. Returns the electron count in each orbital (0, 1 or 2).
 */
export function distributeElectrons(count: number, orbitals: number): number[] {
  const result = new Array<number>(orbitals).fill(0)
  let left = Math.max(0, Math.min(count, orbitals * 2))
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < orbitals && left > 0; i++) {
      result[i] += 1
      left -= 1
    }
  }
  return result
}

export type MOElectrons = Partial<Record<MOKey, number>>

/** Bond order = (bonding electrons - antibonding electrons) / 2. */
export function bondOrder(electrons: MOElectrons): number {
  let bonding = 0
  let antibonding = 0
  for (const [key, n] of Object.entries(electrons) as [MOKey, number][]) {
    if (BONDING.has(key)) bonding += n
    else antibonding += n
  }
  return (bonding - antibonding) / 2
}

/** Unpaired electrons: an orbital holding exactly one electron. Non-zero means paramagnetic. */
export function unpairedElectrons(electrons: MOElectrons): number {
  let unpaired = 0
  for (const [key, n] of Object.entries(electrons) as [MOKey, number][]) {
    if (DEGENERATE.has(key)) {
      unpaired += distributeElectrons(n, 2).filter((k) => k === 1).length
    } else if (n === 1) {
      unpaired += 1
    }
  }
  return unpaired
}

export function magnetism(electrons: MOElectrons): 'paramagnetic' | 'diamagnetic' {
  return unpairedElectrons(electrons) > 0 ? 'paramagnetic' : 'diamagnetic'
}
