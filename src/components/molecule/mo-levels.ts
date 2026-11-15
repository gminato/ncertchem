/**
 * Layout for the MO energy diagram. Filling, bond order and magnetism come from
 * src/lib/chem/molecular-orbitals.ts; this module only chooses where each level is drawn.
 * Energies are schematic (only their order and spacing matter), larger is higher.
 */

/** Schematic energy of each MO level, by its label, for the two NCERT energy orders. */
const ENERGY_UNMIXED: Readonly<Record<string, number>> = {
  'σ1s': 0,
  'σ*1s': 16,
  'σ2s': 40,
  'σ*2s': 58,
  'σ2p': 80,
  'π2p': 96,
  'π*2p': 116,
  'σ*2p': 136,
}

const ENERGY_MIXED: Readonly<Record<string, number>> = {
  'σ1s': 0,
  'σ*1s': 16,
  'σ2s': 40,
  'σ*2s': 58,
  'π2p': 80,
  'σ2p': 96,
  'π*2p': 116,
  'σ*2p': 136,
}

/** Schematic energy of the atomic orbitals (1s, 2s, 2p), on the same scale as the MOs. */
export const AO_ENERGY = { '1s': 0, '2s': 40, '2p': 88 } as const
export type AOKey = keyof typeof AO_ENERGY

/** The atomic orbital each MO level correlates with. */
export function correlatedAO(label: string): AOKey {
  if (label.endsWith('1s')) return '1s'
  if (label.endsWith('2s')) return '2s'
  return '2p'
}

/** Schematic energy of an MO level. Unknown labels sit at the top. */
export function levelEnergy(label: string, mixing: boolean): number {
  const table = mixing ? ENERGY_MIXED : ENERGY_UNMIXED
  return table[label] ?? 136
}

/**
 * Splits a level's electrons over its orbitals for drawing, given the total and the
 * unpaired count from the lib. Paired orbitals fill first, then the singles, so a π
 * pair with four electrons is [2, 2] and one with two unpaired is [1, 1].
 */
export function drawnOrbitalCounts(electrons: number, unpaired: number, degeneracy: 1 | 2): number[] {
  const pairs = (electrons - unpaired) / 2
  const counts = new Array<number>(degeneracy).fill(0)
  let doubly = pairs
  for (let i = 0; i < degeneracy && doubly > 0; i++) {
    counts[i] = 2
    doubly -= 1
  }
  let singles = unpaired
  for (let i = 0; i < degeneracy && singles > 0; i++) {
    if (counts[i] === 0) {
      counts[i] = 1
      singles -= 1
    }
  }
  return counts
}
