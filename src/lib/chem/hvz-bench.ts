/**
 * Model for the Section 14 bench: Hell–Volhard–Zelinsky halogenation of the α-carbon,
 * nitration of the ring, and Friedel–Crafts on an aromatic acid. Every product is a
 * Kekulé SMILES; names and formulas are computed from them by the caller.
 */

export type BenchHalogen = 'Cl' | 'Br'
export type BenchReaction = 'hvz' | 'nitration' | 'friedel-crafts'

export interface BenchAcid {
  id: string
  smiles: string
  /** Index of the α-carbon in `smiles` (aliphatic acids). */
  alphaIndex: number | null
  /** Hydrogens on the α-carbon. */
  alphaH: number
  /**
   * Aliphatic acids built from a template: the chain before the α-carbon, and the
   * substituents already on it. Halogens are added after them.
   */
  template?: { prefix: string; existing: readonly string[] }
  ring: boolean
}

export const BENCH_ACIDS: readonly BenchAcid[] = [
  { id: 'butanoic', smiles: 'CCCC(O)=O', alphaIndex: 2, alphaH: 2, template: { prefix: 'CC', existing: [] }, ring: false },
  { id: 'propanoic', smiles: 'CCC(O)=O', alphaIndex: 1, alphaH: 2, template: { prefix: 'C', existing: [] }, ring: false },
  { id: 'ethanoic', smiles: 'CC(O)=O', alphaIndex: 0, alphaH: 3, template: { prefix: '', existing: [] }, ring: false },
  { id: 'bromopropanoic', smiles: 'CC(Br)C(O)=O', alphaIndex: 1, alphaH: 1, template: { prefix: 'C', existing: ['Br'] }, ring: false },
  { id: 'bromoethanoic', smiles: 'C(Br)C(O)=O', alphaIndex: 0, alphaH: 2, template: { prefix: '', existing: ['Br'] }, ring: false },
  { id: 'dimethylpropanoic', smiles: 'CC(C)(C)C(O)=O', alphaIndex: null, alphaH: 0, ring: false },
  { id: 'benzoic', smiles: 'OC(=O)C1=CC=CC=C1', alphaIndex: null, alphaH: 0, ring: true },
]

/** Ring atoms meta to COOH in benzoic acid's SMILES (atom indices). */
export const BENZOIC_META_ATOMS: readonly number[] = [5, 7]

const NITRO_BENZOIC = 'OC(=O)C1=CC=CC(=C1)[N+]([O-])=O'

export function benchAcid(id: string): BenchAcid {
  return BENCH_ACIDS.find((a) => a.id === id) ?? BENCH_ACIDS[0]
}

/** Steps the bench can take on this acid: at least 1, at most its α-H count. */
export function maxHvzSteps(acid: BenchAcid): number {
  return Math.max(1, acid.alphaH)
}

/** SMILES after `steps` HVZ substitutions (one α-H swapped per step). */
export function hvzProductSmiles(acid: BenchAcid, halogen: BenchHalogen, steps: number): string | null {
  if (!acid.template || acid.alphaH === 0) return null
  const n = Math.min(Math.max(1, steps), acid.alphaH)
  const subs = [...acid.template.existing, ...Array<string>(n).fill(halogen)]
  const alpha = `C(${subs.join(')(')})`
  return `${acid.template.prefix}${alpha}C(O)=O`
}

export interface BenchOutcome {
  /** Product SMILES, or null when nothing forms. */
  productSmiles: string | null
  /** Reason shown with the result (NCERT's reason where NCERT gives one). */
  reason: string
}

export function benchOutcome(acid: BenchAcid, reaction: BenchReaction, halogen: BenchHalogen, steps: number): BenchOutcome {
  if (reaction === 'hvz') {
    const product = hvzProductSmiles(acid, halogen, steps)
    if (!product) return { productSmiles: null, reason: 'No reaction: there is no α-hydrogen to replace.' }
    const n = Math.min(Math.max(1, steps), acid.alphaH)
    return { productSmiles: product, reason: `Each step swaps one α-H for ${halogen}: ${n} of ${acid.alphaH} α-H replaced.` }
  }
  if (!acid.ring) {
    return {
      productSmiles: null,
      reason: reaction === 'nitration' ? 'No ring: nitration needs an aromatic ring, so this acid is not affected.' : 'No ring: Friedel–Crafts needs an aromatic ring.',
    }
  }
  if (reaction === 'nitration') {
    return { productSmiles: NITRO_BENZOIC, reason: 'COOH is electron-withdrawing, so the NO₂ goes to the meta position.' }
  }
  return { productSmiles: null, reason: 'No reaction: COOH deactivates the ring, and AlCl₃ binds to the COOH group.' }
}
