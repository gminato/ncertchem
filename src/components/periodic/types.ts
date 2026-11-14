export type Block = 's' | 'p' | 'd' | 'f'
export type Category = 'metal' | 'non-metal' | 'metalloid'

export interface ElementRecord {
  Z: number
  symbol: string
  name: string
  atomicMass: number
  /** Group 1 to 18, or null for f-block elements. */
  group: number | null
  period: number
  block: Block
  category: Category
  electronegativity: number | null
  firstIonizationEnergyEv: number | null
  electronAffinity: number | null
  atomicRadius: number | null
}

/** Row 1 to 7 for the main table, 9 and 10 for the detached f-block rows. Col 1 to 18. */
export interface TablePosition {
  row: number
  col: number
}

export type PositionFn = (Z: number) => TablePosition
